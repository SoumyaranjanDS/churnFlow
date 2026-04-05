const { Customer } = require("../models/customer.model");
const { Prediction } = require("../models/prediction.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");
const { ApiError } = require("../utils/ApiError");
const { requestChurnPrediction, requestTenantPrediction } = require("../services/mlClient.service");
const {
  buildPredictionExplanation,
  buildCustomPredictionExplanation,
  buildCustomModelFeatures,
  deriveRiskBand,
  mapCustomerToModelFeatures
} = require("../services/customerFeatures.service");
const { ensureTenantCustomer } = require("../services/customer.service");
const { getActiveModelForTenant } = require("../services/training.service");
const {
  scoreRequestSchema,
  scoreBatchSchema,
  latestPredictionsQuerySchema
} = require("../validators/scoring.validator");

const resolveEffectiveThreshold = ({ threshold, thresholdVersion, activeModel }) => {
  if (!activeModel) {
    return threshold
  }

  if (thresholdVersion !== "default") {
    return threshold
  }

  if (Number(threshold) !== 0.5) {
    return threshold
  }

  const trainedThreshold = Number(activeModel?.metadata?.threshold)
  return Number.isFinite(trainedThreshold) ? trainedThreshold : threshold
}

const scoreSingleCustomer = async ({ tenantId, customer, threshold, thresholdVersion, requestId }) => {
  const activeModel = await getActiveModelForTenant(tenantId)
  const useCustomModel = Boolean(activeModel?.artifactDir && activeModel?.deployment?.isDeployed)
  const effectiveThreshold = resolveEffectiveThreshold({ threshold, thresholdVersion, activeModel: useCustomModel ? activeModel : null })

  let modelFeatures = {}
  let mlResponse = null
  let explanation = null
  let modelType = "global_telco"
  let modelVersion = "unknown"
  let modelRegistryId = null

  if (useCustomModel) {
    const customInput = buildCustomModelFeatures(customer, activeModel)

    if (!customInput.contract.length) {
      throw new ApiError(409, "The deployed custom model is missing its feature contract. Retrain and deploy the model again.")
    }

    if (customInput.missing.length) {
      throw new ApiError(422, "This customer is missing fields required by the deployed custom model.", {
        customerId: customer.customerId,
        missingFields: customInput.missing
      })
    }

    if (customInput.invalid.length) {
      throw new ApiError(422, "This customer has values that do not match the deployed custom model.", {
        customerId: customer.customerId,
        invalidFields: customInput.invalid
      })
    }

    modelFeatures = customInput.features
    mlResponse = await requestTenantPrediction({
      artifactDir: activeModel.artifactDir,
      features: modelFeatures
    })
    modelType = "tenant_custom"
    modelVersion = mlResponse.model_version ?? activeModel.version ?? "tenant-custom"
    modelRegistryId = activeModel._id
  } else {
    modelFeatures = mapCustomerToModelFeatures(customer)
    mlResponse = await requestChurnPrediction(modelFeatures)
    modelVersion = mlResponse.model_version ?? "unknown"
  }

  const churnProbability = Number(mlResponse.churn_probability ?? mlResponse.probability ?? 0)
  const riskBand = mlResponse.risk_band ?? deriveRiskBand(churnProbability)
  const predictedLabel = churnProbability >= effectiveThreshold ? "Yes" : "No"
  explanation =
    modelType === "tenant_custom"
      ? buildCustomPredictionExplanation({
          customer,
          churnProbability,
          model: activeModel,
          inputFeatures: modelFeatures
        })
      : buildPredictionExplanation(customer, churnProbability)

  const prediction = await Prediction.create({
    tenantId,
    customer: customer._id,
    customerId: customer.customerId,
    modelRegistryId,
    inputFeatures: modelFeatures,
    churnProbability,
    riskBand,
    decision: {
      predictedLabel,
      threshold: effectiveThreshold
    },
    modelVersion,
    modelType,
    explanation,
    thresholdVersion,
    requestId,
    mlRawResponse: mlResponse
  });

  return {
    predictionId: prediction._id,
    customerId: customer.customerId,
    churnProbability,
    riskBand,
    predictedLabel,
    modelVersion: prediction.modelVersion,
    threshold: effectiveThreshold,
    modelType,
    explanation
  };
}

const scoreCustomer = asyncHandler(async (req, res) => {
  const payload = scoreRequestSchema.parse(req.body);
  const customer = await ensureTenantCustomer({ tenantId: req.tenantId, customerId: payload.customerId });

  if (!customer) {
    throw new ApiError(404, `Customer not found: ${payload.customerId}`);
  }

  const result = await scoreSingleCustomer({
    tenantId: req.tenantId,
    customer,
    threshold: payload.threshold,
    thresholdVersion: payload.thresholdVersion,
    requestId: payload.requestId || req.requestId
  });

  return apiResponse(req, res, 201, "Customer scored", result);
});

const scoreBatchCustomers = asyncHandler(async (req, res) => {
  const payload = scoreBatchSchema.parse(req.body || {});

  let customers = [];

  if (payload.customerIds?.length) {
    customers = await Customer.find({ tenantId: req.tenantId, customerId: { $in: payload.customerIds } }).limit(500);
  } else {
    customers = await Customer.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).limit(payload.limit);
  }

  if (!customers.length) {
    throw new ApiError(404, "No customers found for batch scoring");
  }

  const results = [];

  for (const customer of customers) {
    const scored = await scoreSingleCustomer({
      tenantId: req.tenantId,
      customer,
      threshold: payload.threshold,
      thresholdVersion: payload.thresholdVersion,
      requestId: req.requestId
    });
    results.push(scored);
  }

  const highRiskCount = results.filter((item) => item.riskBand === "High").length;
  const mediumRiskCount = results.filter((item) => item.riskBand === "Medium").length;
  const lowRiskCount = results.filter((item) => item.riskBand === "Low").length;

  return apiResponse(req, res, 201, "Batch scoring completed", {
    totalProcessed: results.length,
    summary: {
      highRiskCount,
      mediumRiskCount,
      lowRiskCount
    },
    items: results
  });
});

const getCustomerPredictions = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const items = await Prediction.find({ tenantId: req.tenantId, customerId }).sort({ createdAt: -1 }).limit(100);
  return apiResponse(req, res, 200, "Predictions fetched", items);
});

const getLatestPredictions = asyncHandler(async (req, res) => {
  const query = latestPredictionsQuerySchema.parse(req.query);
  const skip = (query.page - 1) * query.limit;

  const matchAfterLatest = { tenantId: req.tenantId };
  if (query.riskBand) {
    matchAfterLatest.riskBand = query.riskBand;
  }
  if (typeof query.minProbability === "number") {
    matchAfterLatest.churnProbability = { $gte: query.minProbability };
  }
  if (query.search?.trim()) {
    matchAfterLatest.customerId = { $regex: query.search.trim(), $options: "i" };
  }

  const basePipeline = [
    { $match: { tenantId: req.tenantId } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$customerId", latest: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$latest" } },
    { $match: matchAfterLatest }
  ];

  const itemsPipeline = [
    ...basePipeline,
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: query.limit }
  ];

  const countPipeline = [...basePipeline, { $count: "total" }];

  const [items, countResult] = await Promise.all([
    Prediction.aggregate(itemsPipeline),
    Prediction.aggregate(countPipeline)
  ]);

  const total = countResult?.[0]?.total || 0;

  return apiResponse(req, res, 200, "Latest predictions fetched", {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  });
});

module.exports = {
  scoreCustomer,
  scoreBatchCustomers,
  getCustomerPredictions,
  getLatestPredictions
};
