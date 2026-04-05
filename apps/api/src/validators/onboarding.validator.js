const { z } = require("zod")

const mappingSchema = z.object({
  sourceColumn: z.string().min(1),
  targetField: z.string().min(1)
})

const followUpAnswerSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1)
})

const confirmOnboardingSchema = z.object({
  datasetProfileId: z.string().optional(),
  confirmedIndustry: z.string().min(1),
  confirmedMappings: z.array(mappingSchema).min(1),
  confirmedTargetColumn: z.string().min(1),
  selectedChurnDefinition: z.string().min(1),
  followUpAnswers: z.array(followUpAnswerSchema).default([])
})

const trainingHandoffSchema = z.object({
  profileId: z.string().optional()
})

module.exports = {
  confirmOnboardingSchema,
  trainingHandoffSchema
}
