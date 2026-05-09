// src/store/auth.ts
export interface AuthUser {
    access_token: string;
    user_id: string;
    name: string;
    role: "farmer" | "merchant" | "monitor";
  }
  
  export const saveAuth = (user: AuthUser) => {
    localStorage.setItem("agrichain_token", user.access_token);
    localStorage.setItem("agrichain_user", JSON.stringify(user));
  };
  
  export const getAuth = (): AuthUser | null => {
    try {
      const u = localStorage.getItem("agrichain_user");
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  };
  
  export const clearAuth = () => {
    localStorage.removeItem("agrichain_token");
    localStorage.removeItem("agrichain_user");
  };