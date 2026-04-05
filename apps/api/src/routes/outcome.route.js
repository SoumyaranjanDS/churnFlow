const express = require("express");
const { authorizeRoles } = require("../middleware/auth.middleware");
const { createOutcome, listOutcomes, getCustomerOutcomes } = require("../controllers/outcome.controller");

const router = express.Router();

router.post("/", authorizeRoles("admin", "manager", "agent"), createOutcome);
router.get("/", authorizeRoles("admin", "manager", "agent"), listOutcomes);
router.get("/customer/:customerId", authorizeRoles("admin", "manager", "agent"), getCustomerOutcomes);

module.exports = { outcomeRouter: router };
