const express = require("express");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");
const { submitContact } = require("../controllers/contact.controller");

const router = express.Router();

const contactLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: (req) => `contact:${req.ip}`,
  message: "Too many contact requests. Please try again in a few minutes."
});

router.post("/", contactLimiter, submitContact);

module.exports = { contactRouter: router };
