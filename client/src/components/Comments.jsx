import React, { useState, useEffect, useContext } from 'react';
import { fetchComments, createComment, deleteComment } from '../services/comments';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';

export const Comments = ({ articleId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  useEffect(() => {
    if (articleId) {
      loadComments();
    }
  }, [articleId]);

  const loadComments = async () => {
    setFetching(true);
    try {
      const data = await fetchComments(articleId);
      setComments(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setFetching(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      await createComment({ content: newComment, articleId }, user?.token);
      setNewComment('');
      await loadComments();
      showToast({ message: "Comment posted", tone: "success" });
    } catch (error) {
      showToast({ message: "Failed to post comment", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setCommentToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;
    setLoading(true);
    try {
      await deleteComment(commentToDelete, user?.token);
      setComments(prev => prev.filter(c => c._id !== commentToDelete));
      showToast({ message: "Comment deleted", tone: "success" });
    } catch (error) {
      showToast({ message: "Failed to delete comment", tone: "error" });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  };

  const formatRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="comments-modern">
      <div className="comments-modern__header">
        <h4>Discussion ({comments.length})</h4>
      </div>

      {user ? (
        <form onSubmit={handlePostComment} className="comment-form-modern">
          <div className="comment-form-modern__avatar">
            {user.name?.[0] || 'U'}
          </div>
          <div className="comment-form-modern__body">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What are your thoughts?"
              rows="1"
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <div className="comment-form-modern__actions">
              <button 
                className="btn btn--primary btn--small" 
                type="submit" 
                disabled={loading || !newComment.trim()}
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="comments-modern__login-prompt" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <p className="muted">Sign in to join the conversation.</p>
        </div>
      )}

      <div className="comments-modern__list">
        {fetching ? (
          <p className="muted">Loading comments...</p>
        ) : comments.length === 0 ? (
          <div className="comments-modern__empty">
            <Icon name="activity" size={32} className="muted" />
            <p className="muted">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="comment-modern">
              <div className="comment-modern__avatar">
                {comment.author?.name?.[0] || '?'}
              </div>
              <div className="comment-modern__content">
                <div className="comment-modern__meta">
                  <span className="comment-modern__author">{comment.author?.name || 'Unknown User'}</span>
                  <span className="comment-modern__dot">·</span>
                  <span className="comment-modern__time">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <div className="comment-modern__text-wrapper">
                   <div className="comment-modern__text">
                    {comment.content}
                   </div>
                   <div className="comment-modern__actions">
                     {(user?.id === comment.author?._id || user?.role === 'admin') && (
                       <button 
                         className="comment-modern__action-btn comment-modern__action-btn--danger"
                         onClick={() => handleDeleteClick(comment._id)}
                       >
                         Delete
                       </button>
                     )}
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="modal modal--confirm"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal__header">
              <div>
                <p className="eyebrow">Confirm Delete</p>
                <h3>Delete Comment?</h3>
              </div>
            </div>
            <p className="muted">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="modal__footer modal__footer--divider">
              <div className="modal__footer-actions">
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={confirmDelete}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
