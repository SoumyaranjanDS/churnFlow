const axios = require("axios")
const { env } = require("../config/env")
const { ApiError } = require("../utils/ApiError")

const client = axios.create({
  baseURL: env.mlApiUrl,
  timeout: env.mlApiTimeoutMs
})

const RETRYABLE_ML_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EAI_AGAIN",
  "ENOTFOUND",
  "ETIMEDOUT"
])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const extractMlDetail = (error) => {
  const detail = error?.response?.data?.detail
  if (detail) return detail

  if (typeof error?.response?.data === "string" && error.response.data.trim()) {
    return error.response.data
  }

  return error?.code || error.message
}

const isRetryableMlError = (error) => {
  const status = Number(error?.response?.status)

  if ([408, 425, 429, 500, 502, 503, 504].includes(status)) {
    return true
  }

  return RETRYABLE_ML_ERROR_CODES.has(error?.code)
}

const warmUpMlApi = async () => {
  try {
    await client.get("/healthz", {
      timeout: Math.min(env.mlApiTimeoutMs, 20000),
      validateStatus: (status) => status >= 200 && status < 500
    })
  } catch {
    // Ignore warm-up issues and let the retried request decide the final outcome.
  }
}

const requestWithWakeupRetry = async (requestFn) => {
  try {
    return await requestFn()
  } catch (error) {
    if (!isRetryableMlError(error)) {
      throw error
    }

    await warmUpMlApi()
    await sleep(1800)
    return requestFn()
  }
}

const toUserFacingMlDetail = (error, { tenantScoped = false } = {}) => {
  const detail = String(extractMlDetail(error) || "").trim()

  if (!detail) {
    return "The ML service did not return a response."
  }

  if (
    tenantScoped &&
    /(missing model bundle|failed to load model bundle|no such file or directory)/i.test(detail)
  ) {
    return "The deployed custom model is not available to the ML service in this deployment. Re-deploy the model with shared model storage before scoring."
  }

  if (
    /ECONNABORTED|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ENOTFOUND|timeout|timed out/i.test(detail)
  ) {
    return "The ML service is taking longer than expected to wake up. Please try the score action again in a few seconds."
  }

  return detail
}

const requestChurnPrediction = async (features) => {
  try {
    const response = await requestWithWakeupRetry(() => client.post("/v1/predict", features))
    return response.data
  } catch (error) {
    throw new ApiError(502, "ML API unavailable", {
      detail: toUserFacingMlDetail(error)
    })
  }
}

const requestTenantPrediction = async ({ artifactDir, features }) => {
  try {
    const response = await requestWithWakeupRetry(() =>
      client.post("/v1/predict-tenant", {
        artifact_dir: String(artifactDir || "").replace(/\\/g, "/"),
        features
      })
    )
    return response.data
  } catch (error) {
    throw new ApiError(502, "Tenant ML API unavailable", {
      detail: toUserFacingMlDetail(error, { tenantScoped: true })
    })
  }
}

module.exports = { requestChurnPrediction, requestTenantPrediction }
