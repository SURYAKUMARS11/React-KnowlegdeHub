const Comment = require("../models/Comment");

async function listByArticle(req, res, next) {
  try {
    const { articleId } = req.params;
    const comments = await Comment.find({ article: articleId })
      .populate("author", "name")
      .sort({ createdAt: 1 });
    return res.json({ items: comments });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const { content, articleId, parentComment } = req.body;
    const comment = await Comment.create({
      content,
      article: articleId,
      author: req.user.id,
      parentComment,
    });
    const populatedComment = await Comment.findById(comment._id).populate("author", "name");
    return res.status(201).json({ item: populatedComment });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check authorization: only author or admin can delete
    if (comment.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();
    return res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listByArticle,
  create,
  remove,
};
