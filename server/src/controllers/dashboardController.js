const Article = require("../models/Article");
const SearchHistory = require("../models/SearchHistory");

async function stats(req, res, next) {
  try {
    const [totalArticles, authorIds, tagValues] = await Promise.all([
      Article.countDocuments(),
      Article.distinct("author"),
      Article.distinct("tags"),
    ]);

    return res.json({
      articles: totalArticles,
      authors: authorIds.length,
      tags: tagValues.filter(Boolean).length,
    });
  } catch (error) {
    return next(error);
  }
}

async function activity(req, res, next) {
  try {
    const articles = await Article.find()
      .sort({ updatedAt: -1 })
      .limit(6)
      .select("title category updatedAt");

    const items = articles.map((article) => ({
      id: article._id,
      title: article.title,
      detail: article.category
        ? `Updated in ${article.category}`
        : "Updated article",
      updatedAt: article.updatedAt,
    }));

    return res.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function categories(req, res, next) {
  try {
    const rows = await Article.aggregate([
      { $match: { category: { $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const items = rows
      .map((row) => ({ name: row._id, count: row.count }))
      .filter((row) => row.name);

    return res.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function tags(req, res, next) {
  try {
    const rows = await Article.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const items = rows
      .map((row) => ({ name: row._id, count: row.count }))
      .filter((row) => row.name);

    return res.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function contributors(req, res, next) {
  try {
    const rows = await Article.aggregate([
      {
        $group: {
          _id: "$author",
          articleCount: { $sum: 1 },
          lastUpdated: { $max: "$updatedAt" },
        },
      },
      { $sort: { articleCount: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          id: "$user._id",
          name: "$user.name",
          email: "$user.email",
          role: "$user.role",
          articleCount: 1,
          lastUpdated: 1,
        },
      },
    ]);

    return res.json({ items: rows });
  } catch (error) {
    return next(error);
  }
}

async function searchHistory(req, res, next) {
  try {
    const history = await SearchHistory.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({ items: history });
  } catch (error) {
    return next(error);
  }
}

async function trendingSearches(req, res, next) {
  try {
    const trending = await SearchHistory.aggregate([
      { $group: { _id: "$query", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const items = trending.map((item) => ({
      query: item._id,
      count: item.count,
    }));

    return res.json({ items });
  } catch (error) {
    return next(error);
  }
}

async function mostViewedArticles(req, res, next) {
  try {
    const articles = await Article.find()
      .populate("author", "name email")
      .sort({ viewCount: -1 })
      .limit(5);

    return res.json({ items: articles });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  stats,
  activity,
  categories,
  tags,
  contributors,
  searchHistory,
  trendingSearches,
  mostViewedArticles,
};
