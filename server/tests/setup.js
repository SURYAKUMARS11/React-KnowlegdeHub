const path = require("path");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
  mongoServer = await MongoMemoryServer.create({
    binary: {
      downloadDir: path.join(__dirname, ".mongodb-binaries"),
    },
    instance: {
      launchTimeout: 30000,
    },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: "kms-test" });
});

afterEach(async () => {
  if (!mongoose.connection.db) {
    return;
  }
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
