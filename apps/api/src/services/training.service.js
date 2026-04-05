const fs = require("fs/promises")
const path = require("path")
const { spawn } = require("child_process")
const { env } = require("../config/env")
const { ApiError } = require("../utils/ApiError")
const { prepareTrainingHandoff } = require("./onboarding.service")
const { DatasetProfile } = require("../models/datasetProfile.model")
const { ModelRegistry } = require("../models/modelRegistry.model")
const { Tenant } = require("../models/tenant.model")
const { TrainingJob } = require("../models/trainingJob.model")
const { recordAnalyticsEventSafe } = require("./analytics.service")

const readJsonIfExists = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const buildModelVersion = (tenantId) => {
  return `tenant-custom-${String(tenantId)}-${Date.now()}`
}

const buildPythonChildEnv = () => {
  const existingPythonPath = process.env.PYTHONPATH || ""
  const trainingPath = env.mlTrainingServiceDir
  const pythonPath = existingPythonPath
    ? `${trainingPath}${path.delimiter}${existingPythonPath}`
    : trainingPath

  return {
    ...process.env,
    PYTHONPATH: pythonPath
  }
}

const ensureTrainingPrerequisites = async (tenantId, profileId) => {
  const handoff = await prepareTrainingHandoff(tenantId, profileId)
  const datasetProfile = await DatasetProfile.findOne({
    _id: handoff.datasetProfileId,
    tenantId
  })

  if (!datasetProfile) {
    throw new ApiError(404, "Dataset profile not found for training handoff")
  }

  if (!datasetProfile.storage?.filePath) {
    throw new ApiError(409, "This onboarding profile does not have a stored dataset file. Re-upload the dataset before training.")
  }

  return { handoff, datasetProfile }
}

const runTrainingJobInBackground = async (jobId) => {
  const job = await TrainingJob.findById(jobId)
  if (!job) {
    return
  }

  const model = await ModelRegistry.findById(job.modelRegistryId)
  const tenant = await Tenant.findById(job.tenantId)
  if (!model || !tenant) {
    job.status = "failed"
    job.execution = {
      ...job.execution,
      finishedAt: new Date(),
      errorMessage: "Training dependencies not found for this job."
    }
    await job.save()
    return
  }

  const artifactsDir = path.join(env.mlTrainingArtifactsDir, `tenant-${job.tenantId}`, `job-${job._id}`)
  const args = [
    env.mlTrainingScriptPath,
    "--input-path",
    job.trainingContract.storedFilePath,
    "--artifacts-dir",
    artifactsDir,
    "--target-column",
    job.trainingContract.targetColumn,
    "--feature-mappings-json",
    JSON.stringify(job.trainingContract.featureMappings || []),
    "--tenant-id",
    String(job.tenantId),
    "--job-id",
    String(job._id),
    "--model-version",
    model.version
  ]

  job.status = "running"
  job.execution = {
    ...job.execution,
    command: [env.mlTrainingPythonCmd, ...args].join(" "),
    cwd: env.mlTrainingServiceDir,
    startedAt: new Date(),
    stdout: "",
    stderr: "",
    exitCode: null,
    errorMessage: ""
  }
  model.status = "training"
  tenant.onboardingStatus = "training"

  await Promise.all([job.save(), model.save(), tenant.save()])

  let stdout = ""
  let stderr = ""
  let finished = false

  const finalize = async ({ status, exitCode = null, errorMessage = "", message = "" }) => {
    if (finished) {
      return
    }

    finished = true
    const finishedAt = new Date()
    const startedAt = job.execution?.startedAt ? new Date(job.execution.startedAt) : finishedAt
    const durationMs = finishedAt.getTime() - startedAt.getTime()

    job.status = status
    job.execution = {
      ...job.execution,
      finishedAt,
      durationMs,
      stdout,
      stderr,
      exitCode,
      errorMessage
    }

    if (status === "completed") {
      const [metadata, metrics] = await Promise.all([
        readJsonIfExists(path.join(artifactsDir, "metadata.json")),
        readJsonIfExists(path.join(artifactsDir, "metrics.json"))
      ])

      job.summary = {
        message: message || "Training completed successfully.",
        metrics,
        artifactDir: artifactsDir
      }

      model.status = "ready"
      model.artifactDir = artifactsDir
      model.metrics = metrics
      model.metadata = metadata
      tenant.onboardingStatus = "model_ready"

      await recordAnalyticsEventSafe({
        eventName: "training_job_completed",
        source: "server",
        pathGroup: "workspace",
        route: "/app/training",
        tenantId: job.tenantId,
        userId: job.requestedBy?.userId,
        context: {
          jobId: job._id,
          modelId: model._id,
          modelVersion: model.version,
          durationMs,
          targetColumn: job.trainingContract?.targetColumn,
          featureCount: job.trainingContract?.featureMappings?.length || 0
        }
      })
    } else {
      job.summary = {
        message: errorMessage || message || "Training failed.",
        metrics: null,
        artifactDir: artifactsDir
      }

      model.status = "failed"
      tenant.onboardingStatus = "training_ready"

      await recordAnalyticsEventSafe({
        eventName: "training_job_failed",
        source: "server",
        pathGroup: "workspace",
        route: "/app/training",
        tenantId: job.tenantId,
        userId: job.requestedBy?.userId,
        context: {
          jobId: job._id,
          modelId: model._id,
          modelVersion: model.version,
          durationMs,
          errorMessage: errorMessage || message || ""
        }
      })
    }

    await Promise.all([job.save(), model.save(), tenant.save()])
  }

  const child = spawn(env.mlTrainingPythonCmd, args, {
    cwd: env.mlTrainingServiceDir,
    windowsHide: true,
    env: buildPythonChildEnv()
  })

  const timeoutId = setTimeout(() => {
    stderr += `\nTraining exceeded timeout of ${env.mlTrainingTimeoutMs} ms and was terminated.`
    child.kill()
  }, env.mlTrainingTimeoutMs)

  child.stdout.on("data", (chunk) => {
    stdout += String(chunk)
  })

  child.stderr.on("data", (chunk) => {
    stderr += String(chunk)
  })

  child.on("error", async (error) => {
    clearTimeout(timeoutId)
    await finalize({
      status: "failed",
      errorMessage: error.message,
      message: "Training could not start."
    })
  })

  child.on("close", async (code) => {
    clearTimeout(timeoutId)

    if (code === 0) {
      await finalize({
        status: "completed",
        exitCode: code,
        message: "Training completed successfully."
      })
      return
    }

    await finalize({
      status: "failed",
      exitCode: code,
      errorMessage: stderr || stdout || `Training exited with code ${code}.`,
      message: "Training failed."
    })
  })
}

const createTrainingJobFromHandoff = async (tenantId, { profileId = "", requestedBy }) => {
  const { handoff, datasetProfile } = await ensureTrainingPrerequisites(tenantId, profileId)
  const modelVersion = buildModelVersion(tenantId)

  const model = await ModelRegistry.create({
    tenantId,
    datasetProfileId: datasetProfile._id,
    modelKey: "tenant_custom",
    version: modelVersion,
    status: "queued",
    featureMappings: handoff.phase3ContractPreview?.featureMappings || [],
    targetColumn: handoff.confirmedTargetColumn,
    selectedChurnDefinition: handoff.selectedChurnDefinition
  })

  const job = await TrainingJob.create({
    tenantId,
    datasetProfileId: datasetProfile._id,
    modelRegistryId: model._id,
    requestedBy,
    status: "queued",
    trainingContract: {
      confirmedIndustry: handoff.confirmedIndustry,
      selectedChurnDefinition: handoff.selectedChurnDefinition,
      targetColumn: handoff.confirmedTargetColumn,
      featureMappings: handoff.phase3ContractPreview?.featureMappings || [],
      rowCount: handoff.phase3ContractPreview?.rowCount || datasetProfile.rowCount,
      fileName: datasetProfile.fileName,
      storedFilePath: datasetProfile.storage.filePath
    },
    summary: {
      message: "Training job queued. The backend will start it in the background.",
      metrics: null,
      artifactDir: ""
    }
  })

  model.trainingJobId = job._id
  await model.save()

  await Tenant.findByIdAndUpdate(tenantId, {
    $set: {
      industryType: handoff.confirmedIndustry === "telecom" ? "telecom" : "custom",
      onboardingStatus: "training_ready"
    }
  })

  await recordAnalyticsEventSafe({
    eventName: "training_job_started",
    source: "server",
    pathGroup: "workspace",
    route: "/app/training",
    tenantId,
    userId: requestedBy?.userId,
    context: {
      jobId: job._id,
      modelId: model._id,
      modelVersion,
      targetColumn: handoff.confirmedTargetColumn,
      featureCount: handoff.phase3ContractPreview?.featureMappings?.length || 0
    }
  })

  setImmediate(() => {
    runTrainingJobInBackground(job._id).catch(async (error) => {
      const failedJob = await TrainingJob.findById(job._id)
      const failedModel = await ModelRegistry.findById(model._id)
      await Tenant.findByIdAndUpdate(tenantId, { $set: { onboardingStatus: "training_ready" } })

      if (failedJob) {
        failedJob.status = "failed"
        failedJob.execution = {
          ...failedJob.execution,
          finishedAt: new Date(),
          errorMessage: error.message
        }
        failedJob.summary = {
          message: error.message,
          metrics: null,
          artifactDir: ""
        }
        await failedJob.save()
      }

      if (failedModel) {
        failedModel.status = "failed"
        await failedModel.save()
      }
    })
  })

  return {
    job,
    model,
    message: "Training job queued. Open the Training page to watch progress."
  }
}

const listTrainingJobs = async (tenantId) => {
  return TrainingJob.find({ tenantId })
    .sort({ createdAt: -1 })
    .lean()
}

const getLatestTrainingJob = async (tenantId) => {
  return TrainingJob.findOne({ tenantId })
    .sort({ createdAt: -1 })
    .lean()
}

const getTrainingJobById = async (tenantId, jobId) => {
  const job = await TrainingJob.findOne({ _id: jobId, tenantId }).lean()
  if (!job) {
    throw new ApiError(404, `Training job not found: ${jobId}`)
  }

  return job
}

const listRegisteredModels = async (tenantId) => {
  return ModelRegistry.find({ tenantId })
    .sort({ createdAt: -1 })
    .lean()
}

const getActiveModelForTenant = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId).lean()

  if (tenant?.currentModelId) {
    const currentModel = await ModelRegistry.findOne({
      _id: tenant.currentModelId,
      tenantId
    }).lean()

    if (currentModel) {
      return currentModel
    }
  }

  return ModelRegistry.findOne({
    tenantId,
    "deployment.isDeployed": true
  })
    .sort({ updatedAt: -1 })
    .lean()
}

const deployModelVersion = async (tenantId, modelId, notes = "") => {
  const model = await ModelRegistry.findOne({ _id: modelId, tenantId })
  if (!model) {
    throw new ApiError(404, `Model not found: ${modelId}`)
  }

  if (!["ready", "deployed"].includes(model.status)) {
    throw new ApiError(409, "Only a ready model can be deployed")
  }

  await ModelRegistry.updateMany(
    { tenantId, _id: { $ne: model._id } },
    {
      $set: {
        "deployment.isDeployed": false
      }
    }
  )

  model.status = "deployed"
  model.deployment = {
    isDeployed: true,
    deployedAt: new Date(),
    notes
  }
  await model.save()

  await Tenant.findByIdAndUpdate(tenantId, {
    $set: {
      currentModelId: model._id,
      industryType: "custom",
      onboardingStatus: "active"
    }
  })

  await recordAnalyticsEventSafe({
    eventName: "model_deployed",
    source: "server",
    pathGroup: "workspace",
    route: "/app/training",
    tenantId,
    context: {
      modelId: model._id,
      modelVersion: model.version,
      deployedAt: model.deployment?.deployedAt
    }
  })

  return model.toObject()
}

module.exports = {
  createTrainingJobFromHandoff,
  listTrainingJobs,
  getLatestTrainingJob,
  getTrainingJobById,
  listRegisteredModels,
  getActiveModelForTenant,
  deployModelVersion
}
