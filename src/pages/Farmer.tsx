import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { SparkField } from "@/components/SparkField";
import { MiniMap } from "@/components/MiniMap";
import { QRBlock } from "@/components/QRBlock";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { advisory, prices, marketplace, finance } from "../api";
import { getAuth, clearAuth } from "../store/auth";
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  Bug,
  Camera,
  CheckCircle2,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSun,
  Coins,
  Droplets,
  ExternalLink,
  Home,
  IndianRupee,
  Languages,
  LineChart,
  MapPin,
  Mic,
  Package,
  PlusCircle,
  ShieldCheck,
  Sprout,
  Sun,
  TrendingUp,
  Volume2,
  Wind,
  Zap,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const priceData = [
  { d: "Mon", p: 11 }, { d: "Tue", p: 13 }, { d: "Wed", p: 15 },
  { d: "Thu", p: 19 }, { d: "Fri", p: 17 }, { d: "Sat", p: 16 }, { d: "Sun", p: 14 },
];

const historical30 = Array.from({ length: 30 }, (_, i) => ({
  d: i + 1,
  p: 12 + Math.sin(i / 3) * 4 + (i / 8),
}));

const shap = [
  { f: "Soil type · Sandy Loam", v: 40 },
  { f: "Season · Rabi", v: 35 },
  { f: "Water · Borewell", v: 25 },
];

const hourly = [
  { t: "06", i: CloudSun, temp: 24, mm: 0 },
  { t: "09", i: Sun, temp: 28, mm: 0 },
  { t: "12", i: Sun, temp: 32, mm: 0 },
  { t: "15", i: Cloud, temp: 31, mm: 0 },
  { t: "18", i: CloudDrizzle, temp: 27, mm: 2 },
  { t: "21", i: CloudRain, temp: 25, mm: 6 },
  { t: "00", i: CloudRain, temp: 24, mm: 4 },
];

const farmingAlerts = [
  { i: CloudRain, sev: "high",   t: "Heavy rain Day 3 — do not spray pesticide tomorrow. Wait until Day 5." },
  { i: Droplets,  sev: "med",    t: "Humidity 85% forecast — fungal disease risk elevated this week." },
  { i: Wind,      sev: "low",    t: "Temperature dropping below 15°C on Day 4 — cover young seedlings overnight." },
];

const nearbyMandis = [
  { name: "Mysore APMC",      d: "0 km",  p: 14, best: false },
  { name: "Mandya APMC",      d: "42 km", p: 17, best: true  },
  { name: "Bengaluru Yeshwantpur", d: "138 km", p: 19, best: false },
];

const schemes = [
  { name: "PM-KISAN",            amt: "₹6,000 / yr",  for: "All small farmers", deadline: "Always open" },
  { name: "PMKSY · Drip irrig.", amt: "Up to ₹45,000", for: "Borewell users",   deadline: "Mar 31, 2026" },
  { name: "PM Fasal Bima Yojana", amt: "Crop insurance", for: "Rabi crops",     deadline: "Dec 15, 2025" },
  { name: "TN State SC Scheme",  amt: "₹12,000",      for: "SC category",      deadline: "Jan 30, 2026" },
];

const sevColor = (s: string) => (s === "high" ? "destructive" : s === "med" ? "accent" : "secondary");

const FarmerPortal = () => {
  const navigate = useNavigate();
  const user = getAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user || user.role !== "farmer") navigate("/login");
  }, []);

  // ── State ──
  const [advisoryData, setAdvisoryData] = useState<any>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [priceData7, setPriceData7] = useState<any>(null);
  const [selectedCommodity, setSelectedCommodity] = useState("tomato");
  const [commodities, setCommodities] = useState<string[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [financeData, setFinanceData] = useState<any>(null);

  // ── Load commodities on mount ──
  useEffect(() => {
    prices.getCommodities().then((r: any) => setCommodities(r.commodities || []));
    marketplace.myListings().then((r: any) => setMyListings(r.listings || []));
  }, []);

  // ── Load price data when commodity changes ──
  useEffect(() => {
    if (selectedCommodity) {
      prices.predictPrice(selectedCommodity, 7).then(setPriceData7).catch(console.error);
    }
  }, [selectedCommodity]);

  // ── Advisory submit ──
  const [advisoryForm, setAdvisoryForm] = useState({
    nitrogen: 90, phosphorous: 42, potassium: 43,
    temperature: 25, humidity: 65, ph: 6.5, rainfall: 200,
    soil_type: "Loamy", crop_type: "Wheat",
    gps_lat: 12.97, gps_lon: 77.59,
  });

  const handleAdvisorySubmit = async () => {
    setAdvisoryLoading(true);
    try {
      const result = await advisory.recommend(advisoryForm);
      setAdvisoryData(result);
    } catch (e: any) {
      alert("Advisory error: " + e.message);
    } finally {
      setAdvisoryLoading(false);
    }
  };

  // ── Finance calculate ──
  const handleFinanceCalculate = async () => {
    try {
      const result = await finance.calculate({
        crop_type: "cotton", land_acres: 3, state: "Karnataka", category: "General"
      });
      setFinanceData(result);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { handleFinanceCalculate(); }, []);

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-16">
      <Navbar />
      <SparkField density={0.6} />

      <div className="container mx-auto px-6 pt-28 pb-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-10"
        >
          <div>
            <div className="font-mono text-xs text-primary uppercase tracking-widest mb-2">Farmer Portal · Demo</div>
            <h1 className="font-display text-4xl font-bold">
              வணக்கம், <span className="gradient-text">{user?.name || "Farmer"}</span>
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" /> Cuddalore, Tamil Nadu · 11.7° N, 79.7° E · GPS locked
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-full border border-border bg-card/50 text-sm flex items-center gap-2 hover:border-primary transition-colors">
              <Languages className="w-4 h-4" /> தமிழ்
            </button>
            <button className="px-4 py-2 rounded-full border border-border bg-card/50 text-sm flex items-center gap-2 hover:border-primary transition-colors">
              <Mic className="w-4 h-4" /> Voice
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-sm hover:bg-destructive hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </motion.div>

        {/* Cyclone disaster override */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-destructive/40 bg-destructive/10 p-5 mb-8 flex items-start gap-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-destructive/20 to-transparent w-1/3 animate-neon-sweep" />
          <AlertTriangle className="relative w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
          <div className="relative">
            <div className="font-display font-bold text-lg text-destructive">SEVERE WEATHER · Cyclone Fengal · IMD Warning</div>
            <p className="text-sm text-foreground/90 mt-1">
              Do not plant for 8 days. Cover existing seedlings with tarp. Resume safe date:{" "}
              <span className="font-semibold">Dec 2, 2025</span>. Emergency: 1077 (district control room).
            </p>
          </div>
          <Volume2 className="relative w-5 h-5 text-destructive ml-auto flex-shrink-0" />
        </motion.div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { i: Sun,       l: "Today",     v: "31°C",    s: "Partly cloudy", c: "primary"   },
            { i: Droplets,  l: "Humidity",  v: "82%",     s: "Fungal risk ↑", c: "secondary" },
            { i: Wind,      l: "Wind",      v: "24 km/h", s: "NE",            c: "accent"    },
            { i: CloudRain, l: "7-day rain", v: "84mm",   s: "Heavy Day 3",   c: "secondary" },
          ].map((k, i) => (
            <motion.div
              key={k.l}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="neon-card p-5"
            >
              <div className={`w-10 h-10 rounded-lg bg-${k.c}/10 ring-1 ring-${k.c}/30 flex items-center justify-center mb-3`}>
                <k.i className={`w-5 h-5 text-${k.c}`} />
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{k.l}</div>
              <div className="font-display text-2xl font-bold mt-1">{k.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.s}</div>
            </motion.div>
          ))}
        </div>

        {/* Hourly forecast timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="neon-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-xs text-secondary uppercase tracking-widest">7-day hourly · OpenWeatherMap</div>
              <h2 className="font-display text-xl font-bold mt-1">Forecast timeline</h2>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">Updated 3 min ago</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {hourly.map((h, i) => (
              <motion.div
                key={h.t}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="rounded-xl bg-muted/30 border border-border p-3 text-center hover:border-primary/40 transition-colors"
              >
                <div className="text-[10px] font-mono text-muted-foreground">{h.t}:00</div>
                <h.i className={`w-6 h-6 mx-auto my-2 ${h.mm > 4 ? "text-destructive" : h.mm > 0 ? "text-secondary" : "text-accent"}`} />
                <div className="font-display font-bold">{h.temp}°</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{h.mm}mm</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Farming-specific alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="neon-card p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-accent" />
            <span className="font-display font-bold">Farming-specific alerts · AI-interpreted</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {farmingAlerts.map((a, i) => {
              const c = sevColor(a.sev);
              return (
                <div key={i} className={`rounded-xl border border-${c}/40 bg-${c}/5 p-4`}>
                  <a.i className={`w-5 h-5 text-${c} mb-2`} />
                  <p className="text-sm leading-snug">{a.t}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Crop advisory */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="neon-card p-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-mono text-xs text-primary uppercase tracking-widest">Module 01 · Smart Advisory · XGBoost + ICAR</div>
                <h2 className="font-display text-2xl font-bold mt-1">Recommended for Sandy Loam · Rabi</h2>
              </div>
              <Volume2 className="w-5 h-5 text-primary" />
            </div>

            {/* Advisory input form */}
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              {[
                { l: "Nitrogen",     k: "nitrogen",     t: "number" },
                { l: "Phosphorous",  k: "phosphorous",  t: "number" },
                { l: "Potassium",    k: "potassium",    t: "number" },
                { l: "Temperature",  k: "temperature",  t: "number" },
                { l: "Humidity %",   k: "humidity",     t: "number" },
                { l: "pH",           k: "ph",           t: "number" },
                { l: "Rainfall mm",  k: "rainfall",     t: "number" },
              ].map((f) => (
                <div key={f.k}>
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">{f.l}</div>
                  <input
                    type="number"
                    value={(advisoryForm as any)[f.k]}
                    onChange={e => setAdvisoryForm(prev => ({ ...prev, [f.k]: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none focus:border-primary"
                  />
                </div>
              ))}
              <div>
                <div className="text-[10px] text-muted-foreground uppercase mb-1">Soil Type</div>
                <select
                  value={advisoryForm.soil_type}
                  onChange={e => setAdvisoryForm(prev => ({ ...prev, soil_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none focus:border-primary"
                >
                  {["Black","Clayey","Loamy","Red","Sandy"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handleAdvisorySubmit}
              disabled={advisoryLoading}
              className="mb-4 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {advisoryLoading ? "Analyzing…" : "Get Recommendation"}
            </button>

            {/* Live results */}
            {advisoryData && (
              <div className="grid sm:grid-cols-2 gap-4">
                {advisoryData.recommended_crops?.map((c: any) => (
                  <div key={c.name} className="rounded-xl border border-primary/40 bg-primary/5 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Sprout className="w-5 h-5 text-primary" />
                      <span className="font-display text-xl font-bold">{c.name}</span>
                      <span className="ml-auto text-xs text-primary font-mono">{c.confidence_percent}%</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Water needed: {c.water_requirement_mm} mm
                    </div>
                  </div>
                ))}
                {advisoryData.fertilizer_recommendation && (
                  <div className="sm:col-span-2 rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
                    <span className="font-semibold text-accent">Fertilizer: </span>
                    {advisoryData.fertilizer_recommendation.name} — {advisoryData.fertilizer_recommendation.dosage_kg_per_acre} kg/acre
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Pesticide recommendation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="neon-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Bug className="w-5 h-5 text-accent" />
              <div>
                <div className="font-mono text-xs text-accent uppercase tracking-widest">Sub-feature · CIBRC verified</div>
                <h2 className="font-display text-lg font-bold">Pesticide for Groundnut</h2>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold">Chlorpyrifos 20% EC</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Dilution</span>
                <span className="font-mono">2 ml / litre</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Best time</span>
                <span>Evening · Day 5</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Re-entry</span>
                <span className="font-mono text-accent">24 hours</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Local price</span>
                <span className="font-display font-bold gradient-text-amber">₹420/L</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <ShieldCheck className="w-3 h-3 text-primary" />
              CIBRC approved · License #INS/2018/4421
            </div>
          </motion.div>
        </div>

        {/* Price intel — full block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="neon-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-xs text-secondary uppercase tracking-widest">Price Intelligence · Prophet</div>
              <h2 className="font-display text-2xl font-bold mt-1">
                {selectedCommodity.charAt(0).toUpperCase() + selectedCommodity.slice(1)}
              </h2>
            </div>
            <select
              value={selectedCommodity}
              onChange={e => setSelectedCommodity(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted/30 border border-border text-sm outline-none focus:border-secondary"
            >
              {commodities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* 7-day forecast */}
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">7-day forecast · MAPE 6.8%</div>
              <div className="h-44">
                <ResponsiveContainer>
                  <AreaChart data={priceData7?.predictions?.map((p: any) => ({ d: p.date.slice(5), p: p.predicted_price })) || priceData}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(142 100% 60%)" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="hsl(142 100% 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="d" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="p" stroke="hsl(142 100% 60%)" strokeWidth={2} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {priceData7?.sell_recommendation && (
                <div className={`mt-3 rounded-xl border p-4 ${
                  priceData7.sell_recommendation.action === "WAIT"
                    ? "border-accent/40 bg-accent/10"
                    : "border-primary/40 bg-primary/10"
                }`}>
                  <div className="font-display font-bold">
                    {priceData7.sell_recommendation.action} · {priceData7.sell_recommendation.reason}
                  </div>
                  <p className="text-xs mt-1">
                    Best day: {priceData7.sell_recommendation.best_day_to_sell} ·{" "}
                    ₹{priceData7.sell_recommendation.expected_price_on_best_day}/kg
                  </p>
                </div>
              )}
            </div>

            {/* 30-day historical */}
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">30-day historical · AGMARKNET</div>
              <div className="h-44">
                <ResponsiveContainer>
                  <AreaChart data={historical30}>
                    <defs>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(168 100% 55%)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(168 100% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="d" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="p" stroke="hsl(168 100% 55%)" strokeWidth={2} fill="url(#g2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs font-mono text-muted-foreground">
                MSP floor <span className="text-primary">₹9.50</span> · 30-day avg <span className="text-secondary">₹13.20</span>
              </div>
            </div>
          </div>

          {/* Nearby mandis */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Nearby mandis · live</div>
            <div className="grid md:grid-cols-3 gap-3">
              {nearbyMandis.map((m) => (
                <div
                  key={m.name}
                  className={`rounded-xl border p-4 ${
                    m.best ? "border-primary/50 bg-primary/5 shadow-neon-lime" : "border-border bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">{m.name}</div>
                    {m.best && <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">BEST</span>}
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-2xl font-bold gradient-text">₹{m.p}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{m.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Finance + scheme finder + listings */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Finance planner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            className="neon-card p-6"
          >
            <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">Module 04 · Finance Planner</div>
            <h2 className="font-display text-xl font-bold mb-4">
              {financeData ? `${financeData.crop_type} · ${financeData.land_acres} acres · ${financeData.state}` : "Loading…"}
            </h2>
            {financeData && (
              <>
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cost per acre</span>
                    <span className="font-mono text-foreground">₹{financeData.cost_per_acre.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total investment</span>
                    <span className="font-mono text-foreground">₹{financeData.total_investment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>KCC loan (80%)</span>
                    <span className="font-mono text-foreground">₹{financeData.kcc_loan_amount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between font-bold">
                    <span>Net after subsidy</span>
                    <span className="font-mono gradient-text">₹{financeData.net_cost_after_subsidy.toLocaleString()}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/30 border border-border p-3 text-sm flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-accent" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">KCC loan · 4% pa · 12mo</div>
                    <div className="font-mono">EMI <span className="font-bold">₹{financeData.monthly_emi.toLocaleString()}/mo</span></div>
                  </div>
                </div>
                {financeData.schemes_found > 0 && (
                  <div className="mt-3 text-xs text-accent font-semibold">{financeData.schemes_found} govt schemes matched</div>
                )}
              </>
            )}
          </motion.div>

          {/* Scheme finder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            className="neon-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-accent" />
              <div>
                <div className="font-mono text-xs text-accent uppercase tracking-widest">Scheme finder · 4 matches</div>
                <h2 className="font-display text-xl font-bold">Govt money you qualify for</h2>
              </div>
            </div>
            <div className="space-y-2">
              {schemes.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.06 }}
                  className="rounded-xl border border-border bg-muted/20 p-3 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{s.name}</span>
                    <span className="font-display font-bold text-accent text-sm">{s.amt}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{s.for}</span>
                    <span className="font-mono">{s.deadline}</span>
                  </div>
                  <button className="mt-2 text-[11px] text-accent flex items-center gap-1 hover:underline">
                    Apply now <ExternalLink className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border text-xs text-center">
              <span className="text-muted-foreground">You're leaving </span>
              <span className="font-display font-bold text-accent">₹57,000</span>
              <span className="text-muted-foreground"> on the table this season.</span>
            </div>
          </motion.div>
        </div>

        {/* Marketplace listing form preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
          className="neon-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-xs text-secondary uppercase tracking-widest">Module 02 · Marketplace · Blockchain escrow</div>
              <h2 className="font-display text-xl font-bold mt-1">List my crop</h2>
            </div>
            <button className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold shadow-neon-cyan flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> New listing
            </button>
          </div>

          <div className="grid lg:grid-cols-[1fr_240px] gap-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { l: "Crop",          v: "Tomato",          h: "20 supported crops" },
                { l: "Quantity",      v: "2,000 kg",        h: "Tonnes or kg"       },
                { l: "Quality grade", v: "A · firm + red",  h: "Visual guide in-app" },
                { l: "Harvest date",  v: "Nov 28, 2025",    h: "± 2 days"           },
                { l: "Asking price",  v: "₹22 / kg",        h: "Market avg ₹19"     },
                { l: "GPS",           v: "11.7° N, 79.7° E", h: "Auto-fetched"      },
              ].map((f) => (
                <div key={f.l} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{f.l}</div>
                  <div className="font-display text-base font-bold mt-1">{f.v}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{f.h}</div>
                </div>
              ))}
              <div className="sm:col-span-2 rounded-xl border border-dashed border-border bg-muted/10 p-4 flex items-center gap-3">
                <Camera className="w-5 h-5 text-secondary" />
                <span className="text-sm text-muted-foreground">Photos · 3 / 3 uploaded → IPFS via Web3.Storage</span>
                <div className="ml-auto flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded bg-gradient-to-br from-primary/30 to-secondary/30 ring-1 ring-primary/30" />
                  ))}
                </div>
              </div>
            </div>

            {/* QR + provenance */}
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 flex flex-col items-center text-center">
              <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">Provenance QR</div>
              <QRBlock size={120} />
              <div className="font-mono text-[10px] text-muted-foreground mt-3 break-all">
                0xA17b…f29D
              </div>
              <a className="mt-2 text-[11px] text-primary flex items-center gap-1 hover:underline">
                View on Etherscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Active listings */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Your active listings</div>
            <div className="grid sm:grid-cols-2 gap-3">
              {myListings.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-2">No active listings yet.</p>
              ) : (
                myListings.map((l: any) => (
                  <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors">
                    <Package className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <div className="font-semibold">{l.crop_type} · {l.quantity_kg}kg · Grade {l.quality_grade}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{l.status.toUpperCase()} · {l.district}</div>
                    </div>
                    <div className="font-display text-lg font-bold text-glow-lime">₹{l.asking_price}/kg</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile bottom nav (per spec) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/80 border-t border-border">
        <div className="grid grid-cols-4">
          {[
            { i: Home,       l: "Home"     },
            { i: BookOpen,   l: "Advisory" },
            { i: TrendingUp, l: "Market"   },
            { i: IndianRupee, l: "Finance" },
          ].map((n, i) => (
            <button
              key={n.l}
              className={`flex flex-col items-center py-3 text-[10px] font-mono ${
                i === 0 ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <n.i className="w-5 h-5 mb-1" />
              {n.l}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default FarmerPortal;
