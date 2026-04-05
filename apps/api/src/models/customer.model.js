const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    customerId: { type: String, required: true, index: true },
    industryType: {
      type: String,
      enum: ["telecom", "custom"],
      default: "telecom",
      index: true
    },
    schemaVersion: {
      type: String,
      default: "telco-v1"
    },
    normalizedFeatures: {
      type: mongoose.Schema.Types.Mixed
    },
    profile: {
      country: String,
      state: String,
      city: String,
      gender: String,
      seniorCitizen: Boolean,
      partner: Boolean,
      dependents: Boolean,
    },
    subscription: {
      tenureMonths: Number,
      phoneService: String,
      multipleLines: String,
      internetService: String,
      onlineSecurity: String,
      onlineBackup: String,
      deviceProtection: String,
      techSupport: String,
      streamingTV: String,
      streamingMovies: String,
    },
    billing: {
      contract: String,
      paperlessBilling: String,
      paymentMethod: String,
      monthlyCharges: Number,
      totalCharges: Number,
      cltv: Number,
    },
    churnMeta: {
      churnLabel: String,
      churnValue: Number,
      churnScore: Number,
      churnReason: String,
    },
    source: {
      type: String,
      default: "manual",
    },
  },
  { timestamps: true },
);

customerSchema.index({ tenantId: 1, customerId: 1 }, { unique: true });

const Customer = mongoose.model("Customer", customerSchema);

module.exports = { Customer };
