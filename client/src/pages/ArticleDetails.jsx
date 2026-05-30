import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { fetchArticle } from "../services/articles";
import { fetchComments, createComment, deleteComment } from "../services/comments";
import { AuthContext } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function ArticleDetails() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadArticle() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchArticle(id);
        if (isMounted) {
          setArticle(data.item || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load article");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadArticle();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    async function loadComments() {
      setCommentsLoading(true);
      setCommentsError("");
      try {
        const data = await fetchComments(id);
        if (mounted) setComments(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        if (mounted) setCommentsError(err.message || "Failed to load comments");
      } finally {
        if (mounted) setCommentsLoading(false);
      }
    }
    if (id) loadComments();
    return () => { mounted = false; };
  }, [id]);

  async function handleAddComment(parentId = null) {
    try {
      if (!user) {
        showToast({ message: "Please sign in to comment", tone: "error" });
        return;
      }
      const content = newComment.trim();
      if (!content) return;
      await createComment({ article: id, content, parent: parentId }, token);
      setNewComment("");
      const data = await fetchComments(id);
      setComments(Array.isArray(data.items) ? data.items : []);
      showToast({ message: "Comment added", tone: "success" });
    } catch (err) {
      showToast({ message: err.message || "Failed to add comment", tone: "error" });
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteComment(commentId, token);
      const data = await fetchComments(id);
      setComments(Array.isArray(data.items) ? data.items : []);
      showToast({ message: "Comment deleted", tone: "success" });
    } catch (err) {
      showToast({ message: err.message || "Failed to delete comment", tone: "error" });
    }
  }

  function CommentItem({ node, depth = 0 }) {
    const [replyText, setReplyText] = useState("");
    const [replyOpen, setReplyOpen] = useState(false);
    return (
      <div className="comment" style={{ marginLeft: depth * 16 }}>
        <div className="list__item" style={{ padding: "10px 12px" }}>
          <div>
            <p className="list__title" style={{ fontSize: "0.95rem" }}>{node.author?.name || "User"}</p>
            <p className="list__meta" style={{ fontSize: "0.85rem" }}>{new Date(node.createdAt).toLocaleString()}</p>
            <p style={{ marginTop: 6 }}>{node.content}</p>
          </div>
          <div className="list__aside" style={{ gap: 8 }}>
            {user ? (
              <>
                <button className="btn btn--ghost btn--small" type="button" onClick={() => setReplyOpen(!replyOpen)}>
                  Reply
                </button>
                {(user.role === "admin" || String(node.author?._id || node.author) === String(user.id)) && (
                  <button className="btn btn--ghost btn--small btn--danger-text" type="button" onClick={() => handleDeleteComment(node._id)}>
                    Delete
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
        {replyOpen ? (
          <div style={{ display: "flex", gap: 8, margin: "8px 0 12px" }}>
            <input
              type="text"
              placeholder="Write a reply"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn--primary btn--small" type="button" onClick={async () => {
              if (!replyText.trim()) return;
              const prev = newComment;
              setNewComment(replyText);
              await handleAddComment(node._id);
              setNewComment(prev);
              setReplyText("");
              setReplyOpen(false);
            }}>
              Send
            </button>
          </div>
        ) : null}
        {(node.replies || []).map((child) => (
          <CommentItem key={child._id} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  const markdownHtml = useMemo(() => {
    if (!article?.content) {
      return "";
    }

    const raw = marked.parse(article.content, { breaks: true });
    return DOMPurify.sanitize(raw);
  }, [article?.content]);

  if (loading) {
    return (
      <section className="card fade-up">
        <p className="muted">Loading article...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card fade-up">
        <p className="muted">{error}</p>
        <Link className="btn btn--ghost" to="/articles">
          Back to articles
        </Link>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="card fade-up">
        <p className="muted">Article not found.</p>
        <Link className="btn btn--ghost" to="/articles">
          Back to articles
        </Link>
      </section>
    );
  }

  return (
    <section className="card fade-up article-detail">
      <div className="article-detail__header">
        <div>
          <p className="eyebrow">{article.category || "Uncategorized"}</p>
          <h2>{article.title}</h2>
          <p className="muted">
            {article.author?.name ? `By ${article.author.name}` : ""}
            {article.updatedAt
              ? ` · Updated ${new Date(article.updatedAt).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        <Link className="btn btn--ghost" to="/articles">
          Back to articles
        </Link>
      </div>
      <div className="badges">
        {(article.tags || []).map((tag) => (
          <span className="badge badge--ghost" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <div
        className="markdown"
        dangerouslySetInnerHTML={{ __html: markdownHtml }}
      />

      <div style={{ marginTop: "2rem" }}>
        <div className="card__header">
          <h3>Comments</h3>
        </div>
        {commentsLoading ? (
          <p className="muted">Loading comments...</p>
        ) : commentsError ? (
          <p className="muted">{commentsError}</p>
        ) : (
          <div className="list">
            {comments.length === 0 ? <p className="muted">No comments yet.</p> : comments.map((node) => (
              <CommentItem key={node._id} node={node} />
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            type="text"
            placeholder={user ? "Write a comment" : "Sign in to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user}
            style={{ flex: 1 }}
          />
          <button className="btn btn--primary" type="button" disabled={!user || !newComment.trim()} onClick={() => handleAddComment(null)}>
            Comment
          </button>
        </div>
      </div>
    </section>
  );
}

export default ArticleDetails;
