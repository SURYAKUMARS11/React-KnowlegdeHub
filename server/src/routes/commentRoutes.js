const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const protect = require("../middleware/authMiddleware");

router.get("/article/:articleId", commentController.listByArticle);
router.post("/", protect, commentController.create);
router.delete("/:id", protect, commentController.remove);

module.exports = router;
