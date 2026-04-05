const mongoose = require("mongoose")

const analyticsEventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    source: {
      type: String,
      enum: ["client", "server"],
      default: "client"
    },
    pathGroup: {
      type: String,
      enum: ["public", "auth", "workspace", "system"],
      default: "public"
    },
    route: {
      type: String,
      default: ""
    },
    sessionId: {
      type: String,
      default: "",
      index: true
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    requestMeta: {
      ip: String,
      userAgent: String
    }
  },
  { timestamps: true }
)

analyticsEventSchema.index({ eventName: 1, createdAt: -1 })
analyticsEventSchema.index({ tenantId: 1, createdAt: -1 })
analyticsEventSchema.index({ userId: 1, createdAt: -1 })

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema)

module.exports = { AnalyticsEvent }
