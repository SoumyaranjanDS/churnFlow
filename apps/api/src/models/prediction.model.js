const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },
    customerId: { type: String, required: true, index: true },
    modelRegistryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModelRegistry",
      index: true
    },
    inputFeatures: { type: mongoose.Schema.Types.Mixed, required: true },
    churnProbability: { type: Number, required: true, min: 0, max: 1 },
    riskBand: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: true
    },
    decision: {
      predictedLabel: { type: String, enum: ["No", "Yes"], required: true },
      threshold: { type: Number, required: true }
    },
    modelVersion: { type: String, required: true },
    modelType: {
      type: String,
      enum: ["global_telco", "tenant_custom"],
      default: "global_telco"
    },
    explanation: {
      topDrivers: [String],
      summary: String,
      recommendedActions: [String]
    },
    thresholdVersion: { type: String, default: "default" },
    requestId: { type: String, index: true },
    mlRawResponse: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

predictionSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 });

const Prediction = mongoose.model("Prediction", predictionSchema);

module.exports = { Prediction };
