const express = require("express");
const articleController = require("../controllers/articleController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Public read routes
router.get("/search", articleController.search);
router.get("/meta", articleController.meta);

// Bookmarks
router.get("/bookmarked", articleController.getBookmarked);
router.post("/:id/bookmark", articleController.toggleBookmark);

// Views
router.post("/:id/view", articleController.incrementView);

// Related articles
router.get("/:id/related", articleController.getRelated);

// Drafts
router.get("/drafts", articleController.getDrafts);
router.post("/drafts", articleController.saveDraft);
router.put("/:id/publish", articleController.publishDraft);

// CRUD
router.post("/", articleController.create);
router.get("/", articleController.list);
router.get("/:id", articleController.getById);
router.put("/:id", articleController.update);
router.delete("/:id", articleController.remove);

module.exports = router;
