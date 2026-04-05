const mongoose = require("mongoose");
const { Customer } = require("../models/customer.model");
const { Prediction } = require("../models/prediction.model");
const { RetentionAction } = require("../models/retentionAction.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");
const { ApiError } = require("../utils/ApiError");
const { actionListQuerySchema, createActionSchema, updateActionSchema } = require("../validators/action.validator");
const { ensureTenantCustomer } = require("../services/customer.service");

const createAction = asyncHandler(async (req, res) => {
  const payload = createActionSchema.parse(req.body);

  const customer = await ensureTenantCustomer({ tenantId: req.tenantId, customerId: payload.customerId });
  if (!customer) {
    throw new ApiError(404, `Customer not found: ${payload.customerId}`);
  }

  let predictionObjectId = null;
  if (payload.predictionId) {
    if (!mongoose.Types.ObjectId.isValid(payload.predictionId)) {
      throw new ApiError(400, "Invalid predictionId");
    }

    const prediction = await Prediction.findOne({ _id: payload.predictionId, tenantId: req.tenantId });
    if (!prediction) {
      throw new ApiError(404, `Prediction not found: ${payload.predictionId}`);
    }
    predictionObjectId = prediction._id;
  } else {
    const latestPrediction = await Prediction.findOne({
      tenantId: req.tenantId,
      customerId: customer.customerId
    })
      .sort({ createdAt: -1 })
      .select("_id");

    predictionObjectId = latestPrediction?._id || null;
  }

  const created = await RetentionAction.create({
    tenantId: req.tenantId,
    customer: customer._id,
    customerId: customer.customerId,
    prediction: predictionObjectId,
    actionType: payload.actionType,
    status: payload.status,
    owner: payload.owner,
    notes: payload.notes,
    outcome: payload.outcome,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined
  });

  return apiResponse(req, res, 201, "Retention action created", created);
});

const listActions = asyncHandler(async (req, res) => {
  const query = actionListQuerySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;
  const filter = { tenantId: req.tenantId };

  if (query.customerId) filter.customerId = query.customerId;
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    RetentionAction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    RetentionAction.countDocuments(filter)
  ]);

  return apiResponse(req, res, 200, "Retention actions fetched", {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  });
});

const updateAction = asyncHandler(async (req, res) => {
  const { actionId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(actionId)) {
    throw new ApiError(400, "Invalid actionId");
  }

  const payload = updateActionSchema.parse(req.body);

  const update = {
    ...payload,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    completedAt: payload.completedAt ? new Date(payload.completedAt) : undefined
  };

  const updated = await RetentionAction.findOneAndUpdate(
    { _id: actionId, tenantId: req.tenantId },
    { $set: update },
    { new: true }
  );
  if (!updated) {
    throw new ApiError(404, `Retention action not found: ${actionId}`);
  }

  return apiResponse(req, res, 200, "Retention action updated", updated);
});

module.exports = { createAction, listActions, updateAction };
