import { apiRequest } from "./api";

export function login(payload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMe() {
  return apiRequest("/auth/me");
}

export function logout() {
  return apiRequest("/auth/logout", {
    method: "POST",
  });
}
