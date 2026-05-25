import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { IndiaMap } from "@/components/IndiaMap";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTranslation, translateBatch } from "../i18n/useTranslation";
import {
  Activity, AlertOctagon, BarChart3, CheckCircle2,
  Download, Filter, Lock, Map as MapIcon,
  RefreshCw, Shield, ShieldCheck, Sprout,
  TrendingUp, Users,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Area, AreaChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { monitor } from "../api";
import { getAuth, clearAuth } from "../store/auth";

// ── Static fallback data ──────────────────────────────────────────────────
const staticTxVolume = [
  { d: "Mon", v: 124 }, { d: "Tue", v: 188 }, { d: "Wed", v: 162 },
  { d: "Thu", v: 240 }, { d: "Fri", v: 312 }, { d: "Sat", v: 280 }, { d: "Sun", v: 198 },
];
const staticStateData = [
  { s: "TN", v: 184 }, { s: "KA", v: 162 }, { s: "MH", v: 142 },
  { s: "AP", v: 121 }, { s: "GJ", v: 96  }, { s: "PB", v: 78  }, { s: "UP", v: 64  },
];
const staticTxTable = [
  { hash: "0x9f3a4c8b…e24f", farmer: "F-1042", merchant: "M-0218", amount: "₹44,000",   time: "12:42:08", status: "RELEASED" },
  { hash: "0x7b1e29d4…a118", farmer: "F-0987", merchant: "M-0431", amount: "₹1,28,500", time: "12:39:51", status: "ESCROW"   },
  { hash: "0x2c8f15a7…d903", farmer: "F-2310", merchant: "M-0218", amount: "₹86,200",   time: "12:34:17", status: "RELEASED" },
  { hash: "0x4e7a91b3…f602", farmer: "F-1188", merchant: "M-0577", amount: "₹3,12,000", time: "12:28:44", status: "DISPUTE"  },
  { hash: "0x8a2f76c5…b914", farmer: "F-2871", merchant: "M-0144", amount: "₹52,800",   time: "12:21:09", status: "RELEASED" },
];
const fraudFlags = [
  { sev: "HIGH", msg: "Same wallet → 4 farmer accounts (Punjab)",       time: "8m ago"  },
  { sev: "MED",  msg: "Onion price 38% below regional median (Nashik)", time: "23m ago" },
  { sev: "LOW",  msg: "Identical IP for 3 merchant logins",             time: "1h ago"  },
];
const subsidies = [
  { state: "TN", name: "PM-KISAN",        disbursed: 78, unclaimed: 22 },
  { state: "KA", name: "PMKSY drip",      disbursed: 64, unclaimed: 36 },
  { state: "MH", name: "Crop insurance",  disbursed: 82, unclaimed: 18 },
  { state: "GJ", name: "Cotton subsidy",  disbursed: 51, unclaimed: 49 },
  { state: "PB", name: "MSP procurement", disbursed: 91, unclaimed: 9  },
];
const districtRegistrations = [
  { d: "Cuddalore", c: 4218 }, { d: "Mysore",    c: 3964 },
  { d: "Nashik",    c: 3712 }, { d: "Warangal",  c: 2891 },
  { d: "Junagadh",  c: 2410 },
];
const cropHealth = [
  { dist: "Cuddalore, TN", crop: "Paddy",     status: "Cyclone risk", sev: "destructive" },
  { dist: "Nashik, MH",    crop: "Onion",     status: "Fungal alert", sev: "accent"      },
  { dist: "Junagadh, GJ",  crop: "Groundnut", status: "Healthy",      sev: "primary"     },
  { dist: "Karnal, HR",    crop: "Wheat",     status: "Water stress", sev: "accent"      },
];
const CHART_COLORS = [
  "hsl(142 100% 60%)", "hsl(168 100% 55%)", "hsl(200 100% 60%)",
  "hsl(250 100% 70%)", "hsl(320 100% 65%)", "hsl(30 100% 60%)", "hsl(60 100% 60%)",
];

const sevColor    = (s: string) => s === "HIGH" ? "destructive" : s === "MED" ? "accent" : "secondary";
const statusColor = (s: string) =>
  s === "completed" || s === "RELEASED"
    ? "border-primary/40 text-primary bg-primary/10"
    : s === "confirmed" || s === "ESCROW" || s === "pending"
    ? "border-secondary/40 text-secondary bg-secondary/10"
    : "border-destructive/40 text-destructive bg-destructive/10";

const buildVolumeChart = (txList: any[]) => {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const counts: Record<string, number> = {};
  days.forEach(d => (counts[d] = 0));
  txList.forEach(t => {
    if (t.created_at) {
      const day = days[new Date(t.created_at).getDay()];
      counts[day] = (counts[day] || 0) + 1;
    }
  });
  return days.map(d => ({ d, v: counts[d] }));
};
const buildStateChart = (listingList: any[]) => {
  const counts: Record<string, number> = {};
  listingList.forEach(l => {
    const s = (l.state || "XX").slice(0, 2).toUpperCase();
    counts[s] = (counts[s] || 0) + 1;
  });
  return Object.entries(counts).map(([s, v]) => ({ s, v }))
    .sort((a, b) => b.v - a.v).slice(0, 7);
};

type Section = "overview" | "transactions" | "listings" | "audit" | "analytics";

// ─────────────────────────────────────────────────────────────────────────
const MonitorPortal = () => {
  const navigate = useNavigate();
  const user     = getAuth();

  useEffect(() => {
    if (!user || user.role !== "monitor") navigate("/login");
  }, []);

  // ── Language via hook ─────────────────────────────────────────────────
  const { lang, changeLang, isTranslating, setIsTranslating } = useTranslation();
  const [uiText, setUiText] = useState<Record<string, string>>({});

  // ── Data state ────────────────────────────────────────────────────────
  const [overview,     setOverview]     = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [liveListings, setLiveListings] = useState<any[]>([]);
  const [auditLog,     setAuditLog]     = useState<any[]>([]);
  const [dataReady,    setDataReady]    = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState(new Date().toLocaleTimeString());
  const [txFilter,     setTxFilter]     = useState("all");
  const [activeSection, setActiveSection] = useState<Section>("overview");

  const volumeChart = transactions.length > 0 ? buildVolumeChart(transactions) : staticTxVolume;
  const stateChart  = liveListings.length  > 0 ? buildStateChart(liveListings)  : staticStateData;
  const displayTx   = transactions.length > 0 ? transactions : staticTxTable;
  const isLive      = dataReady && transactions.length > 0;

  const filteredTx = txFilter === "all"
    ? displayTx
    : displayTx.filter((t: any) => (t.status||"").toLowerCase() === txFilter);

  // ── Fetch data ────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, tx, li, al] = await Promise.allSettled([
        monitor.getOverview()     as Promise<any>,
        monitor.getTransactions() as Promise<any>,
        monitor.getListings()     as Promise<any>,
        monitor.getAuditLog()     as Promise<any>,
      ]);
      if (ov.status === "fulfilled" && ov.value) setOverview(ov.value);
      if (tx.status === "fulfilled" && tx.value?.transactions?.length) setTransactions(tx.value.transactions);
      if (li.status === "fulfilled" && li.value?.listings?.length)     setLiveListings(li.value.listings);
      if (al.status === "fulfilled" && al.value?.audit_log?.length)    setAuditLog(al.value.audit_log);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch { /* use static */ }
    finally { setLoading(false); setDataReady(true); }
  };

  useEffect(() => { fetchData(); }, []);

  // ── FULL PAGE TRANSLATION via Groq ────────────────────────────────────
  const handleLangChange = async (newLang: string) => {
    changeLang(newLang);
    if (newLang === "english") { setUiText({}); return; }
    setIsTranslating(true);
    try {
      const ui = await translateBatch({
        portalTitle:       "National Telemetry",
        restrictedAccess:  "Monitor · Restricted access",
        logout:            "Logout",
        refresh:           "Refresh",
        exportCsv:         "Export CSV",
        lastUpdated:       "Last updated",
        liveLabel:         "LIVE",
        demoLabel:         "DEMO",
        jwtActive:         "JWT Active",
        // Sidebar
        overview:          "Overview",
        transactions:      "Transactions",
        listings:          "Listings",
        auditLog:          "Audit Log",
        analytics:         "Analytics",
        // KPIs
        totalTransactions: "Total transactions",
        activeFarmers:     "Active farmers",
        tradeVolume:       "Trade vol · total",
        completedTrades:   "Completed trades",
        totalMerchants:    "Total merchants",
        totalListings:     "Total listings",
        pendingTrades:     "Pending trades",
        platformHealth:    "Platform health",
        // Sections
        geoDistribution:   "Geographic distribution · district-level",
        cropHealthAlerts:  "Crop health alerts",
        topDistricts:      "Top districts",
        txVolume7d:        "Transaction volume · 7d",
        listingsByState:   "Listings by state",
        subsidyTitle:      "Subsidy disbursement · state-wise",
        blockchainAudit:   "Blockchain audit",
        fraudDetector:     "AI fraud detector",
        liveSummary:       "Live summary",
        // Table headers
        txHash:            "Tx ID / Hash",
        farmer:            "Farmer",
        merchant:          "Merchant",
        amount:            "Amount",
        time:              "Time",
        status:            "Status",
        // Filter labels
        allFilter:         "All",
        pendingFilter:     "Pending",
        confirmedFilter:   "Confirmed",
        completedFilter:   "Completed",
        // Misc
        noTransactions:    "No real transactions yet — showing demo data",
        filter:            "Filter",
        disbursed:         "disbursed",
        unclaimed:         "unclaimed",
        fromDB:            "from DB",
        completedOf:       "completed trades",
        // Analytics
        monthlyVolume:     "Monthly Trade Volume (₹L)",
        cropDist:          "Crop Distribution %",
        priceAlerts:       "Price Alerts",
        diseaseAlerts:     "Disease Alerts",
        groundwaterAlerts: "Groundwater Alerts",
      }, newLang);
      setUiText(ui);
    } catch (err) { console.error("Translation error:", err); }
    finally { setIsTranslating(false); }
  };

  const tx = (key: string, fallback: string) => uiText[key] || fallback;

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  const handleExportCSV = () => {
    const rows = [
      ["Tx ID / Hash","Farmer","Merchant","Amount","Time","Status"],
      ...displayTx.map((t: any) => [
        t.transaction_id||t.hash,
        t.farmer_name||t.farmer,
        t.merchant_name||t.merchant,
        t.amount||`₹${((t.agreed_price||0)*(t.quantity_kg||0)).toFixed(0)}`,
        t.created_at ? new Date(t.created_at).toLocaleString() : t.time,
        t.status,
      ]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "agrichain_transactions.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const sidebarNav = [
    { id: "overview",     label: tx("overview",     "Overview"),      icon: BarChart3   },
    { id: "transactions", label: tx("transactions", "Transactions"),  icon: Activity    },
    { id: "listings",     label: tx("listings",     "Listings"),      icon: Sprout      },
    { id: "audit",        label: tx("auditLog",     "Audit Log"),     icon: Shield      },
    { id: "analytics",   label: tx("analytics",    "Analytics"),     icon: TrendingUp  },
  ];

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-6 pt-28 pb-16">

        {/* ━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="font-mono text-xs text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
              <Lock className="w-3 h-3" /> {tx("restrictedAccess","Monitor · Restricted access")}
            </div>
            <h1 className="font-display text-4xl font-bold">
              National <span className="gradient-text-amber">{tx("portalTitle","Telemetry")}</span>
            </h1>
            <div className="mt-1 text-xs font-mono text-muted-foreground">
              {tx("lastUpdated","Last updated")}: {lastUpdated}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary">
              <ShieldCheck className="w-3.5 h-3.5" /> {tx("jwtActive","JWT Active")}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs font-mono text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${isLive ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
              {isLive ? tx("liveLabel","LIVE") : tx("demoLabel","DEMO")}
            </div>
            <button
              onClick={fetchData} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs font-mono text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {tx("refresh","Refresh")}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/5 text-primary text-xs font-mono hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {tx("exportCsv","Export CSV")}
            </button>
            {/* Language selector — full page translation */}
            <LanguageSelector
              value={lang}
              onChange={handleLangChange}
              isTranslating={isTranslating}
            />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-xs font-mono hover:bg-destructive hover:text-white transition-colors"
            >
              {tx("logout","Logout")}
            </button>
          </div>
        </motion.div>

        {/* ━━ KPI CARDS (LIVE) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { l: tx("totalTransactions","Total transactions"), v: overview ? String(overview.total_transactions)    : "…", c: "primary"   },
            { l: tx("activeFarmers",    "Active farmers"),     v: overview ? overview.total_farmers?.toLocaleString(): "…", c: "secondary" },
            { l: tx("tradeVolume",      "Trade vol · total"),  v: overview ? `₹${((overview.total_transaction_value||0)/100000).toFixed(1)}L` : "…", c: "accent" },
            { l: tx("completedTrades",  "Completed trades"),   v: overview ? String(overview.completed_transactions) : "…", c: "primary"   },
          ].map((k, i) => (
            <motion.div key={k.l}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="neon-card p-5"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{k.l}</div>
              <div className={`font-display text-3xl font-bold mt-2 text-${k.c}`}>{k.v}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[200px_1fr] gap-6">

          {/* ━━ SIDEBAR — working tabs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="neon-card p-3 h-fit sticky top-24"
          >
            {sidebarNav.map(n => (
              <button key={n.id}
                onClick={() => setActiveSection(n.id as Section)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeSection === n.id
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <n.icon className="w-4 h-4" />
                {n.label}
              </button>
            ))}

            {/* Live summary in sidebar */}
            {overview && (
              <div className="mt-4 pt-4 border-t border-border px-3">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                  {tx("liveSummary","Live summary")}
                </div>
                {[
                  { l: tx("activeFarmers","Farmers"),      v: overview.total_farmers    },
                  { l: tx("totalMerchants","Merchants"),   v: overview.total_merchants  },
                  { l: tx("totalListings","Listings"),     v: overview.total_listings   },
                  { l: tx("totalTransactions","Txns"),     v: overview.total_transactions },
                ].map(s => (
                  <div key={s.l} className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{s.l}</span>
                    <span className="font-mono font-semibold">{s.v}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.aside>

          {/* ━━ MAIN CONTENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div>

            {/* ── OVERVIEW section ────────────────────────────────────── */}
            {activeSection === "overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                {/* India Map + Crop Health */}
                <div className="grid lg:grid-cols-3 gap-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }} className="neon-card p-6 lg:col-span-2"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4 text-primary" />
                        <span className="font-display font-bold">{tx("geoDistribution","Geographic distribution · district-level")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Tx density</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Cyclone</span>
                      </div>
                    </div>
                    <div className="h-[380px]"><IndiaMap /></div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }} className="neon-card p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Sprout className="w-4 h-4 text-primary" />
                      <span className="font-display font-bold">{tx("cropHealthAlerts","Crop health alerts")}</span>
                    </div>
                    <div className="space-y-2.5">
                      {cropHealth.map(c => (
                        <div key={c.dist} className={`rounded-xl border border-${c.sev}/30 bg-${c.sev}/5 p-3`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold">{c.crop}</span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-${c.sev}/15 text-${c.sev} border border-${c.sev}/30`}>
                              {c.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">{c.dist}</div>
                        </div>
                      ))}
                    </div>

                    {/* Top districts */}
                    <div className="mt-5 pt-5 border-t border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-secondary" />
                        <span className="font-display font-bold text-sm">
                          {tx("topDistricts","Top districts")} {liveListings.length > 0 ? "· live" : "· demo"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {districtRegistrations.map(d => {
                          const max = Math.max(...districtRegistrations.map(x => x.c));
                          return (
                            <div key={d.d}>
                              <div className="flex justify-between text-[11px] mb-0.5">
                                <span>{d.d}</span>
                                <span className="font-mono text-secondary">{d.c.toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(d.c/max)*100}%` }}
                                  transition={{ duration: 1, delay: 0.4 }}
                                  className="h-full bg-gradient-to-r from-secondary to-primary shadow-neon-cyan"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }} className="neon-card p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-display font-bold">
                        {tx("txVolume7d","Transaction volume · 7d")}
                        {isLive && <span className="text-[10px] text-primary font-mono ml-2">LIVE</span>}
                      </span>
                    </div>
                    <div className="h-52">
                      <ResponsiveContainer>
                        <LineChart data={volumeChart}>
                          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
                          <XAxis dataKey="d" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                          <Line type="monotone" dataKey="v" stroke="hsl(142 100% 60%)" strokeWidth={2.5} dot={{ fill: "hsl(142 100% 60%)", r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }} className="neon-card p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_hsl(var(--secondary))]" />
                      <span className="font-display font-bold">
                        {tx("listingsByState","Listings by state")}
                        {liveListings.length > 0 && <span className="text-[10px] text-secondary font-mono ml-2">LIVE</span>}
                      </span>
                    </div>
                    <div className="h-52">
                      <ResponsiveContainer>
                        <BarChart data={stateChart}>
                          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                          <XAxis dataKey="s" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.3)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                          <Bar dataKey="v" fill="hsl(168 100% 55%)" radius={[6,6,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>

                {/* Subsidy disbursement */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }} className="neon-card p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span className="font-display font-bold">{tx("subsidyTitle","Subsidy disbursement · state-wise · SubsidyVerification.sol")}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">vs eligibility</span>
                  </div>
                  <div className="space-y-4">
                    {subsidies.map((s, i) => (
                      <motion.div key={s.state+s.name}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.55 + i * 0.05 }}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-secondary w-8">{s.state}</span>
                            <span className="font-semibold">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-primary">{s.disbursed}% {tx("disbursed","disbursed")}</span>
                            <span className="text-accent">{s.unclaimed}% {tx("unclaimed","unclaimed")}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.disbursed}%` }}
                            transition={{ duration: 1, delay: 0.6 }}
                            className="h-full bg-primary shadow-neon-lime"
                          />
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.unclaimed}%` }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="h-full bg-accent/60"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ── TRANSACTIONS section ─────────────────────────────────── */}
            {activeSection === "transactions" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold">
                    {tx("transactions","Transactions")}
                    <span className="text-xs font-mono text-muted-foreground ml-2">· {filteredTx.length}</span>
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["all","pending","confirmed","completed"].map(f => (
                      <button key={f} onClick={() => setTxFilter(f)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          txFilter === f
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        {f === "all" ? tx("allFilter","All") :
                         f === "pending" ? tx("pendingFilter","Pending") :
                         f === "confirmed" ? tx("confirmedFilter","Confirmed") :
                         tx("completedFilter","Completed")}
                      </button>
                    ))}
                    <button onClick={handleExportCSV}
                      className="text-xs px-3 py-1 rounded-full border border-primary/40 bg-primary/5 text-primary flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Download className="w-3 h-3" /> {tx("exportCsv","Export CSV")}
                    </button>
                  </div>
                </div>

                <div className="neon-card overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-border bg-muted/20 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    <span>{tx("txHash","Tx ID / Hash")}</span>
                    <span>{tx("farmer","Farmer")}</span>
                    <span>{tx("merchant","Merchant")}</span>
                    <span>{tx("amount","Amount")}</span>
                    <span>{tx("time","Time")}</span>
                    <span>{tx("status","Status")}</span>
                  </div>
                  {/* Table rows */}
                  <div className="divide-y divide-border">
                    {filteredTx.map((t: any, idx: number) => {
                      const txId     = t.transaction_id||t.hash||"";
                      const farmer   = t.farmer_name||t.farmer||"—";
                      const merchant = t.merchant_name||t.merchant||"—";
                      const amount   = t.amount ? String(t.amount) : t.agreed_price ? `₹${(t.agreed_price*(t.quantity_kg||1)).toLocaleString()}` : "—";
                      const timeStr  = t.created_at ? new Date(t.created_at).toLocaleTimeString() : t.time||"—";
                      const status   = (t.status||"pending").toUpperCase();
                      return (
                        <motion.div key={txId||idx}
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="grid grid-cols-6 gap-2 px-4 py-3 text-xs hover:bg-muted/20 transition-colors"
                        >
                          <span className="font-mono text-primary truncate">{txId.length > 14 ? txId.slice(0,14)+"…" : txId}</span>
                          <span className="text-foreground/80 truncate">{farmer}</span>
                          <span className="text-foreground/80 truncate">{merchant}</span>
                          <span className="font-display font-bold gradient-text">{amount}</span>
                          <span className="text-muted-foreground font-mono">{timeStr}</span>
                          <span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${statusColor(status)}`}>
                              {status}
                            </span>
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                  {dataReady && transactions.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs py-6 font-mono">
                      {tx("noTransactions","No real transactions yet — showing demo data")}
                    </div>
                  )}
                  {/* Footer total */}
                  <div className="px-4 py-3 border-t border-border bg-muted/10 flex justify-end text-xs font-mono">
                    <span className="font-bold gradient-text">
                      Total: ₹{filteredTx.reduce((s: number, t: any) =>
                        s + (t.agreed_price||0) * (t.quantity_kg||0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── LISTINGS section ─────────────────────────────────────── */}
            {activeSection === "listings" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="font-display text-2xl font-bold">
                  {tx("listings","Listings")}
                  <span className="text-xs font-mono text-muted-foreground ml-2">· {liveListings.length || overview?.total_listings || 0}</span>
                </h2>
                {liveListings.length === 0 ? (
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { l: "Total listings",  v: overview?.total_listings?.toLocaleString()  || "9,823",  c: "primary"   },
                      { l: "Active listings", v: overview?.active_listings?.toLocaleString() || "1,247",  c: "secondary" },
                      { l: "Farmers listing", v: overview?.total_farmers?.toLocaleString()   || "14,247", c: "accent"    },
                    ].map(s => (
                      <div key={s.l} className="neon-card p-5">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.l}</div>
                        <div className={`font-display text-3xl font-bold mt-2 text-${s.c}`}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="neon-card overflow-hidden">
                    <div className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-border bg-muted/20 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      <span>Crop</span><span>Qty</span><span>Price</span><span>District</span><span>Status</span>
                    </div>
                    <div className="divide-y divide-border">
                      {liveListings.map((l: any, i: number) => (
                        <div key={l.id||i} className="grid grid-cols-5 gap-2 px-4 py-3 text-xs hover:bg-muted/20">
                          <span className="font-semibold">{l.crop_type||"Crop"}</span>
                          <span>{l.quantity_kg}kg</span>
                          <span className="font-display font-bold gradient-text">₹{l.asking_price}/kg</span>
                          <span className="truncate">{l.district||"—"}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono w-fit ${statusColor(l.status||"pending")}`}>
                            {(l.status||"").toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── AUDIT LOG section ────────────────────────────────────── */}
            {activeSection === "audit" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold">
                    {tx("auditLog","Audit Log")}
                    <span className="text-xs font-mono text-muted-foreground ml-2">· {auditLog.length || staticTxTable.length} entries</span>
                  </h2>
                </div>
                <div className="neon-card overflow-hidden">
                  <div className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-border bg-muted/20 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    <span>{tx("txHash","Tx ID / Hash")}</span>
                    <span>{tx("farmer","Farmer")}</span>
                    <span>{tx("merchant","Merchant")}</span>
                    <span>{tx("status","Status")}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {(auditLog.length > 0 ? auditLog : staticTxTable).map((t: any, i: number) => (
                      <motion.div key={t.id||t.hash||i}
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="grid grid-cols-4 gap-2 px-4 py-3 text-xs hover:bg-muted/20 transition-colors"
                      >
                        <span className="font-mono text-primary truncate">{(t.hash||t.id||"").slice(0,14)}…</span>
                        <span className="truncate">{t.farmer||t.user||"—"}</span>
                        <span className="truncate">{t.merchant||t.details||"—"}</span>
                        <span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${statusColor(t.status||"pending")}`}>
                            {(t.status||"PENDING").toUpperCase()}
                          </span>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* AI Fraud detector */}
                <div className="neon-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertOctagon className="w-4 h-4 text-destructive" />
                    <span className="font-display font-bold">{tx("fraudDetector","AI fraud detector")}</span>
                    <span className="ml-auto text-[10px] font-mono text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Active
                    </span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    {fraudFlags.map((f, i) => {
                      const c = sevColor(f.sev);
                      return (
                        <div key={i} className={`rounded-xl border border-${c}/40 bg-${c}/5 p-3`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-${c}/15 text-${c} border border-${c}/30`}>
                              {f.sev}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{f.time}</span>
                          </div>
                          <div className="text-sm">{f.msg}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ANALYTICS section ────────────────────────────────────── */}
            {activeSection === "analytics" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="font-display text-2xl font-bold">{tx("analytics","Analytics")}</h2>

                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="neon-card p-5">
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                      {tx("txVolume7d","Transaction volume · 7d")}
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer>
                        <AreaChart data={volumeChart}>
                          <defs>
                            <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(142 100% 60%)" stopOpacity={0.6} />
                              <stop offset="100%" stopColor="hsl(142 100% 60%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="d" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                          <Area type="monotone" dataKey="v" stroke="hsl(142 100% 60%)" strokeWidth={2} fill="url(#vg)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="neon-card p-5">
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
                      {tx("listingsByState","Listings by state")}
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer>
                        <BarChart data={stateChart}>
                          <XAxis dataKey="s" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="v" radius={[4,4,0,0]}>
                            {stateChart.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Summary stats */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { l: tx("totalTransactions","Total transactions"), v: overview?.total_transactions?.toLocaleString()    || "28,456", c: "primary"   },
                    { l: tx("completedTrades",  "Completed trades"),   v: overview?.completed_transactions?.toLocaleString()|| "21,034", c: "primary"   },
                    { l: tx("pendingTrades",    "Pending trades"),     v: overview?.pending_transactions?.toLocaleString()  || "7,422",  c: "accent"    },
                    { l: tx("tradeVolume",      "Trade volume"),       v: overview ? `₹${((overview.total_transaction_value||0)/10000000).toFixed(1)}Cr` : "₹28.4Cr", c: "secondary" },
                  ].map(s => (
                    <div key={s.l} className="neon-card p-5">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.l}</div>
                      <div className={`font-display text-3xl font-bold mt-2 text-${s.c}`}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorPortal;