const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/token");
const { requireFields } = require("../utils/validators");

const TOKEN_COOKIE = "kms_token";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: COOKIE_MAX_AGE_MS,
  };
}

async function register(req, res, next) {
  try {
    const missing = requireFields(req.body, ["name", "email", "password"]);
    if (missing.length) {
      return res.status(400).json({ message: "Missing fields", missing });
    }

    const email = String(req.body.email).toLowerCase();
    const allowedRoles = ["admin", "user"];
    const role = allowedRoles.includes(req.body.role) ? req.body.role : undefined;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      name: req.body.name,
      email,
      passwordHash,
      role,
    });

    const token = signToken(user);
    res.cookie(TOKEN_COOKIE, token, getCookieOptions());
    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const missing = requireFields(req.body, ["email", "password"]);
    if (missing.length) {
      return res.status(400).json({ message: "Missing fields", missing });
    }

    const email = String(req.body.email).toLowerCase();
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const matches = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    res.cookie(TOKEN_COOKIE, token, getCookieOptions());
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res) {
  return res.json({ user: req.user });
}

function logout(req, res) {
  res.clearCookie(TOKEN_COOKIE, getCookieOptions());
  return res.status(204).send();
}

module.exports = {
  register,
  login,
  me,
  logout,
};
