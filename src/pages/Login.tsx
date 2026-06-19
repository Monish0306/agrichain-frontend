// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, ShieldCheck, Store } from "lucide-react";
import { saveAuth } from "../store/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "https://agrichain-api-tnhz.onrender.com";

type Role = "farmer" | "merchant" | "monitor";

// ── Auth API calls defined directly here — no import needed ──────────────────
// FIX: Your file imported { auth } from "../api" but auth was never exported
// from api/index.ts — caused a crash on every login attempt.
// Solution: define the 3 login functions right here.

const farmerLogin = async (phone: string, name: string) => {
  const res = await fetch(`${BASE_URL}/api/auth/farmer-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phone, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
  return {
    access_token: data.access_token,
    user_id:      String(data.farmer_id || data.user_id || ""),
    name:         data.name || name,
    role:         "farmer" as const,
  };
};

const merchantLogin = async (email: string, password: string, businessName: string) => {
  const res = await fetch(`${BASE_URL}/api/auth/merchant-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, business_name: businessName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
  return {
    access_token: data.access_token,
    user_id:      String(data.merchant_id || data.user_id || ""),
    name:         data.business_name || data.name || businessName,
    role:         "merchant" as const,
  };
};

const monitorLogin = async (username: string, password: string) => {
  // Monitor uses OAuth2 form-encoded login (FastAPI standard)
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const res = await fetch(`${BASE_URL}/api/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
  return {
    access_token: data.access_token,
    user_id:      String(data.user_id || username),
    name:         data.name || username,
    role:         "monitor" as const,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const [role,    setRole]    = useState<Role>("farmer");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Farmer fields
  const [phone,      setPhone]      = useState("");
  const [farmerName, setFarmerName] = useState("");

  // Merchant fields
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [merchantName, setMerchantName] = useState("");

  // Monitor fields
  const [username,        setUsername]        = useState("");
  const [monitorPassword, setMonitorPassword] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      let result: any;
      if (role === "farmer") {
        if (!phone || !farmerName) {
          setError("Phone and name are required");
          setLoading(false);
          return;
        }
        result = await farmerLogin(phone, farmerName);
      } else if (role === "merchant") {
        if (!email || !password || !merchantName) {
          setError("All fields required");
          setLoading(false);
          return;
        }
        result = await merchantLogin(email, password, merchantName);
      } else {
        if (!username || !monitorPassword) {
          setError("Username and password required");
          setLoading(false);
          return;
        }
        result = await monitorLogin(username, monitorPassword);
      }
      saveAuth(result);
      if      (role === "farmer")   navigate("/farmer");
      else if (role === "merchant") navigate("/merchant");
      else                          navigate("/monitor");
    } catch (e: any) {
      // Show friendly error message
      const msg = e.message || "Login failed";
      if (msg.includes("404") || msg.includes("not found")) {
        setError("Server not reachable. Please try again later.");
      } else if (msg.includes("401") || msg.includes("Incorrect")) {
        setError("Invalid credentials. Please check and try again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  const roles = [
    { id: "farmer",   label: "Farmer",   icon: Sprout,      color: "primary"   },
    { id: "merchant", label: "Merchant", icon: Store,       color: "secondary" },
    { id: "monitor",  label: "Monitor",  icon: ShieldCheck, color: "accent"    },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">
            AgriChain Intelligence
          </div>
          <h1 className="font-display text-4xl font-bold gradient-text">Sign In</h1>
          <p className="text-muted-foreground text-sm mt-2">Choose your portal to continue</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => { setRole(r.id); setError(""); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                role === r.id
                  ? r.id === "farmer"
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : r.id === "merchant"
                    ? "border-secondary/60 bg-secondary/10 text-secondary"
                    : "border-accent/60 bg-accent/10 text-accent"
                  : "border-border bg-card/40 text-muted-foreground hover:border-border/80"
              }`}
            >
              <r.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="neon-card p-6 space-y-4" onKeyDown={handleKeyDown}>

          {/* ── Farmer fields ── */}
          {role === "farmer" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  type="tel"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Your Name
                </label>
                <input
                  value={farmerName}
                  onChange={e => setFarmerName(e.target.value)}
                  placeholder="Ravi Kumar"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                New farmer? Your account is created automatically on first login.
              </p>
            </>
          )}

          {/* ── Merchant fields ── */}
          {role === "merchant" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Business Name
                </label>
                <input
                  value={merchantName}
                  onChange={e => setMerchantName(e.target.value)}
                  placeholder="Vasundhara Wholesale Pvt. Ltd."
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email
                </label>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  type="email"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary transition-colors"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                New merchant? Your account is created automatically on first login.
              </p>
            </>
          )}

          {/* ── Monitor fields ── */}
          {role === "monitor" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Username
                </label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="agrichain_monitor"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <input
                  value={monitorPassword}
                  onChange={e => setMonitorPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3"
            >
              {error}
            </motion.div>
          )}

          {/* Submit button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading
              ? "Signing in…"
              : `Enter ${role.charAt(0).toUpperCase() + role.slice(1)} Portal →`}
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/" className="hover:text-primary transition-colors">← Back to home</a>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;