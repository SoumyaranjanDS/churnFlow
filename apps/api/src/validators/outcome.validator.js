const { z } = require("zod");

const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const createOutcomeSchema = z.object({
  customerId: z.string().min(1),
  predictionId: z.string().optional(),
  actionId: z.string().optional(),
  actualChurned: z.boolean(),
  retentionSuccessful: z.boolean().optional(),
  observedAt: z.string().datetime().optional(),
  revenueImpact: z.number().optional(),
  currency: z.string().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
  source: z.enum(["manual", "import", "system"]).optional()
});

const outcomeListQuerySchema = z.object({
  customerId: z.string().optional(),
  actualChurned: booleanQuery.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

module.exports = { createOutcomeSchema, outcomeListQuerySchema };
