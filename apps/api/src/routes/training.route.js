const express = require("express")
const {
  createTrainingJob,
  deployModel,
  getCurrentModelSummary,
  getLatestTrainingJobSummary,
  getModelList,
  getTrainingJobDetails,
  getTrainingJobList
} = require("../controllers/training.controller")

const trainingRouter = express.Router()

trainingRouter.get("/jobs/latest", getLatestTrainingJobSummary)
trainingRouter.get("/jobs/:jobId", getTrainingJobDetails)
trainingRouter.get("/jobs", getTrainingJobList)
trainingRouter.post("/jobs", createTrainingJob)
trainingRouter.get("/models/current", getCurrentModelSummary)
trainingRouter.get("/models", getModelList)
trainingRouter.post("/models/:modelId/deploy", deployModel)

module.exports = { trainingRouter }
