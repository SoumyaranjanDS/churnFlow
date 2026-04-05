const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");
const { Tenant } = require("../models/tenant.model");
const { env } = require("../config/env");
const { ApiError } = require("../utils/ApiError");
const { ensureTenantForUser } = require("../services/tenant.service");

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return null;

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new ApiError(401, "Missing or invalid Authorization header");
    }

    const decoded = jwt.verify(token, env.jwtSecret, {
      issuer: env.jwtIssuer
    });

    const user = await User.findById(decoded.sub)
      .select("name email role isActive isEmailVerified defaultTenantId lastSelectedTenantId");

    if (!user || !user.isActive) {
      throw new ApiError(401, "User is not active or does not exist");
    }

    let tenantId = user.lastSelectedTenantId || user.defaultTenantId;
    let tenant = null;

    if (!tenantId) {
      tenant = await ensureTenantForUser(user);
      tenantId = user.lastSelectedTenantId || user.defaultTenantId || tenant?._id;
    }

    if (!tenantId) {
      throw new ApiError(403, "No active workspace found for this user");
    }

    if (!tenant) {
      tenant = await Tenant.findById(tenantId)
        .select("name slug industryType onboardingStatus")
        .lean();
    }

    if (!tenant) {
      throw new ApiError(403, "Workspace not found or no longer available");
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: Boolean(user.isEmailVerified),
      defaultTenantId: String(user.defaultTenantId || tenant._id),
      currentTenant: {
        id: String(tenant._id),
        name: tenant.name,
        slug: tenant.slug,
        industryType: tenant.industryType,
        onboardingStatus: tenant.onboardingStatus
      }
    };
    req.tenantId = String(tenant._id);
    req.tenant = req.user.currentTenant;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token expired"));
    }

    return next(new ApiError(401, "Invalid token"));
  }
}

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden: insufficient role"));
    }

    return next();
  };
}

module.exports = { requireAuth, authorizeRoles };
