const { z } = require("zod");

const boolish = z.union([z.boolean(), z.literal("Yes"), z.literal("No")]).transform((value) => {
  if (value === "Yes") return true;
  if (value === "No") return false;
  return value;
});

const customerUpsertSchema = z.object({
  customerId: z.string().min(1),
  industryType: z.enum(["telecom", "custom"]).optional(),
  schemaVersion: z.string().optional(),
  normalizedFeatures: z.record(z.any()).optional(),
  profile: z
    .object({
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      gender: z.string().optional(),
      seniorCitizen: boolish.optional(),
      partner: boolish.optional(),
      dependents: boolish.optional()
    })
    .partial()
    .optional(),
  subscription: z
    .object({
      tenureMonths: z.number().nonnegative().optional(),
      phoneService: z.string().optional(),
      multipleLines: z.string().optional(),
      internetService: z.string().optional(),
      onlineSecurity: z.string().optional(),
      onlineBackup: z.string().optional(),
      deviceProtection: z.string().optional(),
      techSupport: z.string().optional(),
      streamingTV: z.string().optional(),
      streamingMovies: z.string().optional()
    })
    .partial()
    .optional(),
  billing: z
    .object({
      contract: z.string().optional(),
      paperlessBilling: z.string().optional(),
      paymentMethod: z.string().optional(),
      monthlyCharges: z.number().nonnegative().optional(),
      totalCharges: z.number().nonnegative().optional(),
      cltv: z.number().nonnegative().optional()
    })
    .partial()
    .optional(),
  churnMeta: z
    .object({
      churnLabel: z.string().optional(),
      churnValue: z.number().optional(),
      churnScore: z.number().optional(),
      churnReason: z.string().optional()
    })
    .partial()
    .optional(),
  source: z.string().optional()
});

const customerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  source: z.string().optional()
});

module.exports = { customerUpsertSchema, customerQuerySchema };
