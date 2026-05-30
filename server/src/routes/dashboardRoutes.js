const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/stats", dashboardController.stats);
router.get("/activity", dashboardController.activity);
router.get("/categories", dashboardController.categories);
router.get("/tags", dashboardController.tags);
router.get("/contributors", dashboardController.contributors);
router.get("/search-history", dashboardController.searchHistory);
router.get("/trending-searches", dashboardController.trendingSearches);
router.get("/most-viewed", dashboardController.mostViewedArticles);

module.exports = router;
