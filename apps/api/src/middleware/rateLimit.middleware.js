const buckets = new Map();

const createRateLimiter = (options = {}) => {
  const windowMs = Number(options.windowMs || 15 * 60 * 1000);
  const max = Number(options.max || 60);
  const message = options.message || "Too many requests. Please try again later.";
  const keyGenerator =
    options.keyGenerator ||
    ((req) => {
      return `${req.ip}:${req.originalUrl}`;
    });

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator(req);

    const current = buckets.get(key);

    if (!current || now - current.windowStart >= windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return next();
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfterSeconds = Math.ceil((windowMs - (now - current.windowStart)) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);

      return res.status(429).json({
        success: false,
        message,
        meta: {
          requestId: req?.requestId || null,
          timestamp: new Date().toISOString(),
          retryAfterSeconds
        }
      });
    }

    return next();
  };
}

module.exports = { createRateLimiter };
