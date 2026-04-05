const XLSX = require("xlsx")
const { Customer } = require("../models/customer.model")
const { ApiError } = require("../utils/ApiError")
const { getActiveModelForTenant } = require("./training.service")

const normalizeLookupKey = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

const buildFeatureContract = (model = {}) => {
  const identifierContract = Array.isArray(model?.metadata?.identifier_contract) ? model.metadata.identifier_contract : []
  const metadataContract = Array.isArray(model?.metadata?.feature_contract) ? model.metadata.feature_contract : []
  if (identifierContract.length || metadataContract.length) {
    const seen = new Set()
    return [...identifierContract, ...metadataContract]
      .map((item) => ({
      featureName: item.feature_name,
      sourceColumn: item.source_column || item.feature_name,
      targetField: item.target_field || item.feature_name
      }))
      .filter((item) => {
        const key = `${normalizeLookupKey(item.sourceColumn)}::${normalizeLookupKey(item.targetField)}`
        if (seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })
  }

  return (model?.featureMappings || []).map((item) => ({
    featureName: item.targetField,
    sourceColumn: item.sourceColumn || item.targetField,
    targetField: item.targetField
  }))
}

const isIdentifierFeature = (field) => {
  const normalized = normalizeLookupKey(field?.targetField || field?.sourceColumn || field?.featureName)
  return ["customer_id", "account_id", "id"].includes(normalized) || normalized.endsWith("_id")
}

const getRowsFromWorkbook = (workbook, sheetName) => {
  const targetSheet = sheetName && workbook.Sheets[sheetName] ? sheetName : workbook.SheetNames[0]
  if (!targetSheet) {
    throw new ApiError(400, "No sheet found in workbook")
  }

  const worksheet = workbook.Sheets[targetSheet]
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null })
  return { rows, sheetName: targetSheet }
}

const getCellValue = (row, columnName) => {
  if (!columnName) return undefined
  if (Object.prototype.hasOwnProperty.call(row, columnName)) {
    return row[columnName]
  }

  const normalizedTarget = normalizeLookupKey(columnName)
  const rowEntries = Object.entries(row || {})
  const match = rowEntries.find(([key]) => normalizeLookupKey(key) === normalizedTarget)
  return match ? match[1] : undefined
}

const validateRequiredColumns = ({ rows, featureContract }) => {
  if (!rows.length) {
    throw new ApiError(400, "Uploaded file has no data rows.")
  }

  const firstRow = rows[0] || {}
  const availableColumns = Object.keys(firstRow)
  const normalizedAvailable = new Set(availableColumns.map((item) => normalizeLookupKey(item)))
  const identifierField = featureContract.find((field) => isIdentifierFeature(field))
  const missingColumns = featureContract
    .map((field) => field.sourceColumn)
    .filter((columnName) => !normalizedAvailable.has(normalizeLookupKey(columnName)))

  if (!identifierField) {
    const hasFallbackCustomerId =
      normalizedAvailable.has(normalizeLookupKey("customerId")) ||
      normalizedAvailable.has(normalizeLookupKey("customer_id"))

    if (!hasFallbackCustomerId) {
      missingColumns.unshift("customerId")
    }
  }

  if (missingColumns.length) {
    throw new ApiError(400, "Uploaded file does not match the deployed custom model template.", {
      missingColumns,
      availableColumns
    })
  }
}

const parseUploadRows = ({ rows, tenantId, model }) => {
  const featureContract = buildFeatureContract(model)
  if (!featureContract.length) {
    throw new ApiError(409, "The deployed custom model does not have a usable feature contract.")
  }

  validateRequiredColumns({ rows, featureContract })

  const identifierField = featureContract.find((field) => isIdentifierFeature(field))
  const docsById = new Map()
  let skippedRows = 0

  rows.forEach((row) => {
    const identifierValue = identifierField ? getCellValue(row, identifierField.sourceColumn) : undefined
    const fallbackId = getCellValue(row, "customerId") || getCellValue(row, "customer_id")
    const customerId = String(identifierValue || fallbackId || "").trim()

    if (!customerId) {
      skippedRows += 1
      return
    }

    const normalizedFeatures = {}
    featureContract.forEach((field) => {
      if (isIdentifierFeature(field)) {
        normalizedFeatures[field.sourceColumn] = customerId
        return
      }

      normalizedFeatures[field.sourceColumn] = getCellValue(row, field.sourceColumn)
    })

    docsById.set(customerId, {
      tenantId,
      customerId,
      industryType: "custom",
      schemaVersion: model.version || "custom-v1",
      normalizedFeatures,
      source: "custom_upload"
    })
  })

  return {
    docs: Array.from(docsById.values()),
    skippedRows
  }
}

const upsertCustomerDocs = async ({ tenantId, docs }) => {
  if (!docs.length) {
    throw new ApiError(400, "No valid customer rows found to import.")
  }

  const customerIds = docs.map((doc) => doc.customerId)
  const existing = await Customer.find({ tenantId, customerId: { $in: customerIds } })
    .select({ customerId: 1 })
    .lean()
  const existingSet = new Set(existing.map((item) => item.customerId))

  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { tenantId, customerId: doc.customerId },
      update: { $set: doc },
      upsert: true
    }
  }))

  await Customer.bulkWrite(ops, { ordered: false })

  let createdCount = 0
  let updatedCount = 0
  docs.forEach((doc) => {
    if (existingSet.has(doc.customerId)) {
      updatedCount += 1
    } else {
      createdCount += 1
    }
  })

  return {
    totalProcessed: docs.length,
    createdCount,
    updatedCount
  }
}

const importCustomFromBuffer = async ({ buffer, originalName = "uploaded-dataset.xlsx", sheetName = "", tenantId }) => {
  if (!buffer || !buffer.length) {
    throw new ApiError(400, "Uploaded file is empty.")
  }

  if (!tenantId) {
    throw new ApiError(400, "tenantId is required for custom import.")
  }

  const activeModel = await getActiveModelForTenant(tenantId)
  if (!activeModel?.deployment?.isDeployed) {
    throw new ApiError(409, "Deploy a custom model before using custom bulk upload.")
  }

  const workbook = XLSX.read(buffer, { type: "buffer" })
  const { rows, sheetName: usedSheet } = getRowsFromWorkbook(workbook, sheetName)
  const { docs, skippedRows } = parseUploadRows({ rows, tenantId, model: activeModel })
  const summary = await upsertCustomerDocs({ tenantId, docs })

  return {
    source: "upload",
    fileName: originalName,
    sheetName: usedSheet,
    skippedRows,
    modelVersion: activeModel.version,
    requiredColumns: buildFeatureContract(activeModel).map((field) => field.sourceColumn),
    ...summary
  }
}

module.exports = {
  importCustomFromBuffer
}
