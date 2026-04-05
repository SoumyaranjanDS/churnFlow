const { asyncHandler } = require("../utils/asyncHandler")
const { apiResponse } = require("../utils/apiResponse")
const { analyticsEventSchema } = require("../validators/analytics.validator")
const { createAnalyticsEvent, getOptionalActorFromRequest } = require("../services/analytics.service")

const trackAnalyticsEvent = asyncHandler(async (req, res) => {
  const payload = analyticsEventSchema.parse(req.body || {})
  const actor = getOptionalActorFromRequest(req)

  await createAnalyticsEvent({
    ...payload,
    source: "client",
    tenantId: actor.tenantId,
    userId: actor.userId,
    requestMeta: {
      ip: req.ip,
      userAgent: req.get("user-agent")
    }
  })

  return apiResponse(req, res, 202, "Analytics event accepted", {
    accepted: true
  })
})

module.exports = { trackAnalyticsEvent }
