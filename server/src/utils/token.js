const jwt = require("jsonwebtoken");
const { getEnv } = require("../config/env");

function signToken(user) {
  const secret = getEnv("JWT_SECRET");
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    secret,
    { expiresIn: "7d" }
  );
}

function verifyToken(token) {
  const secret = getEnv("JWT_SECRET");
  return jwt.verify(token, secret);
}

module.exports = {
  signToken,
  verifyToken,
};
