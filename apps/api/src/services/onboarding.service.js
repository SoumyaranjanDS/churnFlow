const fs = require("fs/promises")
const path = require("path")
const XLSX = require("xlsx")
const { env } = require("../config/env")
const { ApiError } = require("../utils/ApiError")
const { DatasetProfile } = require("../models/datasetProfile.model")
const { TenantSchemaProfile } = require("../models/tenantSchema.model")
const { getDatasetAiInsights } = require("./gemini.service")
const { recordAnalyticsEventSafe } = require("./analytics.service")

const REQUIRED_TELECOM_FIELDS = [
  "tenure_months",
  "monthly_charges",
  "contract",
  "internet_service",
  "tech_support"
]

const RECOMMENDED_CUSTOM_FIELDS = [
  "customer_id",
  "subscription_plan",
  "billing_amount",
  "engagement_score",
  "support_ticket_count",
  "last_active_at"
]

const AVAILABLE_TARGET_FIELDS = [
  "customer_id",
  "tenure_months",
  "monthly_charges",
  "contract",
  "internet_service",
  "tech_support",
  "subscription_plan",
  "billing_amount",
  "engagement_score",
  "support_ticket_count",
  "last_active_at",
  "target_label"
]

const AVAILABLE_INDUSTRIES = ["telecom", "subscription_like", "custom_unknown"]
const CONFIDENCE_SCORES = { high: 3, medium: 2, low: 1 }

const normalizeKey = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const getConfidence = (sourceColumn, targetField) => {
  const normalizedSource = normalizeKey(sourceColumn)
  if (normalizedSource === targetField) return "high"
  if (normalizedSource.includes(targetField) || targetField.includes(normalizedSource)) return "medium"
  return "low"
}

const normalizeConfidence = (value) => {
  const normalized = String(value || "").trim().toLowerCase()
  return Object.prototype.hasOwnProperty.call(CONFIDENCE_SCORES, normalized) ? normalized : "medium"
}

const buildSuggestion = ({
  sourceColumn,
  targetField,
  confidence = "medium",
  reason = "",
  source = "rules"
}) => ({
  sourceColumn,
  targetField,
  confidence: normalizeConfidence(confidence),
  reason: String(reason || "").trim(),
  source
})

const pickBestSuggestion = (current, candidate) => {
  if (!current) return candidate

  const currentScore = CONFIDENCE_SCORES[current.confidence] || 0
  const candidateScore = CONFIDENCE_SCORES[candidate.confidence] || 0

  if (candidate.source === "ai" && current.source !== "ai") return candidate
  if (candidateScore > currentScore) return candidate
  return current
}

const dedupeSuggestionsBySourceColumn = (suggestions) => {
  const bestBySourceColumn = new Map()

  suggestions.forEach((suggestion) => {
    if (!suggestion?.sourceColumn || !suggestion?.targetField) return
    const current = bestBySourceColumn.get(suggestion.sourceColumn)
    bestBySourceColumn.set(suggestion.sourceColumn, pickBestSuggestion(current, suggestion))
  })

  return Array.from(bestBySourceColumn.values())
}

const sanitizeFileName = (value) => {
  const baseName = path.basename(String(value || "dataset.csv")).trim()
  return baseName.replace(/[^a-zA-Z0-9._-]+/g, "_")
}

const persistUploadedDataset = async ({ tenantId, fileName, buffer, mimeType = "" }) => {
  const tenantDirectory = path.join(env.onboardingUploadsDir, String(tenantId))
  await fs.mkdir(tenantDirectory, { recursive: true })

  const storedFileName = `${Date.now()}-${sanitizeFileName(fileName)}`
  const filePath = path.join(tenantDirectory, storedFileName)

  await fs.writeFile(filePath, buffer)

  return {
    storedFileName,
    filePath,
    mimeType,
    sizeBytes: buffer.length
  }
}

const extractSheetData = (buffer, originalName = "sample.xlsx", requestedSheetName = "") => {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const availableSheets = workbook.SheetNames || []

  if (!availableSheets.length) {
    throw new ApiError(400, `No worksheet found in ${originalName}`)
  }

  const cleanRequestedSheetName = String(requestedSheetName || "").trim()
  if (cleanRequestedSheetName && !availableSheets.includes(cleanRequestedSheetName)) {
    throw new ApiError(400, `Sheet not found: ${cleanRequestedSheetName}`, { availableSheets })
  }

  const sheetName = cleanRequestedSheetName || availableSheets[0]
  const worksheet = workbook.Sheets[sheetName]
  const headerRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })
  const columns = (headerRows[0] || []).map((value) => String(value || "").trim()).filter(Boolean)
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null })

  if (!columns.length) {
    throw new ApiError(400, "Uploaded dataset has no detectable columns")
  }

  return { sheetName, availableSheets, columns, rows }
}

const buildRuleMappingSuggestions = (columns) => {
  const rules = [
    { targetField: "customer_id", patterns: [/customer.?id/, /^id$/, /account.?id/] },
    { targetField: "tenure_months", patterns: [/tenure/, /months?.*active/, /subscription.*months?/] },
    { targetField: "monthly_charges", patterns: [/monthly.*charge/, /monthly.*bill/, /monthly.*fee/, /^mrr$/, /^amount$/] },
    { targetField: "contract", patterns: [/contract/, /term/, /plan.*duration/] },
    { targetField: "internet_service", patterns: [/internet/, /service/, /connection/] },
    { targetField: "tech_support", patterns: [/tech.*support/, /^support$/, /support.*plan/] },
    { targetField: "subscription_plan", patterns: [/plan/, /package/, /tier/] },
    { targetField: "billing_amount", patterns: [/billing/, /invoice/, /payment/, /amount/] },
    { targetField: "engagement_score", patterns: [/engagement/, /usage/, /activity/, /score/] },
    { targetField: "support_ticket_count", patterns: [/ticket/, /case/, /support.*count/] },
    { targetField: "last_active_at", patterns: [/last.*active/, /last.*login/, /last.*seen/, /recent.*activity/] },
    { targetField: "target_label", patterns: [/churn/, /cancel/, /inactive/, /left/, /retained/, /status/] }
  ]

  const suggestions = []
  columns.forEach((column) => {
    const normalizedColumn = normalizeKey(column)
    rules.forEach((rule) => {
      if (rule.patterns.some((pattern) => pattern.test(normalizedColumn))) {
        suggestions.push(
          buildSuggestion({
            sourceColumn: column,
            targetField: rule.targetField,
            confidence: getConfidence(column, rule.targetField),
            source: "rules"
          })
        )
      }
    })
  })

  return dedupeSuggestionsBySourceColumn(suggestions)
}

const mergeMappingSuggestions = ({ columns, ruleSuggestions, aiSuggestions }) => {
  const bestRuleSuggestions = new Map(dedupeSuggestionsBySourceColumn(ruleSuggestions).map((item) => [item.sourceColumn, item]))
  const bestAiSuggestions = new Map(dedupeSuggestionsBySourceColumn(aiSuggestions).map((item) => [item.sourceColumn, item]))

  return columns
    .map((column) => bestAiSuggestions.get(column) || bestRuleSuggestions.get(column) || null)
    .filter(Boolean)
}

const detectIndustry = (mappingSuggestions) => {
  const telecomMatches = mappingSuggestions.filter((item) => REQUIRED_TELECOM_FIELDS.includes(item.targetField))
  if (telecomMatches.length >= 4) return "telecom"
  if (telecomMatches.length >= 2) return "subscription_like"
  return "custom_unknown"
}

const buildTargetCandidates = (mappingSuggestions, aiSuggestedTargetColumn = "") => {
  const candidates = new Set(
    mappingSuggestions
      .filter((item) => item.targetField === "target_label")
      .map((item) => item.sourceColumn)
      .filter(Boolean)
  )

  if (aiSuggestedTargetColumn) {
    candidates.add(aiSuggestedTargetColumn)
  }

  return Array.from(candidates)
}

const buildReadiness = (mappingSuggestions, rowCount, targetCandidates = []) => {
  const telecomFieldsFound = new Set(
    mappingSuggestions
      .filter((item) => REQUIRED_TELECOM_FIELDS.includes(item.targetField))
      .map((item) => item.targetField)
  )

  const telecomCoverage = telecomFieldsFound.size
  const readyForTelecomPrediction = telecomCoverage === REQUIRED_TELECOM_FIELDS.length
  const readyForCustomTraining = rowCount >= 100 && targetCandidates.length > 0
  const score = Math.min(
    100,
    telecomCoverage * 16 + (targetCandidates.length ? 20 : 0) + (rowCount >= 100 ? 20 : rowCount >= 20 ? 10 : 0)
  )
  const blockers = []

  if (!readyForTelecomPrediction) {
    REQUIRED_TELECOM_FIELDS.forEach((field) => {
      if (!telecomFieldsFound.has(field)) {
        blockers.push(`Missing telecom field mapping: ${field}`)
      }
    })
  }

  if (!targetCandidates.length) {
    blockers.push("No churn-like target column detected yet")
  }

  if (rowCount < 100) {
    blockers.push("Need at least 100 labeled rows before custom training is considered ready")
  }

  return {
    telecomCoverage,
    targetCandidates,
    readiness: {
      readyForTelecomPrediction,
      readyForCustomTraining,
      score,
      blockers
    }
  }
}

const buildNextSteps = ({ suggestedIndustry, readiness, targetCandidates }) => {
  const steps = []

  if (suggestedIndustry === "telecom" && readiness.readyForTelecomPrediction) {
    steps.push("Gemini already found the telecom-friendly columns. Review them quickly and confirm the churn column.")
  } else {
    steps.push("Review Gemini's guesses and confirm what churn really means for this business.")
  }

  if (!targetCandidates.filter(Boolean).length) {
    steps.push("Identify one real churn column such as churn, canceled, inactive, or retained before training.")
  } else {
    steps.push("Confirm which suggested column is the real churn outcome for this business.")
  }

  if (!readiness.readyForTelecomPrediction) {
    steps.push("Map any missing billing, behavior, or support columns if you want to use the telecom starter path.")
  }

  if (!readiness.readyForCustomTraining) {
    steps.push("If you want a future custom model, keep collecting more labeled history until the readiness blockers are gone.")
  }

  return steps
}

const resolveConfirmation = (datasetProfile, schemaProfile) => {
  const profileConfirmation = datasetProfile?.confirmation || {}
  const hasProfileConfirmation = Boolean(
    profileConfirmation?.confirmedAt ||
      profileConfirmation?.confirmedTargetColumn ||
      profileConfirmation?.confirmedMappings?.length
  )

  if (hasProfileConfirmation) {
    return profileConfirmation
  }

  const schemaMatchesProfile = Boolean(
    schemaProfile?.latestDatasetProfileId &&
      datasetProfile?._id &&
      String(schemaProfile.latestDatasetProfileId) === String(datasetProfile._id)
  )

  if (!schemaMatchesProfile) {
    return {
      confirmedIndustry: "",
      confirmedMappings: [],
      confirmedTargetColumn: "",
      selectedChurnDefinition: "",
      followUpAnswers: []
    }
  }

  return {
    confirmedIndustry: schemaProfile.confirmedIndustry || schemaProfile.suggestedIndustry || "",
    confirmedMappings: schemaProfile.confirmedMappings || [],
    confirmedTargetColumn: schemaProfile.confirmedTargetColumn || "",
    selectedChurnDefinition: schemaProfile.selectedChurnDefinition || "",
    followUpAnswers: schemaProfile.followUpAnswers || []
  }
}

const buildTrainingReadiness = ({ datasetProfile, confirmedMappings, confirmedTargetColumn }) => {
  const mappedFields = new Set(confirmedMappings.map((item) => item.targetField))
  const missingTelecomFields = REQUIRED_TELECOM_FIELDS.filter((field) => !mappedFields.has(field))
  const featureMappings = confirmedMappings.filter((item) => item.targetField !== "target_label")
  const effectiveTargetColumn =
    confirmedTargetColumn ||
    confirmedMappings.find((item) => item.targetField === "target_label")?.sourceColumn ||
    ""
  const blockers = []

  missingTelecomFields.forEach((field) => {
    blockers.push(`Missing telecom baseline field: ${field}`)
  })

  if (!effectiveTargetColumn) {
    blockers.push("Confirm which column represents churn or loss before custom training.")
  }

  if ((datasetProfile?.rowCount || 0) < 100) {
    blockers.push("Collect at least 100 historical rows for a reliable custom-model starting point.")
  }

  if (featureMappings.length < 3) {
    blockers.push("Map at least 3 usable feature columns before training.")
  }

  return {
    readyForTelecomPrediction: missingTelecomFields.length === 0,
    readyForCustomTraining: blockers.length === 0,
    blockers,
    missingTelecomFields,
    featureCount: featureMappings.length,
    featureMappings,
    targetColumn: effectiveTargetColumn
  }
}

const buildTrainingSummary = ({ schemaProfile, datasetProfile }) => {
  if (!datasetProfile) {
    return {
      datasetProfileId: null,
      fileName: "",
      confirmedIndustry: schemaProfile?.confirmedIndustry || schemaProfile?.suggestedIndustry || "custom_unknown",
      confirmedTargetColumn: "",
      selectedChurnDefinition: schemaProfile?.selectedChurnDefinition || "",
      confirmedMappings: [],
      readiness: {
        readyForTelecomPrediction: false,
        readyForCustomTraining: false,
        blockers: ["Analyze a dataset sample first."],
        missingTelecomFields: REQUIRED_TELECOM_FIELDS,
        featureCount: 0,
        featureMappings: [],
        targetColumn: ""
      },
      recommendedLane: "collect_more_data",
      phase3ContractPreview: null
    }
  }

  const confirmation = resolveConfirmation(datasetProfile, schemaProfile)
  const confirmedIndustry =
    confirmation.confirmedIndustry || schemaProfile?.confirmedIndustry || datasetProfile.analysis?.suggestedIndustry || schemaProfile?.suggestedIndustry || "custom_unknown"
  const confirmedMappings = confirmation.confirmedMappings || []
  const confirmedTargetColumn = confirmation.confirmedTargetColumn || ""
  const readiness = buildTrainingReadiness({
    datasetProfile,
    confirmedMappings,
    confirmedTargetColumn
  })
  const recommendedLane =
    readiness.readyForTelecomPrediction && ["telecom", "subscription_like"].includes(confirmedIndustry)
      ? "telecom_baseline"
      : readiness.readyForCustomTraining
        ? "custom_training"
        : "collect_more_data"

  return {
    datasetProfileId: datasetProfile._id,
    fileName: datasetProfile.fileName,
    confirmedIndustry,
    confirmedTargetColumn: readiness.targetColumn,
    selectedChurnDefinition: confirmation.selectedChurnDefinition || "",
    confirmedMappings,
    readiness,
    recommendedLane,
    phase3ContractPreview: {
      datasetProfileId: datasetProfile._id,
      rowCount: datasetProfile.rowCount,
      targetColumn: readiness.targetColumn,
      featureMappings: readiness.featureMappings.map((item) => ({
        sourceColumn: item.sourceColumn,
        targetField: item.targetField
      }))
    }
  }
}

const analyzeDatasetUpload = async ({ tenantId, fileName, buffer, mimeType = "", uploadedBy, sheetName = "" }) => {
  const { sheetName: selectedSheetName, availableSheets, columns, rows } = extractSheetData(buffer, fileName, sheetName)
  const storage = await persistUploadedDataset({ tenantId, fileName, buffer, mimeType })
  const ruleMappingSuggestions = buildRuleMappingSuggestions(columns)
  const ruleSuggestedIndustry = detectIndustry(ruleMappingSuggestions)
  const initialTargetCandidates = buildTargetCandidates(ruleMappingSuggestions)
  const { readiness: initialReadiness } = buildReadiness(ruleMappingSuggestions, rows.length, initialTargetCandidates)
  let aiInsights = null

  try {
    aiInsights = await getDatasetAiInsights({
      fileName,
      columns,
      sampleRows: rows.slice(0, 5),
      suggestedIndustry: ruleSuggestedIndustry,
      mappingSuggestions: ruleMappingSuggestions,
      readiness: initialReadiness,
      targetCandidates: initialTargetCandidates,
      allowedTargetFields: AVAILABLE_TARGET_FIELDS,
      allowedIndustries: AVAILABLE_INDUSTRIES
    })
  } catch (error) {
    aiInsights = {
      suggestedIndustry: ruleSuggestedIndustry,
      suggestedMappings: [],
      suggestedTargetColumn: "",
      executiveSummary: "",
      businessQuestions: [],
      churnDefinitionOptions: [],
      missingFieldExplanations: [],
      normalizationSuggestions: [],
      customModelRecommendation: error.message,
      confidence: "low",
      model: "fallback"
    }
  }

  const mappingSuggestions = mergeMappingSuggestions({
    columns,
    ruleSuggestions: ruleMappingSuggestions,
    aiSuggestions: aiInsights.suggestedMappings || []
  })
  const suggestedIndustry = AVAILABLE_INDUSTRIES.includes(aiInsights.suggestedIndustry)
    ? aiInsights.suggestedIndustry
    : detectIndustry(mappingSuggestions)
  const { telecomCoverage, targetCandidates, readiness } = buildReadiness(
    mappingSuggestions,
    rows.length,
    buildTargetCandidates(mappingSuggestions, aiInsights.suggestedTargetColumn)
  )
  const nextSteps = buildNextSteps({ suggestedIndustry, readiness, targetCandidates })

  const profile = await DatasetProfile.create({
    tenantId,
    fileName,
    sheetName: selectedSheetName,
    availableSheets,
    rowCount: rows.length,
    columns,
    sampleRows: rows.slice(0, 5),
    storage,
    uploadedBy,
    analysis: {
      suggestedIndustry,
      telecomCoverage,
      targetCandidates,
      mappingSuggestions,
      readiness,
      nextSteps,
      ai: {
        ...aiInsights,
        suggestedIndustry
      }
    }
  })

  const schemaProfile = await TenantSchemaProfile.findOneAndUpdate(
    { tenantId },
    {
      $set: {
        latestDatasetProfileId: profile._id,
        suggestedIndustry,
        requiredFields: REQUIRED_TELECOM_FIELDS,
        recommendedFields: RECOMMENDED_CUSTOM_FIELDS,
        targetCandidates,
        mappingSuggestions,
        readiness,
        notes: nextSteps,
        ai: {
          ...aiInsights,
          suggestedIndustry
        }
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return {
    datasetProfile: profile,
    schemaProfile
  }
}

const getCurrentOnboardingSnapshot = async (tenantId) => {
  const [schemaProfile, datasetProfile, history] = await Promise.all([
    TenantSchemaProfile.findOne({ tenantId }).sort({ updatedAt: -1 }).lean(),
    DatasetProfile.findOne({ tenantId }).sort({ createdAt: -1 }).lean(),
    DatasetProfile.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("fileName sheetName availableSheets rowCount createdAt analysis.suggestedIndustry analysis.readiness confirmation.confirmedAt")
      .lean()
  ])

  return {
    schemaProfile,
    datasetProfile,
    history
  }
}

const getOnboardingSnapshotByProfileId = async (tenantId, profileId) => {
  const [schemaProfile, datasetProfile, history] = await Promise.all([
    TenantSchemaProfile.findOne({ tenantId }).lean(),
    DatasetProfile.findOne({ _id: profileId, tenantId }).lean(),
    DatasetProfile.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("fileName sheetName availableSheets rowCount createdAt analysis.suggestedIndustry analysis.readiness confirmation.confirmedAt")
      .lean()
  ])

  if (!datasetProfile) {
    throw new ApiError(404, `Onboarding profile not found: ${profileId}`)
  }

  return {
    schemaProfile,
    datasetProfile,
    history
  }
}

const confirmOnboardingSchema = async (tenantId, payload) => {
  const datasetProfile = payload.datasetProfileId
    ? await DatasetProfile.findOne({ _id: payload.datasetProfileId, tenantId })
    : await DatasetProfile.findOne({ tenantId }).sort({ createdAt: -1 })

  if (!datasetProfile) {
    throw new ApiError(404, "No dataset profile available to confirm")
  }

  const readiness = buildTrainingReadiness({
    datasetProfile,
    confirmedMappings: payload.confirmedMappings,
    confirmedTargetColumn: payload.confirmedTargetColumn
  })

  const nextSteps = buildNextSteps({
    suggestedIndustry: payload.confirmedIndustry,
    readiness,
    targetCandidates: [readiness.targetColumn]
  })

  datasetProfile.confirmation = {
    confirmedIndustry: payload.confirmedIndustry,
    confirmedMappings: payload.confirmedMappings,
    confirmedTargetColumn: readiness.targetColumn,
    selectedChurnDefinition: payload.selectedChurnDefinition,
    followUpAnswers: payload.followUpAnswers,
    confirmedAt: new Date()
  }
  datasetProfile.analysis.readiness = {
    ...datasetProfile.analysis.readiness,
    ...readiness,
    score: readiness.readyForCustomTraining ? 100 : Math.max(datasetProfile.analysis.readiness?.score || 0, 45)
  }
  datasetProfile.analysis.nextSteps = nextSteps
  await datasetProfile.save()

  const schemaProfile = await TenantSchemaProfile.findOneAndUpdate(
    { tenantId },
    {
      $set: {
        latestDatasetProfileId: datasetProfile._id,
        suggestedIndustry: payload.confirmedIndustry,
        confirmedIndustry: payload.confirmedIndustry,
        confirmedMappings: payload.confirmedMappings,
        confirmedTargetColumn: readiness.targetColumn,
        selectedChurnDefinition: payload.selectedChurnDefinition,
        followUpAnswers: payload.followUpAnswers,
        readiness: {
          ...datasetProfile.analysis.readiness,
          ...readiness
        },
        notes: nextSteps
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()

  await recordAnalyticsEventSafe({
    eventName: "custom_onboarding_completed",
    source: "server",
    pathGroup: "workspace",
    route: "/app/custom-setup",
    tenantId,
    context: {
      datasetProfileId: datasetProfile._id,
      confirmedIndustry: payload.confirmedIndustry,
      targetColumn: readiness.targetColumn,
      featureCount: readiness.featureCount,
      readyForCustomTraining: readiness.readyForCustomTraining,
      readyForTelecomPrediction: readiness.readyForTelecomPrediction
    }
  })

  return {
    datasetProfile: datasetProfile.toObject(),
    schemaProfile,
    trainingReadiness: buildTrainingSummary({ schemaProfile, datasetProfile: datasetProfile.toObject() })
  }
}

const listOnboardingHistory = async (tenantId) => {
  const items = await DatasetProfile.find({ tenantId })
    .sort({ createdAt: -1 })
    .select("fileName sheetName availableSheets rowCount columns createdAt analysis.suggestedIndustry analysis.readiness confirmation.confirmedAt")
    .lean()

  return items
}

const getTrainingReadiness = async (tenantId, profileId) => {
  const [schemaProfile, datasetProfile] = await Promise.all([
    TenantSchemaProfile.findOne({ tenantId }).lean(),
    profileId
      ? DatasetProfile.findOne({ _id: profileId, tenantId }).lean()
      : DatasetProfile.findOne({ tenantId }).sort({ createdAt: -1 }).lean()
  ])

  if (profileId && !datasetProfile) {
    throw new ApiError(404, `Onboarding profile not found: ${profileId}`)
  }

  return buildTrainingSummary({ schemaProfile, datasetProfile })
}

const prepareTrainingHandoff = async (tenantId, profileId) => {
  const summary = await getTrainingReadiness(tenantId, profileId)

  if (!summary.readiness.readyForCustomTraining) {
    throw new ApiError(409, "Dataset is not ready for custom training yet", summary)
  }

  return {
    ready: true,
    recommendedLane: summary.recommendedLane,
    message: "Phase 2 handoff is ready. Phase 3 can now train a tenant-specific model.",
    phase3ContractPreview: summary.phase3ContractPreview,
    datasetProfileId: summary.datasetProfileId,
    confirmedIndustry: summary.confirmedIndustry,
    selectedChurnDefinition: summary.selectedChurnDefinition,
    confirmedTargetColumn: summary.confirmedTargetColumn
  }
}

module.exports = {
  analyzeDatasetUpload,
  getCurrentOnboardingSnapshot,
  getOnboardingSnapshotByProfileId,
  confirmOnboardingSchema,
  listOnboardingHistory,
  getTrainingReadiness,
  prepareTrainingHandoff,
  AVAILABLE_TARGET_FIELDS,
  REQUIRED_TELECOM_FIELDS
}
