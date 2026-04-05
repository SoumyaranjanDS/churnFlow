const { Tenant } = require("../models/tenant.model");
const { TenantMembership } = require("../models/tenantMembership.model");

const slugify = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const createUniqueTenantSlug = async (baseName) => {
  const baseSlug = slugify(baseName) || "workspace";
  let attempt = 0;

  while (attempt < 20) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const existing = await Tenant.findOne({ slug: candidate }).select("_id").lean();
    if (!existing) {
      return candidate;
    }
    attempt += 1;
  }

  return `${baseSlug}-${Date.now()}`;
}

const getTenantDefaults = ({ user, industryType = "telecom", tenantName = "" }) => {
  if (tenantName) {
    return {
      name: tenantName,
      onboardingStatus: industryType === "custom" ? "schema_ready" : "prediction_ready"
    }
  }

  if (industryType === "custom") {
    return {
      name: `${user.name}'s Custom Model Workspace`,
      onboardingStatus: "schema_ready"
    }
  }

  return {
    name: `${user.name}'s Telecom Workspace`,
    onboardingStatus: "prediction_ready"
  }
}

const createTenantForUser = async ({ user, tenantName, tenantRole = "owner", industryType = "telecom" }) => {
  const defaults = getTenantDefaults({ user, industryType, tenantName })
  const name = defaults.name;
  const slug = await createUniqueTenantSlug(name);

  const tenant = await Tenant.create({
    name,
    slug,
    industryType,
    onboardingStatus: defaults.onboardingStatus
  });

  await TenantMembership.create({
    tenantId: tenant._id,
    userId: user._id,
    tenantRole
  });

  user.defaultTenantId = tenant._id;
  user.lastSelectedTenantId = tenant._id;
  await user.save();

  return tenant;
}

const ensureTenantForUser = async (user) => {
  if (!user) return null;

  const existingTenantId = user.lastSelectedTenantId || user.defaultTenantId;
  if (existingTenantId) {
    return Tenant.findById(existingTenantId).lean();
  }

  return createTenantForUser({
    user,
    tenantName: `${user.name}'s Telecom Workspace`,
    tenantRole: "owner",
    industryType: "telecom"
  });
}

const addUserToTenant = async ({ user, tenantId, tenantRole = "agent" }) => {
  await TenantMembership.findOneAndUpdate(
    { tenantId, userId: user._id },
    { $set: { tenantRole } },
    { upsert: true, new: true }
  );

  if (!user.defaultTenantId) {
    user.defaultTenantId = tenantId;
  }
  user.lastSelectedTenantId = tenantId;
  await user.save();
}

const getCurrentTenantForUser = async (user) => {
  const tenantId = user?.lastSelectedTenantId || user?.defaultTenantId;
  if (!tenantId) return null;

  return Tenant.findById(tenantId).lean();
}

const listMembershipUserIds = async (tenantId) => {
  const memberships = await TenantMembership.find({ tenantId }).select("userId").lean();
  return memberships.map((item) => item.userId);
}

module.exports = {
  addUserToTenant,
  createTenantForUser,
  ensureTenantForUser,
  getCurrentTenantForUser,
  listMembershipUserIds
};
