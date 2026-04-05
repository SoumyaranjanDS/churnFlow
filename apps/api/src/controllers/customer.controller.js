const { Customer } = require("../models/customer.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");
const { ApiError } = require("../utils/ApiError");
const { customerQuerySchema, customerUpsertSchema } = require("../validators/customer.validator");
const { mapCustomerToModelFeatures } = require("../services/customerFeatures.service");
const { ensureTenantCustomer } = require("../services/customer.service");

const toPlainObject = (value) => {
  if (!value) return {};
  if (typeof value.toObject === "function") return value.toObject();
  return value;
}

const buildCustomerWritePayload = ({ payload, existingCustomer = null }) => {
  const industryType = payload.industryType || existingCustomer?.industryType || "telecom"
  const mergedCustomer = {
    customerId: payload.customerId || existingCustomer?.customerId,
    profile: { ...toPlainObject(existingCustomer?.profile), ...(payload.profile || {}) },
    subscription: { ...toPlainObject(existingCustomer?.subscription), ...(payload.subscription || {}) },
    billing: { ...toPlainObject(existingCustomer?.billing), ...(payload.billing || {}) },
    churnMeta: { ...toPlainObject(existingCustomer?.churnMeta), ...(payload.churnMeta || {}) }
  }

  const normalizedFeatures =
    industryType === "custom"
      ? {
          ...toPlainObject(existingCustomer?.normalizedFeatures),
          ...(payload.normalizedFeatures || {})
        }
      : mapCustomerToModelFeatures(mergedCustomer)

  return {
    ...payload,
    industryType,
    schemaVersion: payload.schemaVersion || existingCustomer?.schemaVersion || (industryType === "custom" ? "custom-v1" : "telco-v1"),
    normalizedFeatures
  }
}

const createCustomer = asyncHandler(async (req, res) => {
  const payload = customerUpsertSchema.parse(req.body);

  const existing = await Customer.findOne({ tenantId: req.tenantId, customerId: payload.customerId });
  if (existing) {
    throw new ApiError(409, `Customer already exists: ${payload.customerId}`);
  }

  const created = await Customer.create({
    tenantId: req.tenantId,
    ...buildCustomerWritePayload({ payload })
  });

  return apiResponse(req, res, 201, "Customer created", created);
});

const listCustomers = asyncHandler(async (req, res) => {
  const query = customerQuerySchema.parse(req.query);
  const filter = { tenantId: req.tenantId };

  if (query.source) {
    filter.source = query.source;
  }

  if (query.search) {
    filter.$or = [
      { customerId: { $regex: query.search, $options: "i" } },
      { "profile.city": { $regex: query.search, $options: "i" } },
      { "profile.state": { $regex: query.search, $options: "i" } }
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Customer.countDocuments(filter)
  ]);

  if (!items.length && query.search?.trim()) {
    await ensureTenantCustomer({
      tenantId: req.tenantId,
      customerId: query.search.trim()
    });

    const [refreshedItems, refreshedTotal] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      Customer.countDocuments(filter)
    ]);

    return apiResponse(req, res, 200, "Customers fetched", {
      items: refreshedItems,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: refreshedTotal,
        totalPages: Math.ceil(refreshedTotal / query.limit)
      }
    });
  }

  return apiResponse(req, res, 200, "Customers fetched", {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  });
});

const getCustomerById = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const customer = await ensureTenantCustomer({ tenantId: req.tenantId, customerId });
  if (!customer) {
    throw new ApiError(404, `Customer not found: ${customerId}`);
  }

  return apiResponse(req, res, 200, "Customer fetched", customer);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const payload = customerUpsertSchema.partial().parse(req.body);
  const existing = await ensureTenantCustomer({ tenantId: req.tenantId, customerId });

  if (!existing) {
    throw new ApiError(404, `Customer not found: ${customerId}`);
  }

  const updatePayload = buildCustomerWritePayload({
    payload: { ...payload, customerId },
    existingCustomer: existing
  })

  const updated = await Customer.findOneAndUpdate(
    { tenantId: req.tenantId, customerId },
    { $set: updatePayload },
    { new: true }
  );

  return apiResponse(req, res, 200, "Customer updated", updated);
});

module.exports = { createCustomer, listCustomers, getCustomerById, updateCustomer };
