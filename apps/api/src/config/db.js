const mongoose = require("mongoose");

const connectDatabase = async (mongoUri) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    autoIndex: true
  });
}

const disconnectDatabase = async () => {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
