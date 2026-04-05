const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const { env } = require("../config/env")
const { AnalyticsEvent } = require("../models/analyticsEvent.model")

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return undefined
  }

  return new mongoose.Types.ObjectId(value)
}

const getOptionalActorFromRequest = (req) => {
  const header = req?.headers?.authorization
  if (!header || typeof header !== "string") {
    return {}
  }

  const [scheme, token] = header.split(" ")
  if (scheme !== "Bearer" || !token) {
    return {}
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret, { issuer: env.jwtIssuer })
    return {
      userId: decoded?.sub || "",
      tenantId: decoded?.tenantId || ""
    }
  } catch {
    return {}
  }
}

const createAnalyticsEvent = async ({
  eventName,
  source = "client",
  pathGroup = "public",
  route = "",
  sessionId = "",
  tenantId = "",
  userId = "",
  context = {},
  requestMeta = {}
}) => {
  const payload = {
    eventName: String(eventName || "").trim(),
    source,
    pathGroup,
    route: String(route || "").trim(),
    sessionId: String(sessionId || "").trim(),
    tenantId: toObjectId(tenantId),
    userId: toObjectId(userId),
    context: context && typeof context === "object" ? context : {},
    requestMeta: {
      ip: requestMeta?.ip || "",
      userAgent: requestMeta?.userAgent || ""
    }
  }

  if (!payload.eventName) {
    return null
  }

  const record = await AnalyticsEvent.create(payload)
  return record.toObject()
}

const recordAnalyticsEventSafe = async (payload) => {
  try {
    return await createAnalyticsEvent(payload)
  } catch (error) {
    console.warn(`[analytics] failed to record event ${payload?.eventName || "unknown"}: ${error.message}`)
    return null
  }
}

module.exports = {
  createAnalyticsEvent,
  recordAnalyticsEventSafe,
  getOptionalActorFromRequest
}
