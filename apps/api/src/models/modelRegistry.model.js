const mongoose = require("mongoose")

const modelRegistrySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    trainingJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrainingJob",
      index: true
    },
    datasetProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DatasetProfile",
      index: true
    },
    modelKey: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    modelType: {
      type: String,
      enum: ["tenant_custom"],
      default: "tenant_custom",
      index: true
    },
    version: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["queued", "training", "ready", "failed", "deployed", "archived"],
      default: "queued",
      index: true
    },
    artifactDir: String,
    featureMappings: [
      {
        sourceColumn: String,
        targetField: String
      }
    ],
    targetColumn: String,
    selectedChurnDefinition: String,
    metrics: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    deployment: {
      isDeployed: { type: Boolean, default: false },
      deployedAt: Date,
      notes: String
    }
  },
  { timestamps: true }
)

modelRegistrySchema.index({ tenantId: 1, createdAt: -1 })
modelRegistrySchema.index({ tenantId: 1, status: 1, createdAt: -1 })

const ModelRegistry = mongoose.model("ModelRegistry", modelRegistrySchema)

module.exports = { ModelRegistry }
