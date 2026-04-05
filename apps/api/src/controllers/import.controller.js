const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");
const { ApiError } = require("../utils/ApiError");
const { env } = require("../config/env");
const { importFromPathSchema } = require("../validators/import.validator");
const { importTelcoFromPath, importTelcoFromBuffer } = require("../services/telcoImport.service");
const { importCustomFromBuffer } = require("../services/customImport.service");

const importTelcoByPath = asyncHandler(async (req, res) => {
  const payload = importFromPathSchema.parse(req.body || {});
  const filePath = payload.filePath || env.telcoDatasetPath;

  if (!filePath) {
    throw new ApiError(400, "filePath is required in body or TELCO_DATASET_PATH env");
  }

  const result = await importTelcoFromPath(filePath, payload.sheetName, req.tenantId);
  return apiResponse(req, res, 201, "Telco data imported from path", result);
});

const importTelcoByUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Upload a .xlsx file using form-data key 'file'");
  }

  const sheetName = req.body?.sheetName;
  const result = await importTelcoFromBuffer(req.file.buffer, sheetName, req.file.originalname, req.tenantId);
  return apiResponse(req, res, 201, "Telco data imported from upload", result);
});

const importCustomByUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Upload a .csv or .xlsx file using form-data key 'file'");
  }

  const sheetName = req.body?.sheetName;
  const result = await importCustomFromBuffer({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    sheetName,
    tenantId: req.tenantId
  });

  return apiResponse(req, res, 201, "Custom data imported from upload", result);
});

module.exports = {
  importTelcoByPath,
  importTelcoByUpload,
  importCustomByUpload
};
