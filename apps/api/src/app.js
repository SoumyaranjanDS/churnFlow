const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const { router } = require("./routes");
const { errorHandler } = require("./middleware/error.middleware");
const { notFoundHandler } = require("./middleware/notFound.middleware");
const { requestContext, requestLogger } = require("./middleware/requestContext.middleware");
const { buildOpenApiSpec } = require("./docs/openapi");
const { env } = require("./config/env");

const app = express();

const resolveCorsOptions = () => {
  const allowedOrigins = env.corsOrigins || []

  if (!allowedOrigins.length) {
    return {}
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error("CORS origin is not allowed"))
    },
    credentials: true
  }
}

app.use(helmet());
app.use(cors(resolveCorsOptions()));
app.use(express.json({ limit: "2mb" }));
app.use(requestContext);
app.use(requestLogger);
app.use(morgan("dev"));

app.get("/api/openapi.json", (req, res) => {
  const serverBaseUrl = `${req.protocol}://${req.get("host")}`;
  const spec = buildOpenApiSpec(serverBaseUrl);
  res.json(spec);
});

app.use("/api/docs", swaggerUi.serve, (req, res, next) => {
  const serverBaseUrl = `${req.protocol}://${req.get("host")}`;
  const spec = buildOpenApiSpec(serverBaseUrl);
  return swaggerUi.setup(spec, { explorer: true })(req, res, next);
});

app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
