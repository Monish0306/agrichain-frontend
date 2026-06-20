// src/store/auth.ts

export interface AuthUser {
  access_token: string;
  user_id:      string;
  name:         string;
  role:         "farmer" | "merchant" | "monitor";
  expires_at?:  number; // unix timestamp ms — optional
}

// ── FIX 1: saveAuth had no error handling ─────────────────────────────────────
// If localStorage is full (storage quota exceeded) or blocked (private browsing
// in some browsers), the setItem throws an exception — but the old code had no
// try/catch so the error was uncaught, saveAuth silently failed, and the user
// was redirected to /farmer but immediately kicked back to /login because
// getAuth() returned null. Fix: wrap in try/catch, throw clear error.
export const saveAuth = (user: AuthUser): void => {
  try {
    // Add expiry — 24 hours from now
    const withExpiry: AuthUser = {
      ...user,
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
    };
    localStorage.setItem("agrichain_token", user.access_token);
    localStorage.setItem("agrichain_user",  JSON.stringify(withExpiry));
  } catch (e: any) {
    // Storage quota exceeded or private browsing blocked
    throw new Error(
      "Could not save login — storage blocked. Try disabling private/incognito mode."
    );
  }
};

// ── FIX 2: getAuth had no token expiry check ──────────────────────────────────
// Old code returned the stored user forever — even if the JWT expired hours ago.
// Backend returns 401 on every API call but the UI kept showing the portal
// with no explanation. Fix: check expires_at and auto-clear if expired.
export const getAuth = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("agrichain_user");
    if (!raw) return null;

    const user: AuthUser = JSON.parse(raw);

    // Validate required fields exist
    if (!user.access_token || !user.role) {
      clearAuth();
      return null;
    }

    // Check expiry if present
    if (user.expires_at && Date.now() > user.expires_at) {
      clearAuth(); // auto-logout on expiry
      return null;
    }

    return user;
  } catch {
    // Corrupt data in localStorage — clear it
    clearAuth();
    return null;
  }
};

// ── FIX 3: clearAuth only removed 2 keys ──────────────────────────────────────
// If any other agrichain-related keys were stored (e.g. language preference,
// cached API responses), they stayed behind after logout causing stale data.
// Fix: clear all agrichain_ prefixed keys, keep others (e.g. user's other apps).
export const clearAuth = (): void => {
  try {
    // Remove all agrichain_ prefixed keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("agrichain_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // Silently fail — worst case some stale keys remain
  }
};

// ── ADDED: isLoggedIn — quick boolean check ───────────────────────────────────
// Used by Navbar, Index page, Hero etc to check login state without
// calling getAuth() and parsing JSON every time
export const isLoggedIn = (): boolean => {
  return getAuth() !== null;
};

// ── ADDED: getToken — quick token access for API calls ───────────────────────
// Used by api/index.ts instead of localStorage.getItem("agrichain_token")
// so token expiry is also checked before every API call
export const getToken = (): string => {
  const user = getAuth();
  return user?.access_token || "";
};

// ── ADDED: refreshAuthName — update display name after profile edit ───────────
export const refreshAuthName = (newName: string): void => {
  try {
    const user = getAuth();
    if (!user) return;
    saveAuth({ ...user, name: newName });
  } catch {
    // ignore
  }
};