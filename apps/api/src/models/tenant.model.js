const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    industryType: {
      type: String,
      enum: ["telecom", "custom"],
      default: "telecom",
      index: true
    },
    onboardingStatus: {
      type: String,
      enum: ["draft", "prediction_ready", "schema_ready", "training_ready", "training", "model_ready", "active"],
      default: "prediction_ready",
      index: true
    },
    currentModelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModelRegistry"
    },
    settings: {
      currency: { type: String, default: "USD" },
      defaultThreshold: { type: Number, default: 0.5 }
    }
  },
  { timestamps: true }
);

const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = { Tenant };
