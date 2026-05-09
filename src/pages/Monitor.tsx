import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { IndiaMap } from "@/components/IndiaMap";
import {
  AlertOctagon,
  CheckCircle2,
  Download,
  Filter,
  Lock,
  Map as MapIcon,
  Sprout,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid,
  Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { monitor } from "../api";
import { getAuth, clearAuth } from "../store/auth";

// ── Static fallback data (shown when DB is empty / demo mode) ──────────────
const staticTxVolume = [
  { d: "Mon", v: 124 }, { d: "Tue", v: 188 }, { d: "Wed", v: 162 },
  { d: "Thu", v: 240 }, { d: "Fri", v: 312 }, { d: "Sat", v: 280 }, { d: "Sun", v: 198 },
];

const staticStateData = [
  { s: "TN", v: 184 }, { s: "KA", v: 162 }, { s: "MH", v: 142 },
  { s: "AP", v: 121 }, { s: "GJ", v: 96  }, { s: "PB", v: 78  }, { s: "UP", v: 64  },
];

const staticTxTable = [
  { hash: "0x9f3a4c8b…e24f", farmer: "F-1042", merchant: "M-0218", amount: "₹44,000",    time: "12:42:08", status: "RELEASED" },
  { hash: "0x7b1e29d4…a118", farmer: "F-0987", merchant: "M-0431", amount: "₹1,28,500",  time: "12:39:51", status: "ESCROW"   },
  { hash: "0x2c8f15a7…d903", farmer: "F-2310", merchant: "M-0218", amount: "₹86,200",    time: "12:34:17", status: "RELEASED" },
  { hash: "0x4e7a91b3…f602", farmer: "F-1188", merchant: "M-0577", amount: "₹3,12,000",  time: "12:28:44", status: "DISPUTE"  },
  { hash: "0x8a2f76c5…b914", farmer: "F-2871", merchant: "M-0144", amount: "₹52,800",    time: "12:21:09", status: "RELEASED" },
];

const fraudFlags = [
  { sev: "HIGH", msg: "Same wallet → 4 farmer accounts (Punjab)",        time: "8m ago"  },
  { sev: "MED",  msg: "Onion price 38% below regional median (Nashik)",  time: "23m ago" },
  { sev: "LOW",  msg: "Identical IP for 3 merchant logins",              time: "1h ago"  },
];

const subsidies = [
  { state: "TN", name: "PM-KISAN",        disbursed: 78, unclaimed: 22 },
  { state: "KA", name: "PMKSY drip",      disbursed: 64, unclaimed: 36 },
  { state: "MH", name: "Crop insurance",  disbursed: 82, unclaimed: 18 },
  { state: "GJ", name: "Cotton subsidy",  disbursed: 51, unclaimed: 49 },
  { state: "PB", name: "MSP procurement", disbursed: 91, unclaimed: 9  },
];

const districtRegistrations = [
  { d: "Cuddalore", c: 4218 },
  { d: "Mysore",    c: 3964 },
  { d: "Nashik",    c: 3712 },
  { d: "Warangal",  c: 2891 },
  { d: "Junagadh",  c: 2410 },
];

const cropHealth = [
  { dist: "Cuddalore, TN", crop: "Paddy",     status: "Cyclone risk", sev: "destructive" },
  { dist: "Nashik, MH",    crop: "Onion",     status: "Fungal alert", sev: "accent"      },
  { dist: "Junagadh, GJ",  crop: "Groundnut", status: "Healthy",      sev: "primary"     },
  { dist: "Karnal, HR",    crop: "Wheat",     status: "Water stress", sev: "accent"      },
];

const sevColor = (s: string) =>
  s === "HIGH" ? "destructive" : s === "MED" ? "accent" : "secondary";

// ── Helper: build chart data from live transactions ────────────────────────
const buildVolumeChart = (txList: any[]) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const counts: Record<string, number> = {};
  days.forEach((d) => (counts[d] = 0));
  txList.forEach((t) => {
    if (t.created_at) {
      const day = days[new Date(t.created_at).getDay()];
      counts[day] = (counts[day] || 0) + 1;
    }
  });
  return days.map((d) => ({ d, v: counts[d] }));
};

const buildStateChart = (listingList: any[]) => {
  const counts: Record<string, number> = {};
  listingList.forEach((l) => {
    const s = (l.state || "XX").slice(0, 2).toUpperCase();
    counts[s] = (counts[s] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([s, v]) => ({ s, v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 7);
};

const MonitorPortal = () => {
  const navigate = useNavigate();
  const user     = getAuth();

  // ── Auth guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== "monitor") navigate("/login");
  }, []);

  // ── State ──────────────────────────────────────────────────────────────
  const [overview,      setOverview]      = useState<any>(null);
  const [transactions,  setTransactions]  = useState<any[]>([]);
  const [liveListings,  setLiveListings]  = useState<any[]>([]);
  const [dataReady,     setDataReady]     = useState(false);

  // Derived chart data
  const volumeChart = transactions.length > 0
    ? buildVolumeChart(transactions)
    : staticTxVolume;

  const stateChart = liveListings.length > 0
    ? buildStateChart(liveListings)
    : staticStateData;

  const displayTx   = transactions.length > 0 ? transactions : staticTxTable;
  const isLive      = dataReady && transactions.length > 0;

  // ── Fetch on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      monitor.getOverview(),
      monitor.getTransactions(),
      monitor.getListings(),
    ])
      .then(([ov, tx, li]: any[]) => {
        setOverview(ov);
        setTransactions(tx.transactions || []);
        setLiveListings(li.listings     || []);
      })
      .catch(console.error)
      .finally(() => setDataReady(true));
  }, []);

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  // ── Export CSV ─────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = [
      ["Tx ID / Hash", "Farmer", "Merchant", "Amount", "Time", "Status"],
      ...displayTx.map((t: any) => [
        t.transaction_id || t.hash,
        t.farmer_name    || t.farmer,
        t.merchant_name  || t.merchant,
        t.amount         || `₹${((t.agreed_price||0)*(t.quantity_kg||0)).toFixed(0)}`,
        t.created_at     ? new Date(t.created_at).toLocaleString() : t.time,
        t.status,
      ]),
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "agrichain_transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="container mx-auto px-6 pt-28 pb-16">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="font-mono text-xs text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Monitor · Restricted access · /monitor
            </div>
            <h1 className="font-display text-4xl font-bold">
              National <span className="gradient-text-amber">Telemetry</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono text-primary">
              <ShieldCheck className="w-3.5 h-3.5" /> JWT Active
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/50 text-xs font-mono text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${isLive ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
              {isLive ? "LIVE" : "DEMO"}
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-xs font-mono hover:bg-destructive hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </motion.div>

        {/* ── KPI cards (live data) ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              l: "Total transactions",
              v: overview ? String(overview.total_transactions) : "…",
              d: isLive ? "from DB" : "loading",
              c: "primary",
            },
            {
              l: "Active farmers",
              v: overview ? overview.total_farmers.toLocaleString() : "…",
              d: isLive ? "+live" : "loading",
              c: "secondary",
            },
            {
              l: "Trade vol · total",
              v: overview
                ? `₹${(overview.total_transaction_value / 100000).toFixed(1)}L`
                : "…",
              d: "completed trades",
              c: "accent",
            },
            {
              l: "Completed trades",
              v: overview ? String(overview.completed_transactions) : "…",
              d: `of ${overview?.total_transactions || 0} total`,
              c: "primary",
            },
          ].map((k, i) => (
            <motion.div
              key={k.l}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="neon-card p-5"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{k.l}</div>
              <div className={`font-display text-3xl font-bold mt-2 text-${k.c}`}>{k.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.d}</div>
            </motion.div>
          ))}
        </div>

        {/* ── India map + crop health ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="neon-card p-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-primary" />
                <span className="font-display font-bold">Geographic distribution · district-level</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Tx density
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive" /> Cyclone
                </span>
              </div>
            </div>
            <div className="h-[420px]">
              <IndiaMap />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="neon-card p-6"
          >
            {/* Crop health alerts (static — weather API integration future) */}
            <div className="flex items-center gap-2 mb-4">
              <Sprout className="w-4 h-4 text-primary" />
              <span className="font-display font-bold">Crop health alerts</span>
            </div>
            <div className="space-y-2.5">
              {cropHealth.map((c) => (
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

            {/* Top districts — live listing count if available */}
            <div className="mt-5 pt-5 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-secondary" />
                <span className="font-display font-bold text-sm">
                  {liveListings.length > 0 ? "Top districts · live" : "Top districts · demo"}
                </span>
              </div>
              <div className="space-y-2">
                {districtRegistrations.map((d) => {
                  const max = Math.max(...districtRegistrations.map((x) => x.c));
                  return (
                    <div key={d.d}>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span>{d.d}</span>
                        <span className="font-mono text-secondary">{d.c.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(d.c / max) * 100}%` }}
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

        {/* ── Charts (live data when available) ───────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="neon-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-display font-bold">
                Transaction volume · 7d
                {isLive && <span className="text-[10px] text-primary font-mono ml-2">LIVE</span>}
              </span>
            </div>
            <div className="h-56">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="neon-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_hsl(var(--secondary))]" />
              <span className="font-display font-bold">
                Listings by state
                {liveListings.length > 0 && <span className="text-[10px] text-secondary font-mono ml-2">LIVE</span>}
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={stateChart}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="s" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.3)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="v" fill="hsl(168 100% 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* ── Subsidy disbursement (static data) ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="neon-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span className="font-display font-bold">
                Subsidy disbursement · state-wise · SubsidyVerification.sol
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">vs eligibility</span>
          </div>
          <div className="space-y-4">
            {subsidies.map((s, i) => (
              <motion.div
                key={s.state + s.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.05 }}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-secondary w-8">{s.state}</span>
                    <span className="font-semibold">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-primary">{s.disbursed}% disbursed</span>
                    <span className="text-accent">{s.unclaimed}% unclaimed</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.disbursed}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-primary shadow-neon-lime"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.unclaimed}%` }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="h-full bg-accent/60"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Tx audit table + fraud detector ─────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Live transaction table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="neon-card p-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-bold">
                Blockchain audit · {isLive ? "live" : "demo"}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">SEPOLIA</span>
                <button className="text-[10px] font-mono px-2 py-1 rounded border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Filter
                </button>
                <button
                  onClick={handleExportCSV}
                  className="text-[10px] font-mono px-2 py-1 rounded border border-primary/40 bg-primary/5 text-primary flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase text-muted-foreground tracking-widest">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Tx ID / Hash</th>
                    <th className="text-left py-2 font-medium">Farmer</th>
                    <th className="text-left py-2 font-medium">Merchant</th>
                    <th className="text-right py-2 font-medium">Amount</th>
                    <th className="text-right py-2 font-medium">Time</th>
                    <th className="text-right py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {displayTx.map((t: any, idx: number) => {
                    const txId     = t.transaction_id || t.hash || "";
                    const farmer   = t.farmer_name    || t.farmer   || "—";
                    const merchant = t.merchant_name  || t.merchant || "—";
                    const amount   = t.amount
                      ? String(t.amount)
                      : t.agreed_price
                      ? `₹${(t.agreed_price * (t.quantity_kg || 1)).toLocaleString()}`
                      : "—";
                    const time     = t.created_at
                      ? new Date(t.created_at).toLocaleTimeString()
                      : t.time || "—";
                    const status   = (t.status || "pending").toUpperCase();

                    return (
                      <tr key={txId || idx} className="border-b border-border/40 hover:bg-muted/20">
                        <td className="py-3 text-primary text-xs">
                          {txId.length > 20 ? txId.slice(0, 14) + "…" : txId}
                        </td>
                        <td className="py-3 text-foreground/80 text-xs">{farmer}</td>
                        <td className="py-3 text-foreground/80 text-xs">{merchant}</td>
                        <td className="py-3 text-right text-xs">{amount}</td>
                        <td className="py-3 text-right text-muted-foreground text-xs">{time}</td>
                        <td className="py-3 text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            status === "COMPLETED" || status === "RELEASED"
                              ? "border-primary/40 text-primary bg-primary/10"
                              : status === "PENDING" || status === "ESCROW" || status === "CONFIRMED"
                              ? "border-secondary/40 text-secondary bg-secondary/10"
                              : "border-destructive/40 text-destructive bg-destructive/10"
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Empty state */}
              {dataReady && transactions.length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-6 font-mono">
                  No real transactions yet — showing demo data above
                </div>
              )}
            </div>
          </motion.div>

          {/* AI fraud detector (static — future ML integration) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="neon-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertOctagon className="w-4 h-4 text-destructive" />
              <span className="font-display font-bold">AI fraud detector</span>
            </div>
            <div className="space-y-3">
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

            {/* Live summary stats */}
            {overview && (
              <div className="mt-5 pt-5 border-t border-border space-y-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                  Live summary
                </div>
                {[
                  { l: "Total farmers",   v: overview.total_farmers   },
                  { l: "Total merchants", v: overview.total_merchants  },
                  { l: "Total listings",  v: overview.total_listings   },
                  { l: "Total txns",      v: overview.total_transactions },
                ].map((s) => (
                  <div key={s.l} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{s.l}</span>
                    <span className="font-mono text-foreground font-semibold">{s.v}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default MonitorPortal;