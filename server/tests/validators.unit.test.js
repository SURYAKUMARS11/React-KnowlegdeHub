const { normalizeTags, requireFields } = require("../src/utils/validators");

describe("validators", () => {
  it("returns missing fields", () => {
    const missing = requireFields({ email: "a@b.com" }, [
      "name",
      "email",
      "password",
    ]);
    expect(missing).toEqual(["name", "password"]);
  });

  it("normalizes tag strings", () => {
    const tags = normalizeTags("alpha, beta , gamma");
    expect(tags).toEqual(["alpha", "beta", "gamma"]);
  });

  it("normalizes tag arrays", () => {
    const tags = normalizeTags(["one ", "", "two"]);
    expect(tags).toEqual(["one", "two"]);
  });
});
