const { Customer } = require("../models/customer.model");
const { mapCustomerToModelFeatures } = require("./customerFeatures.service");

const buildTenantCustomerFromLegacy = (legacyCustomer, tenantId) => {
  const payload = {
    tenantId,
    customerId: legacyCustomer.customerId,
    industryType: legacyCustomer.industryType || "telecom",
    schemaVersion: legacyCustomer.schemaVersion || "telco-v1",
    profile: legacyCustomer.profile || {},
    subscription: legacyCustomer.subscription || {},
    billing: legacyCustomer.billing || {},
    churnMeta: legacyCustomer.churnMeta || {},
    source: legacyCustomer.source || "legacy_import"
  };

  payload.normalizedFeatures = legacyCustomer.normalizedFeatures || mapCustomerToModelFeatures(payload);
  return payload;
}

const ensureTenantCustomer = async ({ tenantId, customerId }) => {
  if (!tenantId || !customerId) return null;

  const normalizedCustomerId = String(customerId).trim();
  if (!normalizedCustomerId) return null;

  const existing = await Customer.findOne({ tenantId, customerId: normalizedCustomerId });
  if (existing) {
    return existing;
  }

  const legacyCustomer = await Customer.findOne({
    customerId: normalizedCustomerId,
    tenantId: { $exists: false }
  });

  if (!legacyCustomer) {
    return null;
  }

  const tenantCustomerPayload = buildTenantCustomerFromLegacy(
    typeof legacyCustomer.toObject === "function" ? legacyCustomer.toObject() : legacyCustomer,
    tenantId
  );

  const claimed = await Customer.findOneAndUpdate(
    { _id: legacyCustomer._id, tenantId: { $exists: false } },
    { $set: tenantCustomerPayload },
    { new: true }
  );

  return claimed;
}

module.exports = {
  ensureTenantCustomer
};
