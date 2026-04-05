const express = require("express");
const { getCurrentTenant } = require("../controllers/tenant.controller");
const { authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/current", authorizeRoles("admin", "manager", "agent"), getCurrentTenant);

module.exports = { tenantRouter: router };

