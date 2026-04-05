const mongoose = require("mongoose");
const { Customer } = require("../models/customer.model");
const { Prediction } = require("../models/prediction.model");
const { RetentionAction } = require("../models/retentionAction.model");
const { Outcome } = require("../models/outcome.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");
const { ApiError } = require("../utils/ApiError");
const { createOutcomeSchema, outcomeListQuerySchema } = require("../validators/outcome.validator");
const { ensureTenantCustomer } = require("../services/customer.service");

const createOutcome = asyncHandler(async (req, res) => {
  const payload = createOutcomeSchema.parse(req.body);

  const customer = await ensureTenantCustomer({ tenantId: req.tenantId, customerId: payload.customerId });
  if (!customer) {
    throw new ApiError(404, `Customer not found: ${payload.customerId}`);
  }

  let predictionObjectId;
  if (payload.predictionId) {
    if (!mongoose.Types.ObjectId.isValid(payload.predictionId)) {
      throw new ApiError(400, "Invalid predictionId");
    }

    const prediction = await Prediction.findOne({ _id: payload.predictionId, tenantId: req.tenantId });
    if (!prediction) {
      throw new ApiError(404, `Prediction not found: ${payload.predictionId}`);
    }

    if (prediction.customerId !== payload.customerId) {
      throw new ApiError(400, "Prediction does not belong to customer");
    }

    predictionObjectId = prediction._id;
  } else {
    const latestPrediction = await Prediction.findOne({
      tenantId: req.tenantId,
      customerId: payload.customerId
    })
      .sort({ createdAt: -1 })
      .select("_id");

    predictionObjectId = latestPrediction?._id;
  }

  let actionObjectId;
  if (payload.actionId) {
    if (!mongoose.Types.ObjectId.isValid(payload.actionId)) {
      throw new ApiError(400, "Invalid actionId");
    }

    const action = await RetentionAction.findOne({ _id: payload.actionId, tenantId: req.tenantId });
    if (!action) {
      throw new ApiError(404, `Action not found: ${payload.actionId}`);
    }

    if (action.customerId !== payload.customerId) {
      throw new ApiError(400, "Action does not belong to customer");
    }

    actionObjectId = action._id;
  } else {
    const latestAction = await RetentionAction.findOne({
      tenantId: req.tenantId,
      customerId: payload.customerId
    })
      .sort({ createdAt: -1 })
      .select("_id");

    actionObjectId = latestAction?._id;
  }

  const created = await Outcome.create({
    tenantId: req.tenantId,
    customer: customer._id,
    customerId: payload.customerId,
    prediction: predictionObjectId,
    action: actionObjectId,
    actualChurned: payload.actualChurned,
    retentionSuccessful: payload.retentionSuccessful,
    observedAt: payload.observedAt ? new Date(payload.observedAt) : new Date(),
    revenueImpact: payload.revenueImpact,
    currency: payload.currency,
    notes: payload.notes,
    source: payload.source,
    createdBy: {
      userId: req.user?.id,
      name: req.user?.name,
      email: req.user?.email
    }
  });

  return apiResponse(req, res, 201, "Outcome recorded", created);
});

const listOutcomes = asyncHandler(async (req, res) => {
  const query = outcomeListQuerySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;
  const filter = { tenantId: req.tenantId };

  if (query.customerId) filter.customerId = query.customerId;
  if (typeof query.actualChurned === "boolean") filter.actualChurned = query.actualChurned;

  const [items, total] = await Promise.all([
    Outcome.find(filter).sort({ observedAt: -1, createdAt: -1 }).skip(skip).limit(query.limit),
    Outcome.countDocuments(filter)
  ]);

  return apiResponse(req, res, 200, "Outcomes fetched", {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  });
});

const getCustomerOutcomes = asyncHandler(async (req, res) => {
  const { customerId } = req.params;

  const items = await Outcome.find({ tenantId: req.tenantId, customerId }).sort({ observedAt: -1, createdAt: -1 }).limit(100);
  return apiResponse(req, res, 200, "Customer outcomes fetched", items);
});

module.exports = { createOutcome, listOutcomes, getCustomerOutcomes };
