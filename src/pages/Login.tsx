// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sprout, ShieldCheck, Store } from "lucide-react";
import { auth } from "../api";
import { saveAuth } from "../store/auth";

type Role = "farmer" | "merchant" | "monitor";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("farmer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Farmer fields
  const [phone, setPhone] = useState("");
  const [farmerName, setFarmerName] = useState("");

  // Merchant fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [merchantName, setMerchantName] = useState("");

  // Monitor fields
  const [username, setUsername] = useState("");
  const [monitorPassword, setMonitorPassword] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      let result: any;
      if (role === "farmer") {
        if (!phone || !farmerName) { setError("Phone and name are required"); setLoading(false); return; }
        result = await auth.farmerLogin(phone, farmerName);
      } else if (role === "merchant") {
        if (!email || !password || !merchantName) { setError("All fields required"); setLoading(false); return; }
        result = await auth.merchantLogin(email, password, merchantName);
      } else {
        if (!username || !monitorPassword) { setError("Username and password required"); setLoading(false); return; }
        result = await auth.monitorLogin(username, monitorPassword);
      }
      saveAuth(result);
      if (role === "farmer") navigate("/farmer");
      else if (role === "merchant") navigate("/merchant");
      else navigate("/monitor");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
        <div className="text-center mb-8">
          <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">AgriChain Intelligence</div>
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
                  ? `border-${r.color}/60 bg-${r.color}/10 text-${r.color}`
                  : "border-border bg-card/40 text-muted-foreground hover:border-border/80"
              }`}
            >
              <r.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{r.label}</span>
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="neon-card p-6 space-y-4">
          {role === "farmer" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <input
                  value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Your Name</label>
                <input
                  value={farmerName} onChange={e => setFarmerName(e.target.value)}
                  placeholder="Ravi Kumar"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            </>
          )}

          {role === "merchant" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Business Name</label>
                <input
                  value={merchantName} onChange={e => setMerchantName(e.target.value)}
                  placeholder="Vasundhara Wholesale Pvt. Ltd."
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
                <input
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="merchant@example.com" type="email"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Password</label>
                <input
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" type="password"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary transition-colors"
                />
              </div>
            </>
          )}

          {role === "monitor" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Username</label>
                <input
                  value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="agrichain_monitor"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Password</label>
                <input
                  value={monitorPassword} onChange={e => setMonitorPassword(e.target.value)}
                  placeholder="••••••••" type="password"
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-accent transition-colors"
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing in…" : `Enter ${role.charAt(0).toUpperCase() + role.slice(1)} Portal`}
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