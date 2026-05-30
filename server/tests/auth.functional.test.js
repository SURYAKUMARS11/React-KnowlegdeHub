const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const User = require("../src/models/User");

describe("Auth API", () => {
  it("registers a new user", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Secret123!",
    });

    expect(response.status).toBe(201);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("kms_token=")])
    );
    expect(response.body.user.email).toBe("ada@example.com");
  });

  it("logs in and returns the current user", async () => {
    const password = "Passw0rd!";
    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      name: "Grace Hopper",
      email: "grace@example.com",
      passwordHash,
    });

    const agent = request.agent(app);
    const loginResponse = await agent.post("/api/auth/login").send({
      email: "grace@example.com",
      password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("kms_token=")])
    );

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe("grace@example.com");
  });

  it("rejects invalid login attempts", async () => {
    const passwordHash = await bcrypt.hash("CorrectHorse", 10);

    await User.create({
      name: "Alan Turing",
      email: "alan@example.com",
      passwordHash,
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "alan@example.com",
      password: "wrong",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });
});
