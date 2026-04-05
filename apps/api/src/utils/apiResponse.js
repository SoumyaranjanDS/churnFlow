const apiResponse = (req, res, statusCode, message, data = null, meta = {}) => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
    meta: {
      requestId: req?.requestId || null,
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
}

module.exports = { apiResponse };
