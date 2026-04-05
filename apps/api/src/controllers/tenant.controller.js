const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");

const getCurrentTenant = asyncHandler(async (req, res) => {
  return apiResponse(req, res, 200, "Current workspace fetched", {
    tenant: req.tenant
  });
});

module.exports = { getCurrentTenant };

