const API_BASE =
  window.location.port === "5500"
    ? `${window.location.protocol}//${window.location.hostname}:5050`
    : window.location.origin;

function getToken() {
  return localStorage.getItem("arpiares_token") || "";
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
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}
