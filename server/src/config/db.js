const mongoose = require("mongoose");
const { getEnv } = require("./env");

async function connectDatabase() {
  const uri = getEnv("MONGODB_URI");
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log('DB Connected Successfully');
  return mongoose.connection;
}

module.exports = {
  connectDatabase,
};
