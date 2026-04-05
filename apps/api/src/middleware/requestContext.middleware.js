const { randomUUID } = require("crypto");

const requestContext = (req, res, next) => {
  const inbound = req.headers["x-request-id"];
  const requestId = typeof inbound === "string" && inbound.trim() ? inbound.trim() : randomUUID();

  req.requestId = requestId;
  req.startedAt = Date.now();

  res.setHeader("x-request-id", requestId);
  next();
}

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      `[${req.requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`
    );
  });

  next();
}

module.exports = { requestContext, requestLogger };
