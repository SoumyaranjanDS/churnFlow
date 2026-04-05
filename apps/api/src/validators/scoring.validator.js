const { z } = require("zod");

const scoreRequestSchema = z.object({
  customerId: z.string().min(1),
  requestId: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.5),
  thresholdVersion: z.string().default("default"),
  features: z.record(z.any()).optional()
});

const scoreBatchSchema = z.object({
  customerIds: z.array(z.string().min(1)).max(500).optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  threshold: z.number().min(0).max(1).default(0.5),
  thresholdVersion: z.string().default("default")
});

const latestPredictionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  riskBand: z.enum(["Low", "Medium", "High"]).optional(),
  minProbability: z.coerce.number().min(0).max(1).optional(),
  search: z.string().optional()
});

module.exports = { scoreRequestSchema, scoreBatchSchema, latestPredictionsQuerySchema };
