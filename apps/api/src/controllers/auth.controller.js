const jwt = require("jsonwebtoken");

const { User } = require("../models/user.model");
const { env } = require("../config/env");
const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");
const { ApiError } = require("../utils/ApiError");
const { sendPasswordResetEmail, sendVerificationEmail } = require("../services/email.service");
const {
  addUserToTenant,
  createTenantForUser,
  ensureTenantForUser,
  getCurrentTenantForUser,
  listMembershipUserIds
} = require("../services/tenant.service");
const { recordAnalyticsEventSafe } = require("../services/analytics.service");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");

const buildToken = (user) => {
  return jwt.sign(
    {
      role: user.role,
      email: user.email,
      tenantId: String(user.lastSelectedTenantId || user.defaultTenantId || "")
    },
    env.jwtSecret,
    {
      subject: String(user._id),
      expiresIn: env.jwtExpiresIn,
      issuer: env.jwtIssuer,
    }
  );
}

const mapTenant = (tenant) => {
  if (!tenant) return null;
  return {
    id: tenant._id,
    name: tenant.name,
    slug: tenant.slug,
    industryType: tenant.industryType,
    onboardingStatus: tenant.onboardingStatus
  };
}

const mapUser = (user, currentTenant = null) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: Boolean(user.isEmailVerified),
    currentTenant: mapTenant(currentTenant)
  };
}

const dispatchVerificationEmail = async (user, plainToken) => {
  const emailDelivery = await sendVerificationEmail({
    name: user.name,
    email: user.email,
    token: plainToken,
  });

  const debug =
    env.nodeEnv !== "production" && emailDelivery?.verifyUrl
      ? {
          verifyUrl: emailDelivery.verifyUrl,
          verifyToken: plainToken,
        }
      : {};

  return { emailDelivery, debug };
}

const dispatchPasswordResetEmail = async (user, plainToken) => {
  const emailDelivery = await sendPasswordResetEmail({
    name: user.name,
    email: user.email,
    token: plainToken,
  });

  const debug =
    env.nodeEnv !== "production" && emailDelivery?.resetUrl
      ? {
          resetUrl: emailDelivery.resetUrl,
          resetToken: plainToken,
        }
      : {};

  return { emailDelivery, debug };
}

const register = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const email = payload.email.toLowerCase();
  const workspaceIntent = payload.workspaceIntent || "telecom";

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, `User already exists: ${payload.email}`);
  }

  const isAdminCreatedUser = Boolean(req.user && req.user.role === "admin" && req.tenantId);
  const roleToAssign = isAdminCreatedUser ? payload.role || "agent" : "admin";

  const user = new User({
    name: payload.name,
    email,
    role: roleToAssign,
    isEmailVerified: env.requireEmailVerification ? false : true,
  });

  await user.setPassword(payload.password);

  let plainVerificationToken = null;
  if (env.requireEmailVerification) {
    plainVerificationToken = user.createEmailVerificationToken(env.emailVerificationTokenTtlMinutes);
  }

  await user.save();

  let currentTenant = null;
  if (isAdminCreatedUser) {
    await addUserToTenant({
      user,
      tenantId: req.tenantId,
      tenantRole: roleToAssign === "admin" ? "admin" : roleToAssign
    });
    currentTenant = await getCurrentTenantForUser(user);
  } else {
    currentTenant = await createTenantForUser({
      user,
      tenantName: workspaceIntent === "custom" ? `${payload.name}'s Custom Model Workspace` : `${payload.name}'s Telecom Workspace`,
      tenantRole: "owner",
      industryType: workspaceIntent
    });
  }

  let debugVerification = {};
  if (env.requireEmailVerification && plainVerificationToken) {
    const { debug } = await dispatchVerificationEmail(user, plainVerificationToken);
    debugVerification = debug;
  }

  const token = env.requireEmailVerification ? null : buildToken(user);

  await recordAnalyticsEventSafe({
    eventName: "signup_completed",
    source: "server",
    pathGroup: "auth",
    route: "/signup",
    tenantId: currentTenant?._id,
    userId: user._id,
    context: {
      workspaceIntent,
      verificationRequired: Boolean(env.requireEmailVerification)
    }
  })

  return apiResponse(req, res, 201, "User registered", {
    user: mapUser(user, currentTenant),
    token,
    verificationRequired: env.requireEmailVerification,
    workspaceIntent,
    ...debugVerification,
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);

  const user = await User.findOne({ email: payload.email.toLowerCase() }).select(
    "name email role isActive isEmailVerified passwordHash defaultTenantId lastSelectedTenantId"
  );

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const validPassword = await user.comparePassword(payload.password);
  if (!validPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (env.requireEmailVerification && user.isEmailVerified === false) {
    throw new ApiError(403, "Email not verified. Please verify your email before login.");
  }

  if (!user.defaultTenantId && !user.lastSelectedTenantId) {
    await ensureTenantForUser(user);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = buildToken(user);
  const currentTenant = await getCurrentTenantForUser(user);

  return apiResponse(req, res, 200, "Login successful", {
    user: mapUser(user, currentTenant),
    token,
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const payload = verifyEmailSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  const user = await User.findOne({ email }).select(
    "name email role isActive isEmailVerified emailVerificationTokenHash emailVerificationExpiresAt emailVerificationSentAt defaultTenantId lastSelectedTenantId"
  );

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  if (user.isEmailVerified) {
    const token = buildToken(user);
    const currentTenant = await getCurrentTenantForUser(user);
    return apiResponse(req, res, 200, "Email already verified", {
      user: mapUser(user, currentTenant),
      token,
      verificationRequired: false,
    });
  }

  if (!user.isValidEmailVerificationToken(payload.token)) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  user.emailVerificationSentAt = undefined;

  if (!user.defaultTenantId && !user.lastSelectedTenantId) {
    await ensureTenantForUser(user);
  }

  await user.save();

  const token = buildToken(user);
  const currentTenant = await getCurrentTenantForUser(user);

  await recordAnalyticsEventSafe({
    eventName: "email_verification_completed",
    source: "server",
    pathGroup: "auth",
    route: "/verify-email",
    tenantId: currentTenant?._id,
    userId: user._id,
    context: {
      workspaceIntent: currentTenant?.industryType || "telecom"
    }
  })

  return apiResponse(req, res, 200, "Email verified successfully", {
    user: mapUser(user, currentTenant),
    token,
    verificationRequired: false,
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const payload = resendVerificationSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  const user = await User.findOne({ email }).select(
    "name email isEmailVerified emailVerificationSentAt emailVerificationTokenHash emailVerificationExpiresAt"
  );

  // Generic response avoids account enumeration.
  const genericResponse = () =>
    apiResponse(req, res, 200, "If this account exists, a verification email was sent.", {
      verificationRequired: env.requireEmailVerification,
    });

  if (!user) {
    return genericResponse();
  }

  if (user.isEmailVerified) {
    return apiResponse(req, res, 200, "Email already verified.", {
      verificationRequired: false,
    });
  }

  const cooldownSeconds = env.emailVerificationResendCooldownSeconds;
  if (user.emailVerificationSentAt instanceof Date) {
    const elapsedSeconds = (Date.now() - user.emailVerificationSentAt.getTime()) / 1000;
    if (elapsedSeconds < cooldownSeconds) {
      throw new ApiError(429, `Please wait before requesting another verification email.`);
    }
  }

  const plainVerificationToken = user.createEmailVerificationToken(env.emailVerificationTokenTtlMinutes);
  await user.save();

  const { debug } = await dispatchVerificationEmail(user, plainVerificationToken);

  return apiResponse(req, res, 200, "Verification email sent.", {
    verificationRequired: true,
    ...debug,
  });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const payload = forgotPasswordSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  const user = await User.findOne({ email }).select(
    "name email isActive passwordResetSentAt passwordResetTokenHash passwordResetExpiresAt"
  );

  const genericResponse = (debug = {}) =>
    apiResponse(req, res, 200, "If this account exists, a password reset email was sent.", debug);

  if (!user || !user.isActive) {
    return genericResponse();
  }

  const cooldownSeconds = env.passwordResetResendCooldownSeconds;
  if (user.passwordResetSentAt instanceof Date) {
    const elapsedSeconds = (Date.now() - user.passwordResetSentAt.getTime()) / 1000;
    if (elapsedSeconds < cooldownSeconds) {
      throw new ApiError(429, "Please wait before requesting another password reset email.");
    }
  }

  const plainResetToken = user.createPasswordResetToken(env.passwordResetTokenTtlMinutes);
  await user.save();

  const { debug } = await dispatchPasswordResetEmail(user, plainResetToken);

  return genericResponse(debug);
});

const resetPassword = asyncHandler(async (req, res) => {
  const payload = resetPasswordSchema.parse(req.body);
  const email = payload.email.toLowerCase();

  const user = await User.findOne({ email }).select(
    "name email role isActive isEmailVerified passwordHash passwordResetTokenHash passwordResetExpiresAt passwordResetSentAt defaultTenantId lastSelectedTenantId"
  );

  if (!user || !user.isActive || !user.isValidPasswordResetToken(payload.token)) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  await user.setPassword(payload.password);
  user.clearPasswordResetToken();

  if (!user.defaultTenantId && !user.lastSelectedTenantId) {
    await ensureTenantForUser(user);
  }

  await user.save();

  const token = buildToken(user);
  const currentTenant = await getCurrentTenantForUser(user);

  return apiResponse(req, res, 200, "Password reset successful", {
    user: mapUser(user, currentTenant),
    token,
  });
});

const getMe = asyncHandler(async (req, res) => {
  return apiResponse(req, res, 200, "Current user fetched", {
    user: req.user,
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const tenantUserIds = await listMembershipUserIds(req.tenantId);
  const users = await User.find({ _id: { $in: tenantUserIds } })
    .select("name email role isActive isEmailVerified lastLoginAt createdAt")
    .sort({ createdAt: -1 });
  return apiResponse(req, res, 200, "Users fetched", users);
});

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  getMe,
  listUsers,
};
