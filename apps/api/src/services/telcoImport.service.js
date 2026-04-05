const fs = require("fs");
const XLSX = require("xlsx");
const { Customer } = require("../models/customer.model");
const { ApiError } = require("../utils/ApiError");
const { mapCustomerToModelFeatures } = require("./customerFeatures.service");

const parseBoolean = (value) => {
  if (value === true || value === false) return value;
  if (value === null || value === undefined) return undefined;

  const normalized = String(value).trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(normalized)) return true;
  if (["no", "n", "false", "0"].includes(normalized)) return false;
  return undefined;
}

const parseNumber = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const rowToCustomerDoc = (row, tenantId) => {
  const customerId = String(row.CustomerID || "").trim();
  if (!customerId) {
    return null;
  }

  const doc = {
    tenantId,
    customerId,
    industryType: "telecom",
    schemaVersion: "telco-v1",
    profile: {
      country: row.Country,
      state: row.State,
      city: row.City,
      gender: row.Gender,
      seniorCitizen: parseBoolean(row["Senior Citizen"]),
      partner: parseBoolean(row.Partner),
      dependents: parseBoolean(row.Dependents)
    },
    subscription: {
      tenureMonths: parseNumber(row["Tenure Months"]),
      phoneService: row["Phone Service"],
      multipleLines: row["Multiple Lines"],
      internetService: row["Internet Service"],
      onlineSecurity: row["Online Security"],
      onlineBackup: row["Online Backup"],
      deviceProtection: row["Device Protection"],
      techSupport: row["Tech Support"],
      streamingTV: row["Streaming TV"],
      streamingMovies: row["Streaming Movies"]
    },
    billing: {
      contract: row.Contract,
      paperlessBilling: row["Paperless Billing"],
      paymentMethod: row["Payment Method"],
      monthlyCharges: parseNumber(row["Monthly Charges"]),
      totalCharges: parseNumber(row["Total Charges"]),
      cltv: parseNumber(row.CLTV)
    },
    churnMeta: {
      churnLabel: row["Churn Label"],
      churnValue: parseNumber(row["Churn Value"]),
      churnScore: parseNumber(row["Churn Score"]),
      churnReason: row["Churn Reason"]
    },
    source: "telco_xlsx"
  };

  doc.normalizedFeatures = mapCustomerToModelFeatures(doc);
  return doc;
}

const getRowsFromWorkbook = (workbook, sheetName) => {
  const targetSheet = sheetName && workbook.Sheets[sheetName] ? sheetName : workbook.SheetNames[0];
  if (!targetSheet) {
    throw new ApiError(400, "No sheet found in workbook");
  }

  const worksheet = workbook.Sheets[targetSheet];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  return { rows, sheetName: targetSheet };
}

const toUniqueDocs = (rows, tenantId) => {
  const docsById = new Map();
  rows.forEach((row) => {
    const doc = rowToCustomerDoc(row, tenantId);
    if (doc?.customerId) {
      docsById.set(doc.customerId, doc);
    }
  });

  return Array.from(docsById.values());
}

const upsertCustomerDocs = async (docs, tenantId) => {
  if (!docs.length) {
    throw new ApiError(400, "No valid customer rows found to import");
  }

  const customerIds = docs.map((doc) => doc.customerId);
  const existing = await Customer.find({ tenantId, customerId: { $in: customerIds } })
    .select({ customerId: 1 })
    .lean();
  const existingSet = new Set(existing.map((item) => item.customerId));

  const ops = docs.map((doc) => ({
    updateOne: {
      filter: { tenantId, customerId: doc.customerId },
      update: { $set: doc },
      upsert: true
    }
  }));

  await Customer.bulkWrite(ops, { ordered: false });

  let createdCount = 0;
  let updatedCount = 0;

  docs.forEach((doc) => {
    if (existingSet.has(doc.customerId)) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }
  });

  return {
    totalProcessed: docs.length,
    createdCount,
    updatedCount
  };
}

const importTelcoFromPath = async (filePath, sheetName, tenantId) => {
  if (!filePath || !String(filePath).trim()) {
    throw new ApiError(400, "filePath is required");
  }
  if (!tenantId) {
    throw new ApiError(400, "tenantId is required for telecom import");
  }
  if (!fs.existsSync(filePath)) {
    throw new ApiError(400, `File not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const { rows, sheetName: usedSheet } = getRowsFromWorkbook(workbook, sheetName);
  const docs = toUniqueDocs(rows, tenantId);
  const summary = await upsertCustomerDocs(docs, tenantId);

  return {
    source: "path",
    filePath,
    sheetName: usedSheet,
    ...summary
  };
}

const importTelcoFromBuffer = async (buffer, sheetName, originalName = "uploaded.xlsx", tenantId) => {
  if (!buffer || !buffer.length) {
    throw new ApiError(400, "Uploaded file is empty");
  }
  if (!tenantId) {
    throw new ApiError(400, "tenantId is required for telecom import");
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const { rows, sheetName: usedSheet } = getRowsFromWorkbook(workbook, sheetName);
  const docs = toUniqueDocs(rows, tenantId);
  const summary = await upsertCustomerDocs(docs, tenantId);

  return {
    source: "upload",
    fileName: originalName,
    sheetName: usedSheet,
    ...summary
  };
}

module.exports = {
  importTelcoFromPath,
  importTelcoFromBuffer
};

