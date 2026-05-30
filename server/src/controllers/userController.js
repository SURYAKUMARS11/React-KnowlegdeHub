const User = require("../models/User");
const { requireFields } = require("../utils/validators");

const ALLOWED_ROLES = ["admin", "user"];

async function list(req, res, next) {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    return res.json({ items: users });
  } catch (error) {
    return next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const missing = requireFields(req.body, ["role"]);
    if (missing.length) {
      return res.status(400).json({ message: "Missing fields", missing });
    }

    if (!ALLOWED_ROLES.includes(req.body.role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ item: user });
  } catch (error) {
    return next(error);
  }
}

async function deactivate(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ item: user });
  } catch (error) {
    return next(error);
  }
}

async function activate(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ item: user });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  updateRole,
  deactivate,
  activate,
};
