const { ZodError } = require("zod");
const { ApiError } = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues,
      meta: {
        requestId: req?.requestId || null,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
      meta: {
        requestId: req?.requestId || null,
        timestamp: new Date().toISOString()
      }
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    meta: {
      requestId: req?.requestId || null,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = { errorHandler };
