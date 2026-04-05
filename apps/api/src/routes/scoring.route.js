const express = require("express");
const {
  getCustomerPredictions,
  getLatestPredictions,
  scoreBatchCustomers,
  scoreCustomer
} = require("../controllers/scoring.controller");
const { authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/predict", authorizeRoles("admin", "manager", "agent"), scoreCustomer);
router.post("/batch", authorizeRoles("admin", "manager", "agent"), scoreBatchCustomers);
router.get("/latest", authorizeRoles("admin", "manager", "agent"), getLatestPredictions);
router.get("/history/:customerId", authorizeRoles("admin", "manager", "agent"), getCustomerPredictions);

module.exports = { scoringRouter: router };
