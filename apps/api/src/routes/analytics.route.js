const express = require("express")
const { trackAnalyticsEvent } = require("../controllers/analytics.controller")
const { createRateLimiter } = require("../middleware/rateLimit.middleware")

const router = express.Router()

const analyticsLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  keyGenerator: (req) => {
    const sessionId = String(req.body?.sessionId || "").trim()
    return sessionId ? `analytics:${req.ip}:${sessionId}` : `analytics:${req.ip}`
  },
  message: "Too many analytics events were sent from this session. Try again shortly."
})

router.post("/events", analyticsLimiter, trackAnalyticsEvent)

module.exports = { analyticsRouter: router }
