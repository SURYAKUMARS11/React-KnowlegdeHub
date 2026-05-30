require("dotenv").config();
const app = require("./app");
const { connectDatabase } = require("./config/db");
const { getEnv } = require("./config/env");

async function startServer() {
  await connectDatabase();
  const PORT = getEnv("PORT", 5000);

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
