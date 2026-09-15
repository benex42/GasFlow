const API_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "gasflow.auth.token";
const USER_KEY = "gasflow.auth.user";

export const authStorage = {
  getToken: () => window.localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try {
      const value = window.localStorage.getItem(USER_KEY);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },
  save: ({ token, user }) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authStorage.getToken() ? { Authorization: `Bearer ${authStorage.getToken()}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot reach the GasFlow API. Restart the app with npm run dev and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

export const authApi = {
  register: (credentials) => api("/auth/register", { method: "POST", body: JSON.stringify(credentials) }),
  login: (credentials) => api("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  requestPasswordReset: (email) => api("/auth/request-password-reset", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: ({ token, password }) => api("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  me: () => api("/auth/me"),
  updateProfile: (updates) => api("/auth/me", { method: "PATCH", body: JSON.stringify(updates) }),
};
