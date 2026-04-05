const path = require("path")
const dotenv = require("dotenv")

const envCandidates = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), ".env")
]

envCandidates.forEach((candidate) => {
  dotenv.config({ path: candidate, override: false })
})

const toNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value, fallback) => {
  if (typeof value !== "string") return fallback
  const normalized = value.trim().toLowerCase()
  if (["1", "true", "yes", "on"].includes(normalized)) return true
  if (["0", "false", "no", "off"].includes(normalized)) return false
  return fallback
}

const toList = (value) => {
  if (typeof value !== "string") return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 8000),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/churn_platform",
  mlApiUrl: process.env.ML_API_URL || "http://localhost:8001",
  mlApiTimeoutMs: toNumber(process.env.ML_API_TIMEOUT_MS, 8000),
  onboardingUploadsDir:
    process.env.ONBOARDING_UPLOADS_DIR || path.resolve(__dirname, "../../storage/onboarding"),
  mlTrainingPythonCmd: process.env.ML_TRAINING_PYTHON_CMD || process.env.PYTHON_CMD || "python",
  mlTrainingServiceDir:
    process.env.ML_TRAINING_SERVICE_DIR || path.resolve(__dirname, "../../../../services/ml-training"),
  mlTrainingScriptPath:
    process.env.ML_TRAINING_SCRIPT_PATH ||
    path.resolve(__dirname, "../../../../services/ml-training/src/pipelines/train_custom_tenant_pipeline.py"),
  mlTrainingArtifactsDir:
    process.env.ML_TRAINING_ARTIFACTS_DIR ||
    path.resolve(__dirname, "../../../../services/ml-training/artifacts/tenants"),
  mlTrainingTimeoutMs: toNumber(process.env.ML_TRAINING_TIMEOUT_MS, 20 * 60 * 1000),
  telcoDatasetPath: process.env.TELCO_DATASET_PATH || "",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtIssuer: process.env.JWT_ISSUER || "churn-platform-api",
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  corsOrigins: toList(process.env.CORS_ORIGINS),
  requireEmailVerification: toBoolean(process.env.AUTH_REQUIRE_EMAIL_VERIFICATION, false),
  emailVerificationTokenTtlMinutes: toNumber(process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES, 60),
  emailVerificationResendCooldownSeconds: toNumber(process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS, 60),
  passwordResetTokenTtlMinutes: toNumber(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, 30),
  passwordResetResendCooldownSeconds: toNumber(process.env.PASSWORD_RESET_RESEND_COOLDOWN_SECONDS, 60),
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: toNumber(process.env.SMTP_PORT, 587),
  smtpSecure: toBoolean(process.env.SMTP_SECURE, false),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
  contactInboxEmail: process.env.CONTACT_INBOX_EMAIL || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash"
}

const validateProductionEnv = () => {
  if (!["production", "staging"].includes(env.nodeEnv)) {
    return
  }

  const missing = []

  if (!process.env.MONGO_URI) missing.push("MONGO_URI")
  if (!process.env.ML_API_URL) missing.push("ML_API_URL")
  if (!process.env.FRONTEND_BASE_URL) missing.push("FRONTEND_BASE_URL")
  if (!process.env.JWT_SECRET || env.jwtSecret === "dev-only-secret-change-me") missing.push("JWT_SECRET")

  if (env.requireEmailVerification) {
    if (!process.env.SMTP_HOST) missing.push("SMTP_HOST")
    if (!process.env.SMTP_USER) missing.push("SMTP_USER")
    if (!process.env.SMTP_PASS) missing.push("SMTP_PASS")
  }

  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`)
  }
}

validateProductionEnv()

module.exports = { env }
