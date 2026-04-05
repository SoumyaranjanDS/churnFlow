const mongoose = require("mongoose");

const tenantMembershipSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tenantRole: {
      type: String,
      enum: ["owner", "admin", "manager", "agent"],
      required: true,
      default: "agent"
    }
  },
  { timestamps: true }
);

tenantMembershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

const TenantMembership = mongoose.model("TenantMembership", tenantMembershipSchema);

module.exports = { TenantMembership };

