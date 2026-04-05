const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    meta: {
      requestId: req?.requestId || null,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = { notFoundHandler };
