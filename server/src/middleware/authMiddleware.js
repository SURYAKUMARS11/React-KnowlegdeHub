const User = require("../models/User");
const { verifyToken } = require("../utils/token");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = req.cookies?.kms_token;
  const token = cookieToken || headerToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = authMiddleware;
