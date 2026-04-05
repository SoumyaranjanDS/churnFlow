const mongoose = require("mongoose")

const trainingJobSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    datasetProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DatasetProfile",
      required: true,
      index: true
    },
    modelRegistryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModelRegistry",
      index: true
    },
    requestedBy: {
      userId: String,
      name: String,
      email: String
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      default: "queued",
      index: true
    },
    trigger: {
      type: String,
      enum: ["manual_handoff"],
      default: "manual_handoff"
    },
    trainingContract: {
      confirmedIndustry: String,
      selectedChurnDefinition: String,
      targetColumn: String,
      featureMappings: [
        {
          sourceColumn: String,
          targetField: String
        }
      ],
      rowCount: Number,
      fileName: String,
      storedFilePath: String
    },
    execution: {
      command: String,
      cwd: String,
      startedAt: Date,
      finishedAt: Date,
      durationMs: Number,
      stdout: String,
      stderr: String,
      exitCode: Number,
      errorMessage: String
    },
    summary: {
      message: String,
      metrics: mongoose.Schema.Types.Mixed,
      artifactDir: String
    }
  },
  { timestamps: true }
)

trainingJobSchema.index({ tenantId: 1, createdAt: -1 })
trainingJobSchema.index({ tenantId: 1, status: 1, createdAt: -1 })

const TrainingJob = mongoose.model("TrainingJob", trainingJobSchema)

module.exports = { TrainingJob }
