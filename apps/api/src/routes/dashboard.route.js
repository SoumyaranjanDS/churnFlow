const express = require("express");
const { authorizeRoles } = require("../middleware/auth.middleware");
const { getDashboardSummary } = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/summary", authorizeRoles("admin", "manager", "agent"), getDashboardSummary);

module.exports = { dashboardRouter: router };
