const mongoose = require("mongoose")

const tenantSchemaModel = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
      index: true
    },
    latestDatasetProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DatasetProfile"
    },
    suggestedIndustry: {
      type: String,
      enum: ["telecom", "subscription_like", "custom_unknown"],
      default: "custom_unknown"
    },
    requiredFields: [{ type: String }],
    recommendedFields: [{ type: String }],
    targetCandidates: [{ type: String }],
    mappingSuggestions: [
      {
        sourceColumn: String,
        targetField: String,
        confidence: String,
        reason: String,
        source: String
      }
    ],
    readiness: {
      readyForTelecomPrediction: { type: Boolean, default: false },
      readyForCustomTraining: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      blockers: [{ type: String }]
    },
    notes: [{ type: String }],
    confirmedIndustry: String,
    confirmedMappings: [
      {
        sourceColumn: String,
        targetField: String
      }
    ],
    confirmedTargetColumn: String,
    selectedChurnDefinition: String,
    followUpAnswers: [
      {
        question: String,
        answer: String
      }
    ],
    ai: {
      suggestedIndustry: String,
      suggestedTargetColumn: String,
      suggestedMappings: [
        {
          sourceColumn: String,
          targetField: String,
          confidence: String,
          reason: String,
          source: String
        }
      ],
      executiveSummary: String,
      businessQuestions: [{ type: String }],
      churnDefinitionOptions: [{ type: String }],
      missingFieldExplanations: [
        {
          field: String,
          reason: String
        }
      ],
      normalizationSuggestions: [{ type: String }],
      customModelRecommendation: String,
      confidence: String,
      model: String
    }
  },
  { timestamps: true }
)

const TenantSchemaProfile = mongoose.model("TenantSchemaProfile", tenantSchemaModel)

module.exports = { TenantSchemaProfile }
