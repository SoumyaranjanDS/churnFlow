const express = require("express");
const {
  createCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer
} = require("../controllers/customer.controller");
const { authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authorizeRoles("admin", "manager"), createCustomer);
router.get("/", authorizeRoles("admin", "manager", "agent"), listCustomers);
router.get("/:customerId", authorizeRoles("admin", "manager", "agent"), getCustomerById);
router.patch("/:customerId", authorizeRoles("admin", "manager"), updateCustomer);

module.exports = { customerRouter: router };
