// src/pages/Login.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout, ShieldCheck, Store,
  Wifi, WifiOff, Loader2, UserPlus, LogIn,
} from "lucide-react";
import { saveAuth, getAuth } from "../store/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "https://agrichain-api-tnhz.onrender.com";

type Role = "farmer" | "merchant" | "monitor";
type FarmerMode = "login" | "register";

// ── Fetch with timeout ────────────────────────────────────────────────────────
const fetchWithTimeout = async (
  url: string,
  opts: RequestInit = {},
  timeoutMs = 25000
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === "AbortError")
      throw new Error("Server is waking up — please wait 10 seconds and try again.");
    throw e;
  }
};

// ── Wake up Render backend ────────────────────────────────────────────────────
const pingBackend = () =>
  fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) }).catch(() => {});

// ── FARMER: Login (existing account) ─────────────────────────────────────────
const farmerLogin = async (phone: string, name: string) => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/farmer/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phone, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
  return {
    access_token: data.access_token,
    user_id: String(data.farmer_id || data.user_id || ""),
    name: data.name || name,
    role: "farmer" as const,
  };
};

// ── FARMER: Register (new account) ───────────────────────────────────────────
const farmerRegister = async (phone: string, name: string, state: string) => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/farmer/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phone, name, state }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Registration failed");
  return {
    access_token: data.access_token,
    user_id: String(data.farmer_id || data.user_id || ""),
    name: data.name || name,
    role: "farmer" as const,
  };
};

// ── MERCHANT: Login (existing) ────────────────────────────────────────────────
const merchantLogin = async (email: string, password: string) => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/merchant/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
  return {
    access_token: data.access_token,
    user_id: String(data.merchant_id || data.user_id || ""),
    name: data.business_name || data.name || email,
    role: "merchant" as const,
  };
};

// ── MERCHANT: Register (new) ──────────────────────────────────────────────────
const merchantRegister = async (
  email: string,
  password: string,
  businessName: string
) => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/merchant/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, business_name: businessName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Registration failed");
  return {
    access_token: data.access_token,
    user_id: String(data.merchant_id || data.user_id || ""),
    name: data.business_name || businessName,
    role: "merchant" as const,
  };
};

// ── MONITOR: Secure login — exact endpoint from backend ───────────────────────
// Endpoint: POST /api/auth/monitor/login
// Credentials from .env: MONITOR_USERNAME + MONITOR_PASSWORD
const monitorLogin = async (username: string, password: string) => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/monitor/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Invalid monitor credentials");
  return {
    access_token: data.access_token,
    user_id: String(data.user_id || username),
    name: data.name || "Monitor Admin",
    role: "monitor" as const,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
const Login = () => {
  const navigate  = useNavigate();
  const [role,    setRole]    = useState<Role>("farmer");
  const [mode,    setMode]    = useState<FarmerMode>("login"); // login or register
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [serverUp, setServerUp] = useState<boolean | null>(null);
  const [elapsed,  setElapsed]  = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Farmer fields
  const [phone,      setPhone]      = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [farmerState,setFarmerState]= useState("Karnataka");

  // Merchant fields
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [merchantName, setMerchantName] = useState("");

  // Monitor fields — pre-filled username for convenience
  const [username,        setUsername]        = useState("agrichain_monitor");
  const [monitorPassword, setMonitorPassword] = useState("");

  // ── On mount: redirect if logged in + wake backend ──
  useEffect(() => {
    const user = getAuth();
    if (user?.access_token) {
      navigate(`/${user.role}`, { replace: true });
      return;
    }
    pingBackend().then(() => setServerUp(true)).catch(() => setServerUp(false));
    const interval = setInterval(() => {
      fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(4000) })
        .then(() => setServerUp(true))
        .catch(() => setServerUp(false));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // ── Elapsed timer while loading ──
  useEffect(() => {
    if (loading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  // ── Reset mode and errors when switching role ──
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setMode("login");
    setError("");
    setSuccess("");
  };

  // ── Main submit handler ──
  const handleSubmit = async () => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      let result: any;

      if (role === "farmer") {
        if (!phone.trim() || !farmerName.trim()) {
          setError("Phone number and name are required.");
          setLoading(false); return;
        }
        if (!/^\d{10}$/.test(phone.trim())) {
          setError("Enter a valid 10-digit phone number.");
          setLoading(false); return;
        }
        if (mode === "register") {
          result = await farmerRegister(phone.trim(), farmerName.trim(), farmerState);
          setSuccess("✅ Account created! Welcome to AgriChain.");
        } else {
          result = await farmerLogin(phone.trim(), farmerName.trim());
        }

      } else if (role === "merchant") {
        if (!email.trim() || !password.trim()) {
          setError("Email and password are required.");
          setLoading(false); return;
        }
        if (mode === "register") {
          if (!merchantName.trim()) {
            setError("Business name is required for registration.");
            setLoading(false); return;
          }
          result = await merchantRegister(email.trim(), password, merchantName.trim());
          setSuccess("✅ Account created! Welcome to AgriChain.");
        } else {
          result = await merchantLogin(email.trim(), password);
        }

      } else {
        // Monitor — always login, never register
        if (!username.trim() || !monitorPassword.trim()) {
          setError("Username and password are required.");
          setLoading(false); return;
        }
        result = await monitorLogin(username.trim(), monitorPassword);
      }

      // Save and navigate
      saveAuth(result);
      const saved = localStorage.getItem("agrichain_token");
      if (!saved) throw new Error("Failed to save session. Try disabling private browsing.");
      navigate(`/${result.role}`, { replace: true });

    } catch (e: any) {
      const msg = e.message || "Something went wrong";
      if (msg.includes("waking up") || msg.includes("abort"))
        setError("⏳ Server is starting up. Wait 10 seconds and try again.");
      else if (msg.includes("Failed to fetch") || msg.includes("network"))
        setError("❌ No internet connection or server is unreachable.");
      else if (msg.includes("not found") || msg.includes("No farmer") || msg.includes("does not exist"))
        setError("❌ Account not found. Please register first.");
      else if (msg.includes("already") || msg.includes("exists"))
        setError("❌ Account already exists. Please login instead.");
      else if (msg.includes("Invalid") || msg.includes("Incorrect") || msg.includes("401"))
        setError("❌ Wrong credentials. Please check and try again.");
      else
        setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  const loadingMsg =
    elapsed < 5  ? "Signing in…"                     :
    elapsed < 12 ? `Connecting… (${elapsed}s)`       :
    elapsed < 20 ? `Server starting… (${elapsed}s)`  :
                   `Almost ready… (${elapsed}s)`;

  const inputClass = (color: string) =>
    `w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-${color} transition-colors`;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">
            AgriChain Intelligence
          </div>
          <h1 className="font-display text-4xl font-bold gradient-text">
            {mode === "register" ? "Create Account" : "Sign In"}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === "register"
              ? "Register your account to get started"
              : "Choose your portal to continue"}
          </p>

          {/* Server status */}
          <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono">
            {serverUp === null && (
              <><Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Connecting to server…</span></>
            )}
            {serverUp === true && (
              <><Wifi className="w-3 h-3 text-primary" />
              <span className="text-primary">Server online · Ready</span></>
            )}
            {serverUp === false && (
              <><WifiOff className="w-3 h-3 text-accent" />
              <span className="text-accent">Server waking up — first login may take 30s</span></>
            )}
          </div>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {([
            { id: "farmer",   label: "Farmer",   icon: Sprout,      desc: "Phone + Name"  },
            { id: "merchant", label: "Merchant", icon: Store,       desc: "Email + Pass"  },
            { id: "monitor",  label: "Monitor",  icon: ShieldCheck, desc: "Restricted"    },
          ] as const).map((r) => (
            <button key={r.id} onClick={() => handleRoleChange(r.id)}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all ${
                role === r.id
                  ? r.id === "farmer"   ? "border-primary/60 bg-primary/10 text-primary"
                  : r.id === "merchant" ? "border-secondary/60 bg-secondary/10 text-secondary"
                  :                       "border-accent/60 bg-accent/10 text-accent"
                  : "border-border bg-card/40 text-muted-foreground hover:border-border/80"
              }`}
            >
              <r.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{r.label}</span>
              <span className="text-[9px] font-mono opacity-60">{r.desc}</span>
            </button>
          ))}
        </div>

        {/* Login / Register toggle — only for farmer and merchant */}
        {role !== "monitor" && (
          <div className="flex gap-2 mb-4">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  mode === m
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {m === "login"
                  ? <><LogIn className="w-3.5 h-3.5" /> Login</>
                  : <><UserPlus className="w-3.5 h-3.5" /> Register</>
                }
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <motion.div
          key={`${role}-${mode}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="neon-card p-6 space-y-4"
          onKeyDown={handleKeyDown}
        >
          {/* ── FARMER FIELDS ── */}
          {role === "farmer" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Phone Number
                </label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210" type="tel" autoComplete="tel"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Your Name
                </label>
                <input value={farmerName} onChange={e => setFarmerName(e.target.value)}
                  placeholder="Ravi Kumar" autoComplete="name"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              {mode === "register" && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    State
                  </label>
                  <select value={farmerState} onChange={e => setFarmerState(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                  >
                    {["Karnataka","Tamil Nadu","Maharashtra","Andhra Pradesh","Telangana",
                      "Gujarat","Punjab","Haryana","Uttar Pradesh","Bihar","West Bengal",
                      "Rajasthan","Madhya Pradesh","Kerala","Odisha"].map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground font-mono">
                {mode === "login"
                  ? "Don't have an account? Click Register above."
                  : "Your account will be created with phone as unique ID."}
              </p>
            </>
          )}

          {/* ── MERCHANT FIELDS ── */}
          {role === "merchant" && (
            <>
              {mode === "register" && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Business Name
                  </label>
                  <input value={merchantName} onChange={e => setMerchantName(e.target.value)}
                    placeholder="Vasundhara Wholesale Pvt. Ltd."
                    className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email
                </label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="merchant@example.com" type="email" autoComplete="email"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <input value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary transition-colors"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                {mode === "login"
                  ? "No account? Click Register above to create one."
                  : "Minimum 8 characters. Use a strong password."}
              </p>
            </>
          )}

          {/* ── MONITOR FIELDS ── */}
          {role === "monitor" && (
            <>
              <div className="text-[10px] font-mono text-accent/80 border border-accent/20 bg-accent/5 rounded-lg px-3 py-2">
                🔒 Restricted access · Government / Admin only · 24h JWT session
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Username
                </label>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="agrichain_monitor" autoComplete="username"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <input value={monitorPassword} onChange={e => setMonitorPassword(e.target.value)}
                  placeholder="••••••••" type="password" autoComplete="current-password"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                Contact AgriChain admin if you do not have credentials.
              </p>
            </>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 overflow-hidden"
              >
                {error}
                {error.includes("not found") && role !== "monitor" && (
                  <button onClick={() => { setMode("register"); setError(""); }}
                    className="block mt-1.5 text-xs underline text-primary"
                  >
                    Create account now →
                  </button>
                )}
                {error.includes("already exists") && (
                  <button onClick={() => { setMode("login"); setError(""); }}
                    className="block mt-1.5 text-xs underline text-primary"
                  >
                    Login instead →
                  </button>
                )}
                {error.includes("starting up") && (
                  <button onClick={handleSubmit}
                    className="block mt-1.5 text-xs underline text-destructive/80"
                  >
                    Retry now →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-primary text-sm bg-primary/10 border border-primary/30 rounded-xl px-4 py-3"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{loadingMsg}</>
            ) : mode === "register" ? (
              <><UserPlus className="w-4 h-4" />Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</>
            ) : (
              `Enter ${role.charAt(0).toUpperCase() + role.slice(1)} Portal →`
            )}
          </button>

          {/* Progress bar */}
          {loading && (
            <div className="w-full h-0.5 rounded-full bg-muted overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: elapsed < 25 ? `${(elapsed / 25) * 100}%` : "95%" }}
                transition={{ duration: 1 }}
              />
            </div>
          )}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/" className="hover:text-primary transition-colors">← Back to home</a>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;