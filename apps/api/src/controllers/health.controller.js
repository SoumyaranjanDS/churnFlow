const { env } = require("../config/env");
const { apiResponse } = require("../utils/apiResponse");

const getHealth = (req, res) => {
  return apiResponse(req, res, 200, "API healthy", {
    service: "api",
    env: env.nodeEnv,
    uptimeSeconds: Math.round(process.uptime())
  });
}

module.exports = { getHealth };
