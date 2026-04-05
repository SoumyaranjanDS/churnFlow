const toPlainObject = (value) => {
  if (!value) return {}
  if (typeof value.toObject === "function") return value.toObject()
  return value
}

const normalizeLookupKey = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const isIdentifierFeature = (field = {}) => {
  const normalized = normalizeLookupKey(field?.targetField || field?.sourceColumn || field?.featureName)
  return ["customer_id", "account_id", "id"].includes(normalized) || normalized.endsWith("_id")
}

const hashStringToInteger = (value) => {
  const text = String(value || "")
  let hash = 0

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0
  }

  return Math.abs(hash)
}

const flattenCustomerRecord = (value, prefix = "", output = {}) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return output
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    output[nextPrefix] = nestedValue
    output[normalizeLookupKey(nextPrefix)] = nestedValue

    if (nestedValue && typeof nestedValue === "object" && !Array.isArray(nestedValue)) {
      flattenCustomerRecord(nestedValue, nextPrefix, output)
    }
  })

  return output
}

const mapCustomerToModelFeatures = (customer) => {
  const tenureMonths = customer?.subscription?.tenureMonths ?? 0
  const monthlyCharges = customer?.billing?.monthlyCharges ?? 0

  return {
    tenure_months: tenureMonths,
    monthly_charges: monthlyCharges,
    contract: customer?.billing?.contract || "Month-to-month",
    internet_service: customer?.subscription?.internetService || "Fiber optic",
    tech_support: customer?.subscription?.techSupport || "No"
  }
}

const buildCustomFeatureContract = (model = {}) => {
  const numericColumns = new Set(model?.metadata?.numeric_columns || [])
  const categoricalColumns = new Set(model?.metadata?.categorical_columns || [])
  const featureContract = Array.isArray(model?.metadata?.feature_contract) ? model.metadata.feature_contract : []
  if (featureContract.length) {
    return featureContract
      .filter((item) => item?.feature_name)
      .map((item) => ({
        featureName: item.feature_name,
        sourceColumn: item.source_column || item.feature_name,
        targetField: item.target_field || item.feature_name,
        expectedType: numericColumns.has(item.feature_name)
          ? "numeric"
          : categoricalColumns.has(item.feature_name)
            ? "categorical"
            : "auto"
      }))
  }

  return (model?.featureMappings || [])
    .filter((item) => item?.targetField)
    .map((item) => ({
      featureName: item.targetField,
      sourceColumn: item.sourceColumn || item.targetField,
      targetField: item.targetField,
      expectedType: numericColumns.has(item.targetField)
        ? "numeric"
        : categoricalColumns.has(item.targetField)
          ? "categorical"
          : "auto"
    }))
}

const buildNormalizedFeatureMaps = (customer) => {
  const normalizedFeatures = toPlainObject(customer?.normalizedFeatures)
  const exact = normalizedFeatures || {}
  const normalized = {}

  Object.entries(exact).forEach(([key, value]) => {
    normalized[normalizeLookupKey(key)] = value
  })

  return { exact, normalized }
}

const pickCustomFeatureValue = ({ customer, featureName, sourceColumn, targetField }) => {
  const { exact, normalized } = buildNormalizedFeatureMaps(customer)
  const flatRecord = flattenCustomerRecord(toPlainObject(customer))
  const candidates = [
    featureName,
    sourceColumn,
    targetField,
    normalizeLookupKey(featureName),
    normalizeLookupKey(sourceColumn),
    normalizeLookupKey(targetField)
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(exact, candidate) && exact[candidate] !== undefined) {
      return exact[candidate]
    }

    const normalizedCandidate = normalizeLookupKey(candidate)
    if (Object.prototype.hasOwnProperty.call(normalized, normalizedCandidate) && normalized[normalizedCandidate] !== undefined) {
      return normalized[normalizedCandidate]
    }

    if (Object.prototype.hasOwnProperty.call(flatRecord, candidate) && flatRecord[candidate] !== undefined) {
      return flatRecord[candidate]
    }

    if (
      Object.prototype.hasOwnProperty.call(flatRecord, normalizedCandidate) &&
      flatRecord[normalizedCandidate] !== undefined
    ) {
      return flatRecord[normalizedCandidate]
    }
  }

  return undefined
}

const coerceCustomFeatureValue = ({ value, field }) => {
  if (typeof value === "boolean") {
    const normalizedBoolean = value ? 1 : 0
    return field.expectedType === "categorical"
      ? { value: String(normalizedBoolean) }
      : { value: normalizedBoolean }
  }

  if (typeof value === "number") {
    return field.expectedType === "categorical"
      ? { value: String(value) }
      : { value }
  }

  const normalized = String(value ?? "").trim()
  if (!normalized) return { value: "" }

  const lower = normalized.toLowerCase()
  const booleanLike = ["yes", "true"].includes(lower) ? 1 : ["no", "false"].includes(lower) ? 0 : null

  if (field.expectedType === "categorical") {
    return {
      value: booleanLike === null ? normalized : String(booleanLike)
    }
  }

  if (booleanLike !== null) {
    return { value: booleanLike }
  }

  const parsed = Number(normalized)
  if (Number.isFinite(parsed) && normalized !== "") {
    return { value: parsed }
  }

  if (field.expectedType === "numeric") {
    if (isIdentifierFeature(field)) {
      const digits = normalized.replace(/\D+/g, "")
      if (digits) {
        return { value: Number(digits) }
      }

      return { value: hashStringToInteger(normalized) }
    }

    return {
      invalid: {
        sourceColumn: field.sourceColumn,
        targetField: field.targetField,
        expectedType: "numeric",
        receivedValue: normalized
      }
    }
  }

  return { value: normalized }
}

const buildCustomModelFeatures = (customer, model = {}) => {
  const contract = buildCustomFeatureContract(model)
  const features = {}
  const missing = []
  const invalid = []

  contract.forEach((item) => {
    const rawValue = pickCustomFeatureValue({
      customer,
      featureName: item.featureName,
      sourceColumn: item.sourceColumn,
      targetField: item.targetField
    })

    if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
      missing.push(item.sourceColumn || item.targetField || item.featureName)
      return
    }

    const coerced = coerceCustomFeatureValue({ value: rawValue, field: item })
    if (coerced.invalid) {
      invalid.push(coerced.invalid)
      return
    }

    features[item.featureName] = coerced.value
  })

  return {
    features,
    missing,
    invalid,
    contract
  }
}

const deriveRiskBand = (probability) => {
  if (probability >= 0.75) return "High"
  if (probability >= 0.4) return "Medium"
  return "Low"
}

const buildPredictionExplanation = (customer, churnProbability) => {
  const topDrivers = []
  const recommendedActions = []
  const tenureMonths = customer?.subscription?.tenureMonths ?? 0
  const monthlyCharges = customer?.billing?.monthlyCharges ?? 0
  const contract = customer?.billing?.contract || "Month-to-month"
  const techSupport = customer?.subscription?.techSupport || "No"
  const internetService = customer?.subscription?.internetService || "Fiber optic"

  if (contract === "Month-to-month") {
    topDrivers.push("Customer is on a month-to-month contract.")
    recommendedActions.push("Offer a longer-term retention plan or loyalty incentive.")
  }

  if (tenureMonths <= 6) {
    topDrivers.push("Customer has very short tenure.")
    recommendedActions.push("Trigger an early-life-cycle retention call or onboarding review.")
  }

  if (monthlyCharges >= 80) {
    topDrivers.push("Monthly charges are relatively high.")
    recommendedActions.push("Review plan fit and consider a pricing or bundle adjustment.")
  }

  if (techSupport === "No") {
    topDrivers.push("Customer does not have tech support.")
    recommendedActions.push("Promote support coverage or a service assurance plan.")
  }

  if (internetService === "Fiber optic") {
    topDrivers.push("Fiber optic customers in the base telco profile can show elevated churn risk.")
  }

  if (!topDrivers.length) {
    topDrivers.push("Customer profile appears relatively stable for the current telecom model.")
  }

  if (!recommendedActions.length && churnProbability >= 0.4) {
    recommendedActions.push("Review recent service experience and assign a retention follow-up.")
  }

  return {
    topDrivers: topDrivers.slice(0, 3),
    recommendedActions: recommendedActions.slice(0, 3),
    summary:
      churnProbability >= 0.75
        ? "This customer looks highly likely to churn and should be prioritized quickly."
        : churnProbability >= 0.4
          ? "This customer shows moderate churn risk and is worth reviewing soon."
          : "This customer currently looks relatively stable."
  }
}

const buildCustomPredictionExplanation = ({ customer, churnProbability, model, inputFeatures }) => {
  const topDrivers = []
  const recommendedActions = []
  const featureLabels = buildCustomFeatureContract(model)
    .slice(0, 3)
    .map((item) => item.sourceColumn || item.targetField || item.featureName)

  if (featureLabels.length) {
    topDrivers.push(`This custom model reviewed ${featureLabels.join(", ")} for this record.`)
  }

  const entries = Object.entries(inputFeatures || {})
  const supportSignal = entries.find(([key]) => normalizeLookupKey(key).includes("support"))
  const billingSignal = entries.find(([key]) => normalizeLookupKey(key).includes("bill") || normalizeLookupKey(key).includes("amount") || normalizeLookupKey(key).includes("charge"))
  const engagementSignal = entries.find(([key]) => {
    const normalizedKey = normalizeLookupKey(key)
    return normalizedKey.includes("engagement") || normalizedKey.includes("activity") || normalizedKey.includes("active")
  })

  if (supportSignal && Number(supportSignal[1]) >= 3) {
    topDrivers.push("Support-related activity is elevated for this customer.")
    recommendedActions.push("Review open support issues before the next retention conversation.")
  }

  if (billingSignal && Number(billingSignal[1]) > 0 && churnProbability >= 0.4) {
    recommendedActions.push("Review pricing, packaging, or invoice friction for this account.")
  }

  if (engagementSignal && String(engagementSignal[1]).trim()) {
    topDrivers.push("Recent engagement and activity patterns were included in the custom score.")
    if (churnProbability >= 0.4) {
      recommendedActions.push("Launch a re-engagement touchpoint tailored to recent usage behavior.")
    }
  }

  if (!topDrivers.length) {
    topDrivers.push("This score came from the tenant-specific custom model trained on this workspace data.")
  }

  if (!recommendedActions.length && churnProbability >= 0.75) {
    recommendedActions.push("Assign an immediate owner and start a retention outreach within 24 hours.")
  }

  if (!recommendedActions.length && churnProbability >= 0.4) {
    recommendedActions.push("Review this account soon and decide whether proactive follow-up is needed.")
  }

  if (!recommendedActions.length) {
    recommendedActions.push("Keep monitoring this account and record any future churn outcome for retraining.")
  }

  return {
    topDrivers: topDrivers.slice(0, 3),
    recommendedActions: recommendedActions.slice(0, 3),
    summary:
      churnProbability >= 0.75
        ? "The deployed custom model sees strong churn risk for this account."
        : churnProbability >= 0.4
          ? "The deployed custom model sees moderate churn risk for this account."
          : "The deployed custom model currently sees this account as relatively stable."
  }
}

module.exports = {
  buildPredictionExplanation,
  buildCustomPredictionExplanation,
  buildCustomFeatureContract,
  buildCustomModelFeatures,
  deriveRiskBand,
  mapCustomerToModelFeatures
}
