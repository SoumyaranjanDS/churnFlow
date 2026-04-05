const express = require("express");
const { healthRouter } = require("./health.route");
const { authRouter } = require("./auth.route");
const { customerRouter } = require("./customer.route");
const { scoringRouter } = require("./scoring.route");
const { actionRouter } = require("./action.route");
const { importRouter } = require("./import.route");
const { outcomeRouter } = require("./outcome.route");
const { dashboardRouter } = require("./dashboard.route");
const { contactRouter } = require("./contact.route");
const { tenantRouter } = require("./tenant.route");
const { onboardingRouter } = require("./onboarding.route");
const { trainingRouter } = require("./training.route");
const { analyticsRouter } = require("./analytics.route");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.use("/", healthRouter);
router.use("/auth", authRouter);
router.use("/contact", contactRouter);
router.use("/analytics", analyticsRouter);

router.use("/customers", requireAuth, customerRouter);
router.use("/scoring", requireAuth, scoringRouter);
router.use("/actions", requireAuth, actionRouter);
router.use("/import", requireAuth, importRouter);
router.use("/outcomes", requireAuth, outcomeRouter);
router.use("/dashboard", requireAuth, dashboardRouter);
router.use("/tenants", requireAuth, tenantRouter);
router.use("/onboarding", requireAuth, onboardingRouter);
router.use("/training", requireAuth, trainingRouter);

module.exports = { router };
