// src/api.ts
// ─── Central API service for AgriChain ───
// Replace BASE_URL with your actual Render backend URL

const BASE_URL = import.meta.env.VITE_API_URL || "https://agrichain-api-tnhz.onrender.com"; // ← CHANGE THIS

// ─── Helper ───────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("agrichain_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ──────────────────────────────────
export const auth = {
  farmerLogin: (phone: string, name: string) =>
    request("/api/auth/farmer/login", {
      method: "POST",
      body: JSON.stringify({ phone, name }),
    }),

  merchantLogin: (email: string, password: string, name: string) =>
    request("/api/auth/merchant/login", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  monitorLogin: (username: string, password: string) =>
    request("/api/auth/monitor/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  me: () => request("/api/auth/me"),
};

// ─── Advisory ─────────────────────────────
export const advisory = {
  recommend: (data: {
    nitrogen: number; phosphorous: number; potassium: number;
    temperature: number; humidity: number; ph: number; rainfall: number;
    soil_type: string; crop_type: string; gps_lat: number; gps_lon: number;
  }) =>
    request("/api/advisory/recommend", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCrops: () => request("/api/advisory/crops"),
  getSoilTypes: () => request("/api/advisory/soil-types"),
  getCropTypesForFertilizer: () => request("/api/advisory/crop-types-for-fertilizer"),
};

// ─── Marketplace ──────────────────────────
export const marketplace = {
  getListings: (filters?: { crop_type?: string; district?: string; state?: string }) => {
    const params = new URLSearchParams(filters as Record<string, string> || {}).toString();
    return request(`/api/marketplace/listings${params ? "?" + params : ""}`);
  },

  getListing: (id: string) => request(`/api/marketplace/listings/${id}`),

  createListing: (data: {
    crop_type: string; quantity_kg: number; asking_price: number;
    quality_grade: string; description?: string; district: string;
    state: string; location_lat?: number; location_lon?: number;
  }) =>
    request("/api/marketplace/listings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  placeOrder: (listingId: string, quantity_kg: number, offered_price: number) =>
    request(`/api/marketplace/listings/${listingId}/order`, {
      method: "POST",
      body: JSON.stringify({ quantity_kg, offered_price }),
    }),

  confirmTransaction: (transactionId: string) =>
    request(`/api/marketplace/transactions/${transactionId}/confirm`, {
      method: "POST",
    }),

  myListings: () => request("/api/marketplace/my-listings"),
  myOrders: () => request("/api/marketplace/my-orders"),
};

// ─── Prices ───────────────────────────────
export const prices = {
  getCommodities: () => request("/api/prices/commodities"),

  predictPrice: (commodity: string, days = 7) =>
    request(`/api/prices/predict/${commodity}?days=${days}`),

  getCurrentPrice: (commodity: string) =>
    request(`/api/prices/current/${commodity}`),
};

// ─── Finance ──────────────────────────────
export const finance = {
  calculate: (data: {
    crop_type: string; land_acres: number; state: string; category: string;
  }) =>
    request("/api/finance/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSchemes: (filters?: { state?: string; crop_type?: string; category?: string }) => {
    const params = new URLSearchParams(filters as Record<string, string> || {}).toString();
    return request(`/api/finance/schemes${params ? "?" + params : ""}`);
  },

  calculateEmi: (principal: number, annual_rate_percent: number, months: number) =>
    request(`/api/finance/emi?principal=${principal}&annual_rate_percent=${annual_rate_percent}&months=${months}`),
};

// ─── Monitor ──────────────────────────────
export const monitor = {
  getOverview: () => request("/api/monitor/overview"),
  getTransactions: (status?: string) =>
    request(`/api/monitor/transactions${status ? "?status_filter=" + status : ""}`),
  getListings: () => request("/api/monitor/listings"),
};