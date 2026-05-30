import { apiRequest } from "./api";

export function fetchComments(articleId) {
  return apiRequest(`/comments/article/${articleId}`);
}

export function createComment(payload, token) {
  return apiRequest("/comments", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(payload),
  });
}

export function deleteComment(commentId, token) {
  return apiRequest(`/comments/${commentId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
