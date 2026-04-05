const { asyncHandler } = require("../utils/asyncHandler")
const { apiResponse } = require("../utils/apiResponse")
const { ApiError } = require("../utils/ApiError")
const {
  analyzeDatasetUpload,
  getCurrentOnboardingSnapshot,
  getOnboardingSnapshotByProfileId,
  confirmOnboardingSchema,
  listOnboardingHistory,
  getTrainingReadiness,
  prepareTrainingHandoff
} = require("../services/onboarding.service")
const {
  confirmOnboardingSchema: confirmOnboardingSchemaValidator,
  trainingHandoffSchema
} = require("../validators/onboarding.validator")

const analyzeOnboardingUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Upload a sample CSV/XLSX file using form-data key 'file'")
  }

  const result = await analyzeDatasetUpload({
    tenantId: req.tenantId,
    fileName: req.file.originalname,
    buffer: req.file.buffer,
    mimeType: req.file.mimetype,
    sheetName: req.body?.sheetName || "",
    uploadedBy: {
      userId: req.user?.id,
      name: req.user?.name,
      email: req.user?.email
    }
  })

  return apiResponse(req, res, 201, "Dataset analyzed for onboarding", result)
})

const getOnboardingSnapshot = asyncHandler(async (req, res) => {
  const profileId = req.query.profileId
  const snapshot = profileId
    ? await getOnboardingSnapshotByProfileId(req.tenantId, profileId)
    : await getCurrentOnboardingSnapshot(req.tenantId)

  return apiResponse(req, res, 200, "Onboarding snapshot fetched", snapshot)
})

const getOnboardingHistory = asyncHandler(async (req, res) => {
  const items = await listOnboardingHistory(req.tenantId)
  return apiResponse(req, res, 200, "Onboarding history fetched", { items })
})

const confirmOnboarding = asyncHandler(async (req, res) => {
  const payload = confirmOnboardingSchemaValidator.parse(req.body)
  const result = await confirmOnboardingSchema(req.tenantId, payload)
  return apiResponse(req, res, 200, "Onboarding schema confirmed", result)
})

const getTrainingReadinessSummary = asyncHandler(async (req, res) => {
  const result = await getTrainingReadiness(req.tenantId, req.query.profileId)
  return apiResponse(req, res, 200, "Training readiness evaluated", result)
})

const createTrainingHandoff = asyncHandler(async (req, res) => {
  const payload = trainingHandoffSchema.parse(req.body || {})
  const result = await prepareTrainingHandoff(req.tenantId, payload.profileId)
  return apiResponse(req, res, 200, "Training handoff created", result)
})

module.exports = {
  analyzeOnboardingUpload,
  getOnboardingSnapshot,
  getOnboardingHistory,
  confirmOnboarding,
  getTrainingReadinessSummary,
  createTrainingHandoff
}
