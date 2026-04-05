const express = require("express")
const {
  analyzeOnboardingUpload,
  getOnboardingSnapshot,
  getOnboardingHistory,
  confirmOnboarding,
  getTrainingReadinessSummary,
  createTrainingHandoff
} = require("../controllers/onboarding.controller")
const { authorizeRoles } = require("../middleware/auth.middleware")
const { upload } = require("../middleware/upload.middleware")

const router = express.Router()

router.get("/current", authorizeRoles("admin", "manager", "agent"), getOnboardingSnapshot)
router.get("/history", authorizeRoles("admin", "manager", "agent"), getOnboardingHistory)
router.get("/training-readiness", authorizeRoles("admin", "manager", "agent"), getTrainingReadinessSummary)
router.post("/analyze-upload", authorizeRoles("admin", "manager", "agent"), upload.single("file"), analyzeOnboardingUpload)
router.patch("/confirm", authorizeRoles("admin", "manager", "agent"), confirmOnboarding)
router.post("/training-handoff", authorizeRoles("admin", "manager", "agent"), createTrainingHandoff)

module.exports = { onboardingRouter: router }
