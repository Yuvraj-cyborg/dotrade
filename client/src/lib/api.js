const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const TOKEN_KEY = "trade-engine-token";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const request = async (path, { method = "GET", body } = {}) => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

const api = {
  register: (body) => request("/api/auth/register", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  me: () => request("/api/auth/me"),
  buyOrder: (body) => request("/api/orders/buy", { method: "POST", body }),
  sellOrder: (body) => request("/api/orders/sell", { method: "POST", body }),
  listOrders: () => request("/api/orders"),
  orderBook: (symbol) => request(`/api/orders/book/${symbol}`),
  cancelOrder: (id) => request(`/api/orders/${id}/cancel`, { method: "PATCH" }),
  listTrades: (symbol) =>
    request(`/api/trades${symbol ? `?symbol=${encodeURIComponent(symbol)}` : ""}`),
};

export { api, getToken, setToken, clearToken };
