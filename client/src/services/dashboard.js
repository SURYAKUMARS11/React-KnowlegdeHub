import { apiRequest } from "./api";

export function fetchStats() {
  return apiRequest("/dashboard/stats");
}

export function fetchActivity() {
  return apiRequest("/dashboard/activity");
}

export function fetchCategories() {
  return apiRequest("/dashboard/categories");
}

export function fetchTags() {
  return apiRequest("/dashboard/tags");
}

export function fetchContributors() {
  return apiRequest("/dashboard/contributors");
}

export function fetchSearchHistory() {
  return apiRequest("/dashboard/search-history");
}

export function fetchTrendingSearches() {
  return apiRequest("/dashboard/trending-searches");
}

export function fetchMostViewedArticles() {
  return apiRequest("/dashboard/most-viewed");
}
