const mongoose = require("mongoose");

const retentionActionSchema = new mongoose.Schema(
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
    prediction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prediction",
      index: true
    },
    actionType: {
      type: String,
      enum: ["call", "discount", "plan_upgrade", "support", "email", "other"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
      index: true
    },
    owner: String,
    notes: String,
    outcome: String,
    dueDate: Date,
    completedAt: Date
  },
  { timestamps: true }
);

retentionActionSchema.index({ tenantId: 1, customerId: 1, status: 1, createdAt: -1 });

const RetentionAction = mongoose.model("RetentionAction", retentionActionSchema);

module.exports = { RetentionAction };
