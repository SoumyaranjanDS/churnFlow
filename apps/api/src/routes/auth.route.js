const express = require("express");
const {
  register,
  login,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  getMe,
  listUsers,
} = require("../controllers/auth.controller");
const { requireAuth, authorizeRoles } = require("../middleware/auth.middleware");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();

const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `register:${req.ip}`,
  message: "Too many registration attempts. Try again in a few minutes.",
});

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => `login:${req.ip}`,
  message: "Too many login attempts. Try again in a few minutes.",
});

const verifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => `verify-email:${req.ip}`,
  message: "Too many verification attempts. Try again later.",
});

const resendLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `resend-verification:${req.ip}`,
  message: "Too many resend attempts. Try again later.",
});

const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `forgot-password:${req.ip}`,
  message: "Too many password reset requests. Try again later.",
});

const resetPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `reset-password:${req.ip}`,
  message: "Too many password reset attempts. Try again later.",
});

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/verify-email", verifyLimiter, verifyEmail);
router.post("/resend-verification", resendLimiter, resendVerification);
router.post("/forgot-password", forgotPasswordLimiter, requestPasswordReset);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.post("/users", requireAuth, authorizeRoles("admin"), register);
router.get("/me", requireAuth, getMe);
router.get("/users", requireAuth, authorizeRoles("admin"), listUsers);

module.exports = { authRouter: router };
