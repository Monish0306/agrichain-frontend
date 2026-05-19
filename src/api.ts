// src/api.ts
// ─── Central API service for AgriChain ───

export const BASE_URL =
  import.meta.env.VITE_API_URL || "https://agrichain-api-tnhz.onrender.com";

// ─────────────────────────────────────────
// HELPER — JSON requests
// ─────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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

// ─────────────────────────────────────────
// HELPER — FormData requests (file upload)
// ─────────────────────────────────────────
async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem("agrichain_token");
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // NOTE: Do NOT set Content-Type for FormData — browser sets it with boundary
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
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

  updateProfile: (data: {
    name?: string;
    language?: string;
    state?: string;
    district?: string;
  }) =>
    request("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ─────────────────────────────────────────
// ADVISORY
// ─────────────────────────────────────────
export const advisory = {
  recommend: (data: {
    nitrogen: number;
    phosphorous: number;
    potassium: number;
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
    soil_type: string;
    crop_type: string;
    gps_lat: number;
    gps_lon: number;
  }) =>
    request("/api/advisory/recommend", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCrops: () => request("/api/advisory/crops"),
  getSoilTypes: () => request("/api/advisory/soil-types"),
  getCropTypesForFertilizer: () =>
    request("/api/advisory/crop-types-for-fertilizer"),

  // ── Disease detection — uploads image file ──
  detectDisease: (imageFile: File) => {
    const formData = new FormData();
    formData.append("file", imageFile);
    return uploadFile<{
      disease: string;
      confidence: number;
      confidence_percent: number;
      treatment: string;
      severity: string;
      mode: string;
    }>("/api/advisory/disease-detect", formData);
  },
};

// ─────────────────────────────────────────
// MARKETPLACE
// ─────────────────────────────────────────
export const marketplace = {
  getListings: (filters?: {
    crop_type?: string;
    district?: string;
    state?: string;
  }) => {
    const params = new URLSearchParams(
      (filters as Record<string, string>) || {}
    ).toString();
    return request(`/api/marketplace/listings${params ? "?" + params : ""}`);
  },

  getListing: (id: string) => request(`/api/marketplace/listings/${id}`),

  createListing: (data: {
    crop_type: string;
    quantity_kg: number;
    asking_price: number;
    quality_grade: string;
    description?: string;
    district: string;
    state: string;
    location_lat?: number;
    location_lon?: number;
  }) =>
    request("/api/marketplace/listings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  placeOrder: (
    listingId: string,
    quantity_kg: number,
    offered_price: number
  ) =>
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

  // ── OSRM Route optimization ──
  getRoute: (
    originLat: number,
    originLon: number,
    destLat: number,
    destLon: number
  ) =>
    request(
      `/api/marketplace/route?origin_lat=${originLat}&origin_lon=${originLon}&dest_lat=${destLat}&dest_lon=${destLon}`
    ),
};

// ─────────────────────────────────────────
// PRICES
// ─────────────────────────────────────────
export const prices = {
  getCommodities: () => request("/api/prices/commodities"),

  predictPrice: (commodity: string, days = 7) =>
    request(`/api/prices/predict/${commodity}?days=${days}`),

  getCurrentPrice: (commodity: string) =>
    request(`/api/prices/current/${commodity}`),
};

// ─────────────────────────────────────────
// FINANCE
// ─────────────────────────────────────────
export const finance = {
  calculate: (data: {
    crop_type: string;
    land_acres: number;
    state: string;
    category: string;
  }) =>
    request("/api/finance/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSchemes: (filters?: {
    state?: string;
    crop_type?: string;
    category?: string;
  }) => {
    const params = new URLSearchParams(
      (filters as Record<string, string>) || {}
    ).toString();
    return request(`/api/finance/schemes${params ? "?" + params : ""}`);
  },

  // ── EMI Calculator ──
  calculateEmi: (
    principal: number,
    annual_rate_percent: number,
    months: number
  ) =>
    request(
      `/api/finance/emi?principal=${principal}&annual_rate_percent=${annual_rate_percent}&months=${months}`
    ),
};

// ─────────────────────────────────────────
// GROUNDWATER
// ─────────────────────────────────────────
export const groundwater = {
  getByDistrict: (district: string, state?: string) => {
    const params = state ? `?state=${encodeURIComponent(state)}` : "";
    return request(`/api/groundwater/${encodeURIComponent(district)}${params}`);
  },

  listAll: (filters?: { state?: string; category?: string }) => {
    const params = new URLSearchParams(
      (filters as Record<string, string>) || {}
    ).toString();
    return request(`/api/groundwater${params ? "?" + params : ""}`);
  },
};

// ─────────────────────────────────────────
// SOIL SUITABILITY
// ─────────────────────────────────────────
export const soil = {
  getSuitability: (soilType: string) =>
    request(`/api/soil/suitability/${encodeURIComponent(soilType)}`),

  getAll: () => request("/api/soil/all"),
};

// ─────────────────────────────────────────
// WEATHER
// ─────────────────────────────────────────
export const weather = {
  getForecast: (lat: number, lon: number, district?: string) => {
    const params = district
      ? `?lat=${lat}&lon=${lon}&district=${encodeURIComponent(district)}`
      : `?lat=${lat}&lon=${lon}`;
    return request(`/api/weather/forecast${params}`);
  },

  getCurrent: (lat: number, lon: number) =>
    request(`/api/weather/current?lat=${lat}&lon=${lon}`),
};

// ─────────────────────────────────────────
// CROP CALENDAR
// ─────────────────────────────────────────
export const calendar = {
  registerCrop: (data: {
    farm_id: string;
    crop_type: string;
    planting_date: string; // YYYY-MM-DD
    notes?: string;
  }) =>
    request("/api/calendar/register-crop", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyTasks: (upcomingDays = 7) =>
    request(`/api/calendar/my-tasks?upcoming_days=${upcomingDays}`),

  completeTask: (taskId: string) =>
    request(`/api/calendar/complete-task/${taskId}`, { method: "POST" }),

  getFullCalendar: (cropRecordId: string) =>
    request(`/api/calendar/full-calendar/${cropRecordId}`),
};

// ─────────────────────────────────────────
// MULTILINGUAL (Groq)
// ─────────────────────────────────────────
export const language = {
  translate: (text: string, targetLanguage: string) =>
    request("/api/language/translate", {
      method: "POST",
      body: JSON.stringify({ text, target_language: targetLanguage }),
    }),

  translateAdvisory: (advisoryResult: object, targetLanguage: string) =>
    request("/api/language/translate-advisory", {
      method: "POST",
      body: JSON.stringify({
        advisory_result: advisoryResult,
        target_language: targetLanguage,
      }),
    }),

  getSupported: () => request("/api/language/supported"),
};

// ─────────────────────────────────────────
// FARMS
// ─────────────────────────────────────────
export const farms = {
  create: (data: {
    gps_lat: number;
    gps_lon: number;
    area_acres: number;
    soil_type: string;
    district: string;
    state: string;
  }) =>
    request("/api/farms", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAll: () => request("/api/farms"),
};

// ─────────────────────────────────────────
// MONITOR
// ─────────────────────────────────────────
export const monitor = {
  getOverview: () => request("/api/monitor/overview"),

  getTransactions: (status?: string) =>
    request(
      `/api/monitor/transactions${status ? "?status_filter=" + status : ""}`
    ),

  getListings: () => request("/api/monitor/listings"),

  getAuditLog: (limit = 100) =>
    request(`/api/monitor/audit-log?limit=${limit}`),
};