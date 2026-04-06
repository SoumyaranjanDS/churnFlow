import axios from "axios"
import { clearAuth, getToken } from "./authStorage"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 75000)

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number.isFinite(API_TIMEOUT_MS) ? API_TIMEOUT_MS : 75000
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const requestTimeout = error?.config?.timeout
    const timedOut = error?.code === "ECONNABORTED" || String(error?.message || "").toLowerCase().includes("timeout")
    const timeoutMessage = requestTimeout
      ? `This request took longer than ${Math.round(requestTimeout / 1000)} seconds. Please try again.`
      : "This request took too long. Please try again."
    const message = timedOut
      ? timeoutMessage
      : error?.response?.data?.message || error.message || "Request failed"

    if (status === 401) {
      clearAuth()
    }

    const wrapped = new Error(message)
    wrapped.status = status
    wrapped.details = error?.response?.data?.details || null
    wrapped.errors = error?.response?.data?.errors || null
    wrapped.responseData = error?.response?.data || null
    return Promise.reject(wrapped)
  }
)

export { apiClient }
