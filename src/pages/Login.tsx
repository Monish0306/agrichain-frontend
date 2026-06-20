// src/pages/Login.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, ShieldCheck, Store, Wifi, WifiOff, Loader2 } from "lucide-react";
import { saveAuth, getAuth } from "../store/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "https://agrichain-api-tnhz.onrender.com";

type Role = "farmer" | "merchant" | "monitor";

// ── Fetch with 25s timeout ────────────────────────────────────────────────────
const fetchWithTimeout = async (
  url: string,
  opts: RequestInit = {},
  ms = 25000
): Promise<Response> => {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === "AbortError")
      throw new Error("Server is waking up — wait 10 seconds and try again.");
    throw e;
  }
};

// Wake Render backend the moment page loads
const pingBackend = () =>
  fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) }).catch(() => {});

// ── FARMER login/register (same endpoint — backend auto-creates if new) ────────
// POST /api/auth/farmer/login  { phone, name }
// → creates account if phone not found, else logs in
const farmerAuth = async (phone: string, name: string) => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/farmer/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ phone: phone.trim(), name: name.trim() }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
  return {
    access_token: data.access_token,
    user_id:      String(data.user_id || ""),
    name:         data.name || name,
    role:         "farmer" as const,
  };
};

// ── MERCHANT login/register (same endpoint — backend auto-creates if new) ──────
// POST /api/auth/merchant/login  { email, password, name }
// → creates account if email not found, else verifies password and logs in
const merchantAuth = async (email: string, password: string, name: string) => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/merchant/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      email:    email.trim().toLowerCase(),
      password: password,
      name:     name.trim(),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Login failed");
  return {
    access_token: data.access_token,
    user_id:      String(data.user_id || ""),
    name:         data.name || name,
    role:         "merchant" as const,
  };
};

// ── MONITOR login (fixed credentials from .env) ───────────────────────────────
// POST /api/auth/monitor/login  { username, password }
// MONITOR_USERNAME=agrichain_monitor
// MONITOR_PASSWORD=Monitor@AgriChain2026
const monitorAuth = async (username: string, password: string) => {
  const res = await fetchWithTimeout(`${BASE_URL}/api/auth/monitor/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      username: username.trim(),
      password: password.trim(),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || "Invalid credentials");
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

  // Monitor — pre-filled
  const [username,         setUsername]         = useState("agrichain_monitor");
  const [monitorPassword,  setMonitorPassword]  = useState("");

  // ── Redirect if already logged in + wake backend ──────────────────────────
  useEffect(() => {
    const user = getAuth();
    if (user?.access_token) {
      navigate(`/${user.role}`, { replace: true });
      return;
    }
    pingBackend().then(() => setServerUp(true)).catch(() => setServerUp(false));
    const iv = setInterval(() => {
      fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(4000) })
        .then(() => setServerUp(true))
        .catch(() => setServerUp(false));
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  // ── Elapsed timer while loading ───────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      let result: any;

      if (role === "farmer") {
        // Validate
        if (!phone.trim())      { setError("Phone number is required."); setLoading(false); return; }
        if (!farmerName.trim()) { setError("Your name is required.");     setLoading(false); return; }
        if (!/^\d{10}$/.test(phone.trim())) {
          setError("Enter a valid 10-digit phone number.");
          setLoading(false); return;
        }
        result = await farmerAuth(phone, farmerName);

      } else if (role === "merchant") {
        if (!email.trim())        { setError("Email is required.");         setLoading(false); return; }
        if (!password.trim())     { setError("Password is required.");      setLoading(false); return; }
        if (!merchantName.trim()) { setError("Business name is required."); setLoading(false); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError("Enter a valid email address.");
          setLoading(false); return;
        }
        result = await merchantAuth(email, password, merchantName);

      } else {
        if (!username.trim())       { setError("Username is required."); setLoading(false); return; }
        if (!monitorPassword.trim()) { setError("Password is required."); setLoading(false); return; }
        result = await monitorAuth(username, monitorPassword);
      }

      // Save auth
      saveAuth(result);
      if (!localStorage.getItem("agrichain_token"))
        throw new Error("Failed to save session. Try disabling private/incognito mode.");

      // Navigate to portal
      navigate(`/${result.role}`, { replace: true });

    } catch (e: any) {
      const msg = e.message || "Something went wrong";
      if (msg.includes("waking up") || msg.includes("abort"))
        setError("⏳ Server is starting up. Wait 10 seconds and try again.");
      else if (msg.includes("Failed to fetch") || msg.includes("NetworkError"))
        setError("❌ Cannot reach server. Check your internet connection.");
      else if (msg.includes("different role"))
        setError("❌ This phone/email is registered with a different portal.");
      else if (msg.includes("Invalid") || msg.includes("401") || msg.includes("Incorrect"))
        setError("❌ Wrong credentials. Please check and try again.");
      else if (msg.includes("required"))
        setError("❌ " + msg);
      else
        setError("❌ " + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  const loadingMsg =
    elapsed < 5  ? "Signing in…"                    :
    elapsed < 12 ? `Connecting… (${elapsed}s)`      :
    elapsed < 20 ? `Server starting… (${elapsed}s)` :
                   `Almost ready… (${elapsed}s)`;

  const inputBase = "w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none transition-colors";

  // ─── RENDER ───────────────────────────────────────────────────────────────
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
          <h1 className="font-display text-4xl font-bold gradient-text">Sign In</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Choose your portal to continue
          </p>

          {/* Server status pill */}
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

        {/* Role pills */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {([
            { id: "farmer",   label: "Farmer",   icon: Sprout,      hint: "Phone + Name"  },
            { id: "merchant", label: "Merchant", icon: Store,       hint: "Email + Pass"  },
            { id: "monitor",  label: "Monitor",  icon: ShieldCheck, hint: "Restricted"    },
          ] as const).map(r => (
            <button key={r.id}
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
              <span className="text-[9px] font-mono opacity-60">{r.hint}</span>
            </button>
          ))}
        </div>

        {/* Form card */}
        <motion.div
          key={role}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="neon-card p-6 space-y-4"
          onKeyDown={handleKeyDown}
        >

          {/* ── FARMER ── */}
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
                  maxLength={10}
                  autoComplete="tel"
                  className={`${inputBase} focus:border-primary`}
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
                  className={`${inputBase} focus:border-primary`}
                />
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-[11px] text-muted-foreground font-mono space-y-0.5">
                <p>✅ <strong>Existing farmer?</strong> Enter your phone + name → login directly.</p>
                <p>🆕 <strong>New farmer?</strong> Same form → account created automatically.</p>
              </div>
            </>
          )}

          {/* ── MERCHANT ── */}
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
                  className={`${inputBase} focus:border-secondary`}
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
                  className={`${inputBase} focus:border-secondary`}
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
                  className={`${inputBase} focus:border-secondary`}
                />
              </div>
              <div className="rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-[11px] text-muted-foreground font-mono space-y-0.5">
                <p>✅ <strong>Existing merchant?</strong> Enter email + password + business name → login.</p>
                <p>🆕 <strong>New merchant?</strong> Same form → account created automatically.</p>
              </div>
            </>
          )}

          {/* ── MONITOR ── */}
          {role === "monitor" && (
            <>
              <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-[11px] text-accent/80 font-mono">
                🔒 Restricted access · Government / Admin only · 24h JWT session
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
                  className={`${inputBase} focus:border-accent`}
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
                  className={`${inputBase} focus:border-accent`}
                />
              </div>
            </>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{    opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                  {error}
                  {error.includes("starting up") && (
                    <button onClick={handleSubmit}
                      className="block mt-1.5 text-xs underline opacity-80 hover:opacity-100"
                    >Retry →</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{loadingMsg}</>
            ) : (
              `Enter ${role.charAt(0).toUpperCase() + role.slice(1)} Portal →`
            )}
          </button>

          {/* Progress bar */}
          {loading && (
            <div className="w-full h-0.5 rounded-full bg-muted/50 overflow-hidden">
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