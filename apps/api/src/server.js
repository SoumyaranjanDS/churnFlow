const { app } = require("./app");
const { env } = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/db");

let server;

const startServer = async () => {
  try {
    await connectDatabase(env.mongoUri);
    console.log("Connected to database");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }

  server = app.listen(env.port, () => {
    console.log(`API listening on :${env.port}`);
  });
}

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
