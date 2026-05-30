const Article = require("../models/Article");
const SearchHistory = require("../models/SearchHistory");
const { normalizeTags, requireFields } = require("../utils/validators");

function canEditArticle(user, article) {
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  return article.author.toString() === user.id;
}

async function list(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isDraft: { $ne: true } };

    const articles = await Article.find(query)
      .populate("author", "name email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Article.countDocuments(query);
      
    return res.json({ items: articles, total, page, limit });
  } catch (error) {
    return next(error);
  }
}

async function search(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const tag = String(req.query.tag || "").trim();
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!q && !category && !tag) {
      return res.json({ items: [], total: 0 });
    }

    // Track search query in history
    if (q && req.user) {
      await SearchHistory.create({
        user: req.user.id,
        query: q,
      });
    }

    const query = { isDraft: { $ne: true } };
    
    // Build search query
    if (q) {
      // Use regex for flexible text search
      const regex = new RegExp(q, "i");
      query.$or = [
        { title: regex },
        { content: regex },
        { category: regex },
        { tags: regex }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (tag) {
      query.tags = tag;
    }

    const articles = await Article.find(query)
      .populate("author", "name email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Article.countDocuments(query);

    return res.json({ items: articles, total, page, limit });
  } catch (error) {
    return next(error);
  }
}

async function meta(req, res, next) {
  try {
    const [categoryRows, tagRows] = await Promise.all([
      Article.aggregate([
        { $match: { category: { $ne: null } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Article.aggregate([
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const categories = categoryRows
      .map((row) => ({ name: row._id, count: row.count }))
      .filter((row) => row.name);
    const tags = tagRows
      .map((row) => ({ name: row._id, count: row.count }))
      .filter((row) => row.name);

    return res.json({ categories, tags });
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const article = await Article.findById(req.params.id).populate(
      "author",
      "name email"
    );
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    return res.json({ item: article });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const missing = requireFields(req.body, ["title", "content", "category"]);
    if (missing.length) {
      return res.status(400).json({ message: "Missing fields", missing });
    }

    const tags = normalizeTags(req.body.tags);
    const article = await Article.create({
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      tags,
      author: req.user.id,
    });

    return res.status(201).json({ item: article });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (!canEditArticle(req.user, article)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const tags = normalizeTags(req.body.tags ?? article.tags);

    article.title = req.body.title ?? article.title;
    article.content = req.body.content ?? article.content;
    article.category = req.body.category ?? article.category;
    article.tags = tags;
    await article.save();

    return res.json({ item: article });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can delete articles" });
    }

    await article.deleteOne();
    return res.json({ message: "Article deleted" });
  } catch (error) {
    return next(error);
  }
}

async function toggleBookmark(req, res, next) {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const userId = req.user.id;
    const bookmarkIndex = article.bookmarkedBy.indexOf(userId);
    
    if (bookmarkIndex === -1) {
      article.bookmarkedBy.push(userId);
    } else {
      article.bookmarkedBy.splice(bookmarkIndex, 1);
    }
    
    await article.save();
    return res.json({ item: article });
  } catch (error) {
    return next(error);
  }
}

async function getBookmarked(req, res, next) {
  try {
    const articles = await Article.find({ bookmarkedBy: req.user.id })
      .populate("author", "name email")
      .sort({ updatedAt: -1 })
      .limit(50);
    return res.json({ items: articles });
  } catch (error) {
    return next(error);
  }
}

async function incrementView(req, res, next) {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate("author", "name email");
    
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    
    return res.json({ item: article });
  } catch (error) {
    return next(error);
  }
}

async function getRelated(req, res, next) {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const related = await Article.find({
      $or: [
        { category: article.category },
        { tags: { $in: article.tags } },
      ],
      _id: { $ne: article._id },
    })
      .populate("author", "name email")
      .limit(5);

    return res.json({ items: related });
  } catch (error) {
    return next(error);
  }
}

async function saveDraft(req, res, next) {
  try {
    const missing = requireFields(req.body, ["title", "content", "category"]);
    if (missing.length) {
      return res.status(400).json({ message: "Missing fields", missing });
    }

    const tags = normalizeTags(req.body.tags);
    const draft = await Article.create({
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      tags,
      author: req.user.id,
      isDraft: true,
    });

    return res.status(201).json({ item: draft });
  } catch (error) {
    return next(error);
  }
}

async function publishDraft(req, res, next) {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (!canEditArticle(req.user, article)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    article.isDraft = false;
    article.publishedAt = new Date();
    await article.save();

    return res.json({ item: article });
  } catch (error) {
    return next(error);
  }
}

async function getDrafts(req, res, next) {
  try {
    const drafts = await Article.find({ author: req.user.id, isDraft: true })
      .populate("author", "name email")
      .sort({ updatedAt: -1 })
      .limit(50);
    return res.json({ items: drafts });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  search,
  meta,
  getById,
  create,
  update,
  remove,
  toggleBookmark,
  getBookmarked,
  incrementView,
  getRelated,
  saveDraft,
  publishDraft,
  getDrafts,
};
