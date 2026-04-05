const { z } = require("zod")

const createTrainingJobSchema = z.object({
  profileId: z.string().optional()
})

const deployModelSchema = z.object({
  notes: z.string().max(500).optional()
})

module.exports = {
  createTrainingJobSchema,
  deployModelSchema
}
