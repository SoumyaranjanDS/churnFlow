const { asyncHandler } = require("../utils/asyncHandler")
const { apiResponse } = require("../utils/apiResponse")
const {
  createTrainingJobFromHandoff,
  deployModelVersion,
  getActiveModelForTenant,
  getLatestTrainingJob,
  getTrainingJobById,
  listRegisteredModels,
  listTrainingJobs
} = require("../services/training.service")
const {
  createTrainingJobSchema,
  deployModelSchema
} = require("../validators/training.validator")

const createTrainingJob = asyncHandler(async (req, res) => {
  const payload = createTrainingJobSchema.parse(req.body || {})
  const result = await createTrainingJobFromHandoff(req.tenantId, {
    profileId: payload.profileId,
    requestedBy: {
      userId: req.user?.id,
      name: req.user?.name,
      email: req.user?.email
    }
  })

  return apiResponse(req, res, 202, "Training job queued", result)
})

const getTrainingJobList = asyncHandler(async (req, res) => {
  const items = await listTrainingJobs(req.tenantId)
  return apiResponse(req, res, 200, "Training jobs fetched", { items })
})

const getLatestTrainingJobSummary = asyncHandler(async (req, res) => {
  const job = await getLatestTrainingJob(req.tenantId)
  return apiResponse(req, res, 200, "Latest training job fetched", { job })
})

const getTrainingJobDetails = asyncHandler(async (req, res) => {
  const job = await getTrainingJobById(req.tenantId, req.params.jobId)
  return apiResponse(req, res, 200, "Training job fetched", { job })
})

const getModelList = asyncHandler(async (req, res) => {
  const items = await listRegisteredModels(req.tenantId)
  return apiResponse(req, res, 200, "Registered models fetched", { items })
})

const getCurrentModelSummary = asyncHandler(async (req, res) => {
  const model = await getActiveModelForTenant(req.tenantId)
  return apiResponse(req, res, 200, "Current model fetched", { model })
})

const deployModel = asyncHandler(async (req, res) => {
  const payload = deployModelSchema.parse(req.body || {})
  const model = await deployModelVersion(req.tenantId, req.params.modelId, payload.notes || "")
  return apiResponse(req, res, 200, "Model deployed", { model })
})

module.exports = {
  createTrainingJob,
  getTrainingJobList,
  getLatestTrainingJobSummary,
  getTrainingJobDetails,
  getModelList,
  getCurrentModelSummary,
  deployModel
}
