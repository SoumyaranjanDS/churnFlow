const mongoose = require("mongoose")

const datasetProfileSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    fileName: { type: String, required: true, trim: true },
    sheetName: { type: String, trim: true },
    availableSheets: [{ type: String }],
    rowCount: { type: Number, default: 0 },
    columns: [{ type: String }],
    sampleRows: [{ type: mongoose.Schema.Types.Mixed }],
    storage: {
      storedFileName: String,
      filePath: String,
      mimeType: String,
      sizeBytes: Number
    },
    sourceType: {
      type: String,
      enum: ["upload"],
      default: "upload"
    },
    analysis: {
      suggestedIndustry: {
        type: String,
        enum: ["telecom", "subscription_like", "custom_unknown"],
        default: "custom_unknown"
      },
      telecomCoverage: { type: Number, default: 0 },
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
      nextSteps: [{ type: String }],
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
    confirmation: {
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
      confirmedAt: Date
    },
    uploadedBy: {
      userId: String,
      name: String,
      email: String
    }
  },
  { timestamps: true }
)

datasetProfileSchema.index({ tenantId: 1, createdAt: -1 })

const DatasetProfile = mongoose.model("DatasetProfile", datasetProfileSchema)

module.exports = { DatasetProfile }
