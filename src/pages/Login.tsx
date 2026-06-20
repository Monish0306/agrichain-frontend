// src/pages/Login.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, ShieldCheck, Store, Wifi, WifiOff, Loader2 } from "lucide-react";
import { saveAuth, getAuth } from "../store/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "https://agrichain-api-tnhz.onrender.com";

type Role = "farmer" | "merchant" | "monitor";

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
      throw new Error("Server is waking up — please try again in 10 seconds.");
    throw e;
  }
};

// Wake backend the moment login page opens
const pingBackend = () =>
  fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) }).catch(() => {});

// ── FARMER LOGIN ──────────────────────────────────────────────────────────────
// If account exists → returns token. If new → creates account automatically.
const farmerLogin = async (phone: string, name: string) => {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/auth/farmer-login`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phone_number: phone, name }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
  return {
    access_token: data.access_token,
    user_id:      String(data.farmer_id || data.user_id || ""),
    name:         data.name || name,
    role:         "farmer" as const,
  };
};

// ── MERCHANT LOGIN ────────────────────────────────────────────────────────────
// If account exists → returns token. If new → creates account automatically.
const merchantLogin = async (
  email: string,
  password: string,
  businessName: string
) => {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/auth/merchant-login`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password, business_name: businessName }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
  return {
    access_token: data.access_token,
    user_id:      String(data.merchant_id || data.user_id || ""),
    name:         data.business_name || data.name || businessName,
    role:         "merchant" as const,
  };
};

// ── MONITOR LOGIN ─────────────────────────────────────────────────────────────
// ONLY works with exact credentials from .env:
//   MONITOR_USERNAME = agrichain_monitor
//   MONITOR_PASSWORD = Monitor@AgriChain2026
// Endpoint: POST /api/auth/monitor/login  (JSON body)
const monitorLogin = async (username: string, password: string) => {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/auth/monitor/login`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, password }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Invalid monitor credentials");
  return {
    access_token: data.access_token,
    user_id:      String(data.user_id || username),
    name:         data.name || "Monitor Admin",
    role:         "monitor" as const,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const [role,    setRole]    = useState<Role>("farmer");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [serverUp, setServerUp] = useState<boolean | null>(null);
  const [elapsed,  setElapsed]  = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Farmer
  const [phone,      setPhone]      = useState("");
  const [farmerName, setFarmerName] = useState("");
  // Merchant
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [merchantName, setMerchantName] = useState("");
  // Monitor — pre-filled username
  const [username,        setUsername]        = useState("agrichain_monitor");
  const [monitorPassword, setMonitorPassword] = useState("");

  // ── On mount: redirect if already logged in + wake backend ──
  useEffect(() => {
    const user = getAuth();
    if (user?.access_token) {
      if      (user.role === "farmer")   navigate("/farmer",   { replace: true });
      else if (user.role === "merchant") navigate("/merchant", { replace: true });
      else if (user.role === "monitor")  navigate("/monitor",  { replace: true });
      return;
    }
    // Ping backend to wake it up while user fills form
    pingBackend().then(() => setServerUp(true)).catch(() => setServerUp(false));
    const interval = setInterval(() => {
      fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(4000) })
        .then(() => setServerUp(true))
        .catch(() => setServerUp(false));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // ── Elapsed timer — shows progress during slow cold start ──
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
        result = await farmerLogin(phone.trim(), farmerName.trim());

      } else if (role === "merchant") {
        if (!email || !password || !merchantName) {
          setError("All fields are required");
          setLoading(false);
          return;
        }
        result = await merchantLogin(email.trim(), password, merchantName.trim());

      } else {
        // Monitor — strict credential check
        if (!username || !monitorPassword) {
          setError("Username and password required");
          setLoading(false);
          return;
        }
        result = await monitorLogin(username.trim(), monitorPassword);
      }

      // Save token and verify it was stored
      saveAuth(result);
      const saved = localStorage.getItem("agrichain_token");
      if (!saved) throw new Error("Failed to save session — try disabling private browsing.");

      // Navigate to correct portal
      if      (role === "farmer")   navigate("/farmer",   { replace: true });
      else if (role === "merchant") navigate("/merchant", { replace: true });
      else                          navigate("/monitor",  { replace: true });

    } catch (e: any) {
      const msg = e.message || "Login failed";
      if (msg.includes("waking up") || msg.includes("AbortError")) {
        setError("⏳ Server is starting up. Wait 10 seconds and try again.");
      } else if (msg.includes("Failed to fetch") || msg.includes("network")) {
        setError("❌ Cannot reach server. Check your internet connection.");
      } else if (msg.includes("monitor") || msg.includes("Invalid monitor") || msg.includes("401")) {
        setError("❌ Wrong monitor credentials. Check username and password.");
      } else if (msg.includes("private browsing") || msg.includes("save session")) {
        setError("❌ " + msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleLogin();
  };

  const loadingMsg =
    elapsed < 5  ? "Signing in…"                     :
    elapsed < 12 ? `Connecting… (${elapsed}s)`       :
    elapsed < 20 ? `Server waking up… (${elapsed}s)` :
                   `Almost there… (${elapsed}s)`;

  const roles = [
    { id: "farmer",   label: "Farmer",   icon: Sprout,      desc: "Phone + Name" },
    { id: "merchant", label: "Merchant", icon: Store,       desc: "Email + Pass" },
    { id: "monitor",  label: "Monitor",  icon: ShieldCheck, desc: "Restricted"   },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">
            AgriChain Intelligence
          </div>
          <h1 className="font-display text-4xl font-bold gradient-text">Sign In</h1>
          <p className="text-muted-foreground text-sm mt-2">Choose your portal to continue</p>

          {/* Server status pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono">
            {serverUp === null && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Connecting to server…</span>
              </>
            )}
            {serverUp === true && (
              <>
                <Wifi className="w-3 h-3 text-primary" />
                <span className="text-primary">Server online · Ready</span>
              </>
            )}
            {serverUp === false && (
              <>
                <WifiOff className="w-3 h-3 text-accent" />
                <span className="text-accent">Server starting — first login may take 30s</span>
              </>
            )}
          </div>
        </div>

        {/* ── Role selector ── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => { setRole(r.id); setError(""); }}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all ${
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
              <span className="text-[9px] font-mono opacity-60">{r.desc}</span>
            </button>
          ))}
        </div>

        {/* ── Form ── */}
        <motion.div
          key={role}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="neon-card p-6 space-y-4"
          onKeyDown={handleKeyDown}
        >

          {/* FARMER fields */}
          {role === "farmer" && (
            <>
              <div className="text-[10px] font-mono text-primary/70 border border-primary/20 bg-primary/5 rounded-lg px-3 py-2">
                🌱 Enter phone + name. New farmer? Account created automatically.
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  type="tel"
                  autoComplete="tel"
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
                  autoComplete="name"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </>
          )}

          {/* MERCHANT fields */}
          {role === "merchant" && (
            <>
              <div className="text-[10px] font-mono text-secondary/70 border border-secondary/20 bg-secondary/5 rounded-lg px-3 py-2">
                🏪 New merchant? Account created automatically on first login.
              </div>
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
                  autoComplete="email"
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
                  autoComplete="current-password"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary transition-colors"
                />
              </div>
            </>
          )}

          {/* MONITOR fields */}
          {role === "monitor" && (
            <>
              <div className="text-[10px] font-mono text-accent/80 border border-accent/20 bg-accent/5 rounded-lg px-3 py-2">
                🔒 Restricted · Government / Admin only · Use your assigned credentials
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Username
                </label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="agrichain_monitor"
                  autoComplete="username"
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
                  placeholder="Monitor@AgriChain2026"
                  type="password"
                  autoComplete="current-password"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
            </>
          )}

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0,  height: "auto" }}
                exit={{    opacity: 0,         height: 0 }}
                className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 overflow-hidden"
              >
                {error}
                {(error.includes("waking") || error.includes("starting")) && (
                  <button
                    onClick={handleLogin}
                    className="block mt-2 text-xs underline text-destructive/80 hover:text-destructive"
                  >
                    Retry now →
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{loadingMsg}</>
            ) : (
              `Enter ${role.charAt(0).toUpperCase() + role.slice(1)} Portal →`
            )}
          </button>

          {/* Progress bar during loading */}
          {loading && (
            <div className="w-full h-0.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
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