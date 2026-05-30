const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const { headers: optionHeaders, ...rest } = options;
  const token = localStorage.getItem("kms_token");
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(optionHeaders || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}
