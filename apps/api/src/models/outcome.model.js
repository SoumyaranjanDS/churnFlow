const mongoose = require("mongoose");

const outcomeSchema = new mongoose.Schema(
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
    customerId: {
      type: String,
      required: true,
      index: true
    },
    prediction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prediction",
      index: true
    },
    action: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RetentionAction",
      index: true
    },
    actualChurned: {
      type: Boolean,
      required: true,
      index: true
    },
    retentionSuccessful: {
      type: Boolean,
      index: true
    },
    observedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    revenueImpact: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "USD"
    },
    notes: String,
    source: {
      type: String,
      enum: ["manual", "import", "system"],
      default: "manual"
    },
    createdBy: {
      userId: String,
      name: String,
      email: String
    }
  },
  { timestamps: true }
);

outcomeSchema.index({ tenantId: 1, customerId: 1, observedAt: -1 });
outcomeSchema.index({ tenantId: 1, actualChurned: 1, observedAt: -1 });

const Outcome = mongoose.model("Outcome", outcomeSchema);

module.exports = { Outcome };
