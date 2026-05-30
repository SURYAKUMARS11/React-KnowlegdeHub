const { signToken, verifyToken } = require("../src/utils/token");

describe("token", () => {
  it("signs and verifies tokens", () => {
    process.env.JWT_SECRET = "test-secret";
    const token = signToken({ _id: "507f191e810c19729de860ea", role: "user" });
    const payload = verifyToken(token);

    expect(payload.sub).toBe("507f191e810c19729de860ea");
    expect(payload.role).toBe("user");
  });
});
