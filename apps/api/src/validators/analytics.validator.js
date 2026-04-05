const { z } = require("zod")

const analyticsEventSchema = z.object({
  eventName: z.string().min(2).max(120),
  route: z.string().max(240).optional().default(""),
  pathGroup: z.enum(["public", "auth", "workspace", "system"]).optional().default("public"),
  sessionId: z.string().max(120).optional().default(""),
  context: z.record(z.any()).optional().default({})
})

module.exports = { analyticsEventSchema }
