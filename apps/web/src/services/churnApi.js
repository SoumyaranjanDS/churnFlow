import { apiClient } from "./apiClient"

const registerUser = async (payload) => {
  const { data } = await apiClient.post("/auth/register", payload)
  return data
}

const loginUser = async (payload) => {
  const { data } = await apiClient.post("/auth/login", payload)
  return data
}

const verifyEmail = async (payload) => {
  const { data } = await apiClient.post("/auth/verify-email", payload)
  return data
}

const resendVerification = async (payload) => {
  const { data } = await apiClient.post("/auth/resend-verification", payload)
  return data
}

const requestPasswordReset = async (payload) => {
  const { data } = await apiClient.post("/auth/forgot-password", payload)
  return data
}

const resetPassword = async (payload) => {
  const { data } = await apiClient.post("/auth/reset-password", payload)
  return data
}

const getMe = async () => {
  const { data } = await apiClient.get("/auth/me")
  return data
}

const listUsers = async () => {
  const { data } = await apiClient.get("/auth/users")
  return data
}

const getHealth = async () => {
  const { data } = await apiClient.get("/health")
  return data
}

const submitContactMessage = async (payload) => {
  const { data } = await apiClient.post("/contact", payload)
  return data
}

const trackAnalyticsEvent = async (payload) => {
  const { data } = await apiClient.post("/analytics/events", payload)
  return data
}

const createCustomer = async (payload) => {
  const { data } = await apiClient.post("/customers", payload)
  return data
}

const listCustomers = async (params = {}) => {
  const { data } = await apiClient.get("/customers", { params })
  return data
}

const updateCustomer = async (customerId, payload) => {
  const { data } = await apiClient.patch(`/customers/${customerId}`, payload)
  return data
}

const scoreCustomer = async (payload) => {
  const { data } = await apiClient.post("/scoring/predict", payload)
  return data
}

const scoreBatchCustomers = async (payload) => {
  const { data } = await apiClient.post("/scoring/batch", payload)
  return data
}

const getLatestPredictions = async (params = {}) => {
  const { data } = await apiClient.get("/scoring/latest", { params })
  return data
}

const getPredictionHistory = async (customerId) => {
  const { data } = await apiClient.get(`/scoring/history/${customerId}`)
  return data
}

const createAction = async (payload) => {
  const { data } = await apiClient.post("/actions", payload)
  return data
}

const listActions = async (params = {}) => {
  const { data } = await apiClient.get("/actions", { params })
  return data
}

const updateAction = async (actionId, payload) => {
  const { data } = await apiClient.patch(`/actions/${actionId}`, payload)
  return data
}

const getDashboardSummary = async (params = {}) => {
  const { data } = await apiClient.get("/dashboard/summary", { params })
  return data
}

const createOutcome = async (payload) => {
  const { data } = await apiClient.post("/outcomes", payload)
  return data
}

const listOutcomes = async (params = {}) => {
  const { data } = await apiClient.get("/outcomes", { params })
  return data
}

const importTelcoByPath = async (payload) => {
  const { data } = await apiClient.post("/import/telco/path", payload)
  return data
}

const importTelcoByUpload = async (file, sheetName = "") => {
  const form = new FormData()
  form.append("file", file)
  if (sheetName) {
    form.append("sheetName", sheetName)
  }

  const { data } = await apiClient.post("/import/telco/upload", form, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    timeout: 60000
  })
  return data
}

const importCustomByUpload = async (file, sheetName = "") => {
  const form = new FormData()
  form.append("file", file)
  if (sheetName) {
    form.append("sheetName", sheetName)
  }

  const { data } = await apiClient.post("/import/custom/upload", form, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    timeout: 60000
  })
  return data
}

const getOnboardingSnapshot = async (profileId = "") => {
  const params = profileId ? { profileId } : {}
  const { data } = await apiClient.get("/onboarding/current", { params })
  return data
}

const getOnboardingHistory = async () => {
  const { data } = await apiClient.get("/onboarding/history")
  return data
}

const analyzeOnboardingDataset = async (file, sheetName = "") => {
  const form = new FormData()
  form.append("file", file)
  if (sheetName) {
    form.append("sheetName", sheetName)
  }

  const { data } = await apiClient.post("/onboarding/analyze-upload", form, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    timeout: 60000
  })

  return data
}

const confirmOnboardingSetup = async (payload) => {
  const { data } = await apiClient.patch("/onboarding/confirm", payload)
  return data
}

const getTrainingReadiness = async (profileId = "") => {
  const params = profileId ? { profileId } : {}
  const { data } = await apiClient.get("/onboarding/training-readiness", { params })
  return data
}

const prepareTrainingHandoff = async (profileId = "") => {
  const payload = profileId ? { profileId } : {}
  const { data } = await apiClient.post("/onboarding/training-handoff", payload)
  return data
}

const createTrainingJob = async (profileId = "") => {
  const payload = profileId ? { profileId } : {}
  const { data } = await apiClient.post("/training/jobs", payload)
  return data
}

const getTrainingJobs = async () => {
  const { data } = await apiClient.get("/training/jobs")
  return data
}

const getLatestTrainingJob = async () => {
  const { data } = await apiClient.get("/training/jobs/latest")
  return data
}

const getTrainingJob = async (jobId) => {
  const { data } = await apiClient.get(`/training/jobs/${jobId}`)
  return data
}

const getTrainingModels = async () => {
  const { data } = await apiClient.get("/training/models")
  return data
}

const getCurrentTrainingModel = async () => {
  const { data } = await apiClient.get("/training/models/current")
  return data
}

const deployTrainingModel = async (modelId, notes = "") => {
  const { data } = await apiClient.post(`/training/models/${modelId}/deploy`, { notes })
  return data
}

export {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  getMe,
  listUsers,
  getHealth,
  submitContactMessage,
  trackAnalyticsEvent,
  createCustomer,
  listCustomers,
  updateCustomer,
  scoreCustomer,
  scoreBatchCustomers,
  getLatestPredictions,
  getPredictionHistory,
  createAction,
  listActions,
  updateAction,
  getDashboardSummary,
  createOutcome,
  listOutcomes,
  importTelcoByPath,
  importTelcoByUpload,
  importCustomByUpload,
  getOnboardingSnapshot,
  getOnboardingHistory,
  analyzeOnboardingDataset,
  confirmOnboardingSetup,
  getTrainingReadiness,
  prepareTrainingHandoff,
  createTrainingJob,
  getTrainingJobs,
  getLatestTrainingJob,
  getTrainingJob,
  getTrainingModels,
  getCurrentTrainingModel,
  deployTrainingModel
}
