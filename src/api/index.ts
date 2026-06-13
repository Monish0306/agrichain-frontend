// src/api/index.ts
const BASE_URL = import.meta.env.VITE_API_URL || "https://agrichain-api-tnhz.onrender.com";

const getToken = () => localStorage.getItem("agrichain_token") || "";

const apiFetch = async (path: string, opts: RequestInit = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ─── Advisory ────────────────────────────────────────────────────────────────
export const advisory = {
  recommend: (form: any) =>
    apiFetch("/api/advisory/recommend", {
      method: "POST",
      body: JSON.stringify(form),
    }),
};

// ─── Prices ──────────────────────────────────────────────────────────────────
export const prices = {
  getCommodities: () => apiFetch("/api/prices/commodities"),
  predictPrice: (commodity: string, days = 7) =>
    apiFetch(`/api/prices/predict?commodity=${commodity}&days=${days}`),
};

// ─── Marketplace ─────────────────────────────────────────────────────────────
export const marketplace = {
  listings: (params = "") => apiFetch(`/api/marketplace/listings?${params}`),
  myListings: () => apiFetch("/api/marketplace/my-listings"),
  createListing: (form: any) =>
    apiFetch("/api/marketplace/listings", {
      method: "POST",
      body: JSON.stringify(form),
    }),
  myOrders: () => apiFetch("/api/marketplace/my-orders"),
  placeOrder: (form: any) =>
    apiFetch("/api/marketplace/order", {
      method: "POST",
      body: JSON.stringify(form),
    }),
  confirmOrder: (orderId: number) =>
    apiFetch(`/api/marketplace/order/${orderId}/confirm`, { method: "POST" }),
  transactions: (limit = 30) =>
    apiFetch(`/api/marketplace/transactions?limit=${limit}`),
  route: (from: string, to: string) =>
    apiFetch(
      `/api/marketplace/route?from_place=${encodeURIComponent(from)}&to_place=${encodeURIComponent(to)}`
    ),
};

// ─── Finance ─────────────────────────────────────────────────────────────────
export const finance = {
  calculate: (form: any) =>
    apiFetch("/api/finance/calculate", {
      method: "POST",
      body: JSON.stringify(form),
    }),
  emi: (principal: number, annual_rate: number, months: number) =>
    apiFetch(
      `/api/finance/emi?principal=${principal}&annual_rate_percent=${annual_rate}&months=${months}`
    ),
  getSchemes: () => apiFetch("/api/finance/schemes"),
};

// ─── Monitor ─────────────────────────────────────────────────────────────────
export const monitor = {
  stats: () => apiFetch("/api/monitor/stats"),
  auditLog: (limit = 50) => apiFetch(`/api/monitor/audit-log?limit=${limit}`),
  fraudAlerts: () => apiFetch("/api/monitor/fraud-alerts"),
  fraudScan: () => apiFetch("/api/monitor/fraud-scan", { method: "POST" }),
  volumeChart: () => apiFetch("/api/monitor/volume-chart"),
  export: (type: "transactions" | "listings") =>
    fetch(`${BASE_URL}/api/monitor/export/${type}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }),
};

// ─── Weather ─────────────────────────────────────────────────────────────────
export const weather = {
  current: (lat: number, lon: number) =>
    apiFetch(`/api/weather/current?lat=${lat}&lon=${lon}`),
};

// ─── Merchant ────────────────────────────────────────────────────────────────
export const merchant = {
  dashboardStats: () => apiFetch("/api/merchant/dashboard-stats"),
  analytics: () => apiFetch("/api/merchant/analytics"),
};