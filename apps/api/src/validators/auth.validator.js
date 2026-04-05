const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["admin", "manager", "agent"]).optional(),
  workspaceIntent: z.enum(["telecom", "custom"]).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  token: z.string().min(8)
});

const resendVerificationSchema = z.object({
  email: z.string().email()
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(8),
  password: z.string().min(8).max(72)
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
