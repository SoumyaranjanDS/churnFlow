const { z } = require("zod");

const createActionSchema = z.object({
  customerId: z.string().min(1),
  predictionId: z.string().optional(),
  actionType: z.enum(["call", "discount", "plan_upgrade", "support", "email", "other"]),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  owner: z.string().optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  dueDate: z.string().datetime().optional()
});

const updateActionSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  owner: z.string().optional(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
});

const actionListQuerySchema = z.object({
  customerId: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

module.exports = { createActionSchema, updateActionSchema, actionListQuerySchema };
