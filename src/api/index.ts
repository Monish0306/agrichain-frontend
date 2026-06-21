// src/api/index.ts

export const BASE_URL =
  import.meta.env.VITE_API_URL || "https://agrichain-api-tnhz.onrender.com";

const getToken = () => localStorage.getItem("agrichain_token") || "";

// ── Core fetch wrapper ────────────────────────────────────────────────────────
const apiFetch = async (path: string, opts: RequestInit = {}) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.detail || errData.message || errMsg;
    } catch {
      try { errMsg = await res.text() || errMsg; } catch { /* ignore */ }
    }
    throw new Error(errMsg);
  }
  return res.json();
};

// ── auth ──────────────────────────────────────────────────────────────────────
// FIX: old auth endpoints were wrong (/api/auth/farmer-login instead of /api/auth/farmer/login)
export const auth = {
  farmerLogin: async (phone: string, name: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/farmer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
    return {
      access_token: data.access_token,
      user_id:      String(data.user_id || ""),
      name:         data.name || name,
      role:         "farmer" as const,
    };
  },

  merchantLogin: async (email: string, password: string, businessName: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/merchant/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:         email.trim().toLowerCase(),
        password:      password,
        name:          businessName.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
    return {
      access_token: data.access_token,
      user_id:      String(data.user_id || ""),
      name:         data.name || businessName,
      role:         "merchant" as const,
    };
  },

  monitorLogin: async (username: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/monitor/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password: password.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
    return {
      access_token: data.access_token,
      user_id:      String(data.user_id || username),
      name:         data.name || "Monitor Admin",
      role:         "monitor" as const,
    };
  },
};

// ── advisory ──────────────────────────────────────────────────────────────────
export const advisory = {
  recommend: (form: {
    nitrogen:    number;
    phosphorous: number;
    potassium:   number;
    temperature: number;
    humidity:    number;
    ph:          number;
    rainfall:    number;
    soil_type:   string;
    crop_type:   string;
    gps_lat:     number;
    gps_lon:     number;
  }) =>
    apiFetch("/api/advisory/recommend", {
      method: "POST",
      body:   JSON.stringify(form),
    }),

  detectDisease: async (file: File) => {
    const token    = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/api/advisory/disease-detect`, {
      method:  "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body:    formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Disease detection failed" }));
      throw new Error(err.detail || "Disease detection failed");
    }
    return res.json();
  },
};

// ── prices ────────────────────────────────────────────────────────────────────
// FIX: backend uses path param /api/prices/predict/{commodity} NOT query param
export const prices = {
  getCommodities: (): Promise<{ commodities: string[] }> =>
    apiFetch("/api/prices/commodities"),

  predictPrice: (
    commodity: string,
    days = 7
  ): Promise<{
    commodity:           string;
    current_price:       number;
    predictions:         Array<{
      date:            string;
      predicted_price: number;
      lower_bound?:    number;
      upper_bound?:    number;
    }>;
    sell_recommendation: {
      action:                     string;
      reason:                     string;
      best_day_to_sell:           string;
      expected_price_on_best_day: number;
    };
  }> =>
    // FIX: use PATH parameter, not query string
    apiFetch(`/api/prices/predict/${encodeURIComponent(commodity)}?days=${days}`),

  historicalPrices: (commodity: string, days = 30) =>
    apiFetch(`/api/prices/historical/${encodeURIComponent(commodity)}?days=${days}`),
};

// ── marketplace ───────────────────────────────────────────────────────────────
export const marketplace = {
  listings: (params = ""): Promise<{ listings: any[] }> =>
    apiFetch(`/api/marketplace/listings?${params}`),

  myListings: (): Promise<{ listings: any[] }> =>
    apiFetch("/api/marketplace/my-listings"),

  createListing: (form: {
    crop_type:     string;
    quantity_kg:   number;
    asking_price:  number;
    quality_grade: string;
    district:      string;
    state:         string;
    description?:  string;
  }) =>
    apiFetch("/api/marketplace/listings", {
      method: "POST",
      body:   JSON.stringify(form),
    }),

  myOrders: (): Promise<{ orders: any[] }> =>
    apiFetch("/api/marketplace/my-orders"),

  placeOrder: (form: {
    listing_id:         number;
    quantity_kg:        number;
    offer_price_per_kg: number;
  }) =>
    apiFetch("/api/marketplace/order", {
      method: "POST",
      body:   JSON.stringify(form),
    }),

  confirmOrder: (orderId: number) =>
    apiFetch(`/api/marketplace/order/${orderId}/confirm`, { method: "POST" }),

  transactions: (limit = 30): Promise<{ transactions: any[] }> =>
    apiFetch(`/api/marketplace/transactions?limit=${limit}`),

  getRoute: (
    originLat: number,
    originLon: number,
    destLat:   number,
    destLon:   number
  ): Promise<{
    distance_km:      number;
    duration_minutes: number;
    steps?:           string[];
    error?:           string;
  }> =>
    apiFetch(
      `/api/marketplace/route?origin_lat=${originLat}&origin_lon=${originLon}&dest_lat=${destLat}&dest_lon=${destLon}`
    ),

  route: (from: string, to: string) =>
    apiFetch(
      `/api/marketplace/route?from_place=${encodeURIComponent(from)}&to_place=${encodeURIComponent(to)}`
    ),
};

// ── finance ───────────────────────────────────────────────────────────────────
export const finance = {
  calculate: (form: {
    crop_type:  string;
    land_acres: number;
    state:      string;
    category:   string;
  }): Promise<{
    cost_per_acre:           number;
    total_investment:        number;
    kcc_loan_amount:         number;
    annual_interest:         number;
    monthly_emi:             number;
    net_cost_after_subsidy:  number;
    schemes_found:           number;
    total_subsidy_available: number;
    matching_schemes:        any[];
  }> =>
    apiFetch("/api/finance/calculate", {
      method: "POST",
      body:   JSON.stringify(form),
    }),

  calculateEmi: (
    principal:   number,
    annual_rate: number,
    months:      number
  ): Promise<{
    monthly_emi:    number;
    total_payment:  number;
    total_interest: number;
    principal:      number;
  }> =>
    apiFetch(
      `/api/finance/emi?principal=${principal}&annual_rate_percent=${annual_rate}&months=${months}`
    ),

  getSchemes: (): Promise<{ schemes: any[] }> =>
    apiFetch("/api/finance/schemes"),
};

// ── weather ───────────────────────────────────────────────────────────────────
export const weather = {
  current: (lat: number, lon: number) =>
    apiFetch(`/api/weather/current?lat=${lat}&lon=${lon}`),

  getForecast: (
    lat:   number,
    lon:   number,
    city?: string
  ): Promise<{
    source:         string;
    forecast:       Array<{
      date:        string;
      temp_max:    number;
      temp_min?:   number;
      humidity:    number;
      wind_kmh:    number;
      rain_mm:     number;
      description: string;
    }>;
    farming_alerts: Array<{
      severity: string;
      message:  string;
    }>;
  }> =>
    apiFetch(
      `/api/weather/forecast?lat=${lat}&lon=${lon}${
        city ? `&city=${encodeURIComponent(city)}` : ""
      }`
    ),
};

// ── monitor ───────────────────────────────────────────────────────────────────
export const monitor = {
  stats:       ()           => apiFetch("/api/monitor/stats"),
  auditLog:    (limit = 50) => apiFetch(`/api/monitor/audit-log?limit=${limit}`),
  fraudAlerts: ()           => apiFetch("/api/monitor/fraud-alerts"),
  fraudScan:   ()           => apiFetch("/api/monitor/fraud-scan", { method: "POST" }),
  volumeChart: ()           => apiFetch("/api/monitor/volume-chart"),
  export: (type: "transactions" | "listings") =>
    fetch(`${BASE_URL}/api/monitor/export/${type}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }),
};

// ── merchant ──────────────────────────────────────────────────────────────────
export const merchant = {
  dashboardStats: () => apiFetch("/api/merchant/dashboard-stats"),
  analytics:      () => apiFetch("/api/merchant/analytics"),
};

// ── language ──────────────────────────────────────────────────────────────────
export const language = {
  translate: (text: string, targetLanguage: string) =>
    apiFetch("/api/language/translate", {
      method: "POST",
      body:   JSON.stringify({ text, target_language: targetLanguage }),
    }),
};