// Automatically adapts to localhost, local Wi-Fi IPs (Mac/Android), or production domains
const API_BASE =
  window.location.port === "5500"
    ? `${window.location.protocol}//${window.location.hostname}:5050`
    : window.location.origin;

function getToken() {
  return localStorage.getItem("arpiares_token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("arpiares_user") || "null");
  } catch {
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const raw = await response.text();
  let data = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw || "Unexpected server response" };
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("arpiares_token");
      localStorage.removeItem("arpiares_user");
      globalThis.updateAccountUI?.();
    }
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}
