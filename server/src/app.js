const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { getEnv } = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const articleRoutes = require("./routes/articleRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const commentRoutes = require("./routes/commentRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();
app.set("trust proxy", 1);

const clientOrigin = getEnv("CLIENT_ORIGIN", "http://localhost:5173");

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/comments", commentRoutes);

app.use(errorMiddleware);

module.exports = app;
