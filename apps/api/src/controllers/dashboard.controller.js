const { Customer } = require("../models/customer.model");
const { Prediction } = require("../models/prediction.model");
const { RetentionAction } = require("../models/retentionAction.model");
const { Outcome } = require("../models/outcome.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { apiResponse } = require("../utils/apiResponse");

const getDashboardSummary = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days || 30), 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const tenantFilter = { tenantId: req.tenantId };

  const [
    totalCustomers,
    totalPredictions,
    highRiskCustomers,
    recentPredictions,
    avgRecentRiskAgg,
    totalActions,
    pendingActions,
    inProgressActions,
    completedActions,
    totalOutcomes,
    churnedOutcomes,
    savedOutcomes
  ] = await Promise.all([
    Customer.countDocuments(tenantFilter),
    Prediction.countDocuments(tenantFilter),
    Prediction.countDocuments({ ...tenantFilter, churnProbability: { $gte: 0.75 } }),
    Prediction.countDocuments({ ...tenantFilter, createdAt: { $gte: since } }),
    Prediction.aggregate([
      { $match: { ...tenantFilter, createdAt: { $gte: since } } },
      { $group: { _id: null, avgRisk: { $avg: "$churnProbability" } } }
    ]),
    RetentionAction.countDocuments(tenantFilter),
    RetentionAction.countDocuments({ ...tenantFilter, status: "pending" }),
    RetentionAction.countDocuments({ ...tenantFilter, status: "in_progress" }),
    RetentionAction.countDocuments({ ...tenantFilter, status: "completed" }),
    Outcome.countDocuments(tenantFilter),
    Outcome.countDocuments({ ...tenantFilter, actualChurned: true }),
    Outcome.countDocuments({ ...tenantFilter, retentionSuccessful: true })
  ]);

  const avgRecentRisk = avgRecentRiskAgg?.[0]?.avgRisk || 0;
  const churnRate = totalOutcomes ? churnedOutcomes / totalOutcomes : 0;
  const retentionSuccessRate = totalOutcomes ? savedOutcomes / totalOutcomes : 0;

  return apiResponse(req, res, 200, "Dashboard summary fetched", {
    windowDays: days,
    customers: {
      total: totalCustomers,
      highRiskCount: highRiskCustomers
    },
    predictions: {
      total: totalPredictions,
      recentCount: recentPredictions,
      avgRecentRisk: Number(avgRecentRisk.toFixed(4))
    },
    actions: {
      total: totalActions,
      pending: pendingActions,
      inProgress: inProgressActions,
      completed: completedActions
    },
    outcomes: {
      total: totalOutcomes,
      churned: churnedOutcomes,
      retained: savedOutcomes,
      churnRate: Number(churnRate.toFixed(4)),
      retentionSuccessRate: Number(retentionSuccessRate.toFixed(4))
    }
  });
});

module.exports = { getDashboardSummary };
