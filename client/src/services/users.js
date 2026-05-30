import { apiRequest } from "./api";

export function fetchUsers(token) {
  return apiRequest("/users", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export function updateUserRole(id, role, token) {
  return apiRequest(`/users/${id}/role`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ role }),
  });
}

export function deactivateUser(id, token) {
  return apiRequest(`/users/${id}/deactivate`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export function activateUser(id, token) {
  return apiRequest(`/users/${id}/activate`, {
    method: "PUT",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
