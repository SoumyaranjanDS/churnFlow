const axios = require("axios");
const { env } = require("../config/env");
const { ApiError } = require("../utils/ApiError");

const client = axios.create({
  baseURL: env.mlApiUrl,
  timeout: env.mlApiTimeoutMs
});

const extractMlDetail = (error) => {
  const detail = error?.response?.data?.detail
  if (detail) return detail

  if (typeof error?.response?.data === "string" && error.response.data.trim()) {
    return error.response.data
  }

  return error.message
}

const requestChurnPrediction = async (features) => {
  try {
    const response = await client.post("/v1/predict", features);
    return response.data;
  } catch (error) {
    throw new ApiError(502, "ML API unavailable", {
      detail: extractMlDetail(error)
    });
  }
}

const requestTenantPrediction = async ({ artifactDir, features }) => {
  try {
    const response = await client.post("/v1/predict-tenant", {
      artifact_dir: String(artifactDir || "").replace(/\\/g, "/"),
      features
    });
    return response.data;
  } catch (error) {
    throw new ApiError(502, "Tenant ML API unavailable", {
      detail: extractMlDetail(error)
    });
  }
}

module.exports = { requestChurnPrediction, requestTenantPrediction };
