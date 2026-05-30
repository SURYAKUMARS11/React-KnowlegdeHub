import { apiRequest } from "./api";

export function fetchArticles(page = 1, limit = 10) {
  const path = `/articles?page=${page}&limit=${limit}`;
  console.log("[Debug] fetchArticles path:", path);
  return apiRequest(path);
}

export function searchArticles(query, page = 1, limit = 10) {
  if (typeof query === "object" && query !== null) {
    const params = new URLSearchParams();
    if (query.query) {
      params.set("q", query.query);
    }
    if (query.category) {
      params.set("category", query.category);
    }
    if (query.tag) {
      params.set("tag", query.tag);
    }
    params.set("page", page);
    params.set("limit", limit);

    const path = `/articles/search?${params.toString()}`;
    console.log("[Debug] searchArticles path:", path);
    return apiRequest(path);
  }

  const params = new URLSearchParams({ q: query, page, limit });
  const path = `/articles/search?${params.toString()}`;
  console.log("[Debug] searchArticles path (string):", path);
  return apiRequest(path);
}

export function fetchArticleMeta() {
  return apiRequest("/articles/meta");
}

export function fetchArticle(id) {
  return apiRequest(`/articles/${id}`);
}

export function createArticle(payload, token) {
  return apiRequest("/articles", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(payload),
  });
}

export function updateArticle(id, payload, token) {
  return apiRequest(`/articles/${id}`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(payload),
  });
}

export function deleteArticle(id, token) {
  return apiRequest(`/articles/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export function toggleBookmark(id, token) {
  return apiRequest(`/articles/${id}/bookmark`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export function getBookmarkedArticles() {
  return apiRequest("/articles/bookmarked");
}

export function incrementViewCount(id) {
  return apiRequest(`/articles/${id}/view`, {
    method: "POST",
  });
}

export function getRelatedArticles(id) {
  return apiRequest(`/articles/${id}/related`);
}

export function saveDraft(payload, token) {
  return apiRequest("/articles/drafts", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify(payload),
  });
}

export function publishDraft(id, token) {
  return apiRequest(`/articles/${id}/publish`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export function getDrafts() {
  return apiRequest("/articles/drafts");
}
