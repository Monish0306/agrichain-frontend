import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { MiniMap } from "@/components/MiniMap";
import { QRBlock } from "@/components/QRBlock";
import {
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Filter,
  History,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Package,
  Route,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import { marketplace } from "../api";
import { getAuth, clearAuth } from "../store/auth";

// ── Fallback static data (shown when DB is empty) ──────────────────────────
const staticListings = [
  { crop: "Tomato Grade A",     farmer: "R. Kumar", loc: "Cuddalore, TN",  qty: "2.0 t",  price: 22, trust: 94, days: 6,  grade: "A" },
  { crop: "Onion Grade B",      farmer: "S. Devi",  loc: "Nashik, MH",     qty: "5.5 t",  price: 18, trust: 88, days: 12, grade: "B" },
  { crop: "Basmati Rice",       farmer: "H. Singh", loc: "Karnal, HR",     qty: "12 t",   price: 41, trust: 97, days: 21, grade: "A" },
  { crop: "Groundnut",          farmer: "M. Patel", loc: "Junagadh, GJ",   qty: "3.2 t",  price: 65, trust: 91, days: 9,  grade: "A" },
  { crop: "Cotton Long Staple", farmer: "K. Reddy", loc: "Warangal, TS",   qty: "8 t",    price: 78, trust: 96, days: 15, grade: "A" },
  { crop: "Black Gram",         farmer: "P. Naidu", loc: "Guntur, AP",     qty: "1.8 t",  price: 92, trust: 89, days: 4,  grade: "B" },
];

const staticOrders = {
  Pending:      [{ c: "Tomato · 2t · ₹22",      f: "R. Kumar"  }],
  Confirmed:    [{ c: "Onion · 5.5t · ₹18",     f: "S. Devi"   }, { c: "Cotton · 8t · ₹78", f: "K. Reddy" }],
  "In Transit": [{ c: "Basmati · 12t · ₹41",    f: "H. Singh"  }],
  Delivered:    [{ c: "Groundnut · 3.2t · ₹65", f: "M. Patel"  }],
  Completed:    [{ c: "Black Gram · 1.8t · ₹92", f: "P. Naidu" }],
};

const escrowSteps = [
  { l: "Order placed",       s: "done"   },
  { l: "Payment escrowed",   s: "done"   },
  { l: "Crop dispatched",    s: "active" },
  { l: "Delivery confirmed", s: "todo"   },
  { l: "Payment released",   s: "todo"   },
];

const sidebar = [
  { i: LayoutDashboard, l: "Dashboard",       active: true  },
  { i: ShoppingBag,     l: "Browse Listings", active: false },
  { i: Package,         l: "My Orders",       active: false },
  { i: History,         l: "Tx History",      active: false },
  { i: BarChart3,       l: "Analytics",       active: false },
];

// ── Group transactions into kanban columns ─────────────────────────────────
const groupByStatus = (txList: any[]) => {
  const map: Record<string, { c: string; f: string }[]> = {
    Pending: [], Confirmed: [], "In Transit": [], Delivered: [], Completed: [],
  };
  txList.forEach((t) => {
    const s = t.status || "pending";
    const key =
      s === "pending"   ? "Pending"     :
      s === "confirmed" ? "Confirmed"   :
      s === "completed" ? "Completed"   : "Pending";
    if (map[key]) {
      map[key].push({
        c: `${t.listing_crop_type || "Crop"} · ₹${t.agreed_price || 0}/kg`,
        f: t.farmer_name || t.farmer_id?.slice(0, 8) || "Farmer",
      });
    }
  });
  return map;
};

const MerchantPortal = () => {
  const navigate   = useNavigate();
  const user       = getAuth();

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== "merchant") navigate("/login");
  }, []);

  // ── State ─────────────────────────────────────────────────────────────────
  const [liveListings,  setLiveListings]  = useState<any[]>([]);
  const [myOrders,      setMyOrders]      = useState<any[]>([]);
  const [listingsReady, setListingsReady] = useState(false);
  const [orderLoading,  setOrderLoading]  = useState<string | null>(null);
  const [orderSuccess,  setOrderSuccess]  = useState<string | null>(null);

  // Merchant KPIs derived from live orders
  const activeOrders     = myOrders.filter(t => t.status === "pending" || t.status === "confirmed").length;
  const completedOrders  = myOrders.filter(t => t.status === "completed");
  const totalVolume      = completedOrders.reduce((s, t) => s + (t.agreed_price || 0) * (t.quantity_kg || 0), 0);
  const kanbanOrders     = myOrders.length > 0 ? groupByStatus(myOrders) : staticOrders;

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    marketplace.getListings()
      .then((r: any) => { setLiveListings(r.listings || []); setListingsReady(true); })
      .catch(() => setListingsReady(true));

    marketplace.myOrders()
      .then((r: any) => setMyOrders(r.transactions || []))
      .catch(console.error);
  }, []);

  // ── Place order ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async (listingId: string, askingPrice: number, cropName: string) => {
    const qtyStr = prompt(`Enter quantity in kg for ${cropName} at ₹${askingPrice}/kg:`);
    const qty    = parseFloat(qtyStr || "0");
    if (!qty || qty <= 0) return;

    setOrderLoading(listingId);
    try {
      await marketplace.placeOrder(listingId, qty, askingPrice);
      setOrderSuccess(listingId);
      const updated = await marketplace.myOrders() as any;
      setMyOrders(updated.transactions || []);
      alert(`✅ Order placed! ${qty}kg of ${cropName} at ₹${askingPrice}/kg`);
    } catch (e: any) {
      alert("❌ Order failed: " + e.message);
    } finally {
      setOrderLoading(null);
    }
  };

  // ── Confirm transaction (for merchant side) ───────────────────────────────
  const handleConfirmTx = async (txId: string) => {
    try {
      await marketplace.confirmTransaction(txId);
      const updated = await marketplace.myOrders() as any;
      setMyOrders(updated.transactions || []);
      alert("✅ Transaction confirmed!");
    } catch (e: any) {
      alert("❌ Confirm failed: " + e.message);
    }
  };

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  // ── Decide which listings to display ─────────────────────────────────────
  const displayListings = listingsReady && liveListings.length > 0 ? liveListings : staticListings;
  const isLive          = listingsReady && liveListings.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="container mx-auto px-6 pt-28 pb-16">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="font-mono text-xs text-secondary uppercase tracking-widest mb-2">Merchant Portal</div>
            <h1 className="font-display text-4xl font-bold">
              <span className="gradient-text">{user?.name || "Merchant"}</span>
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> KYC verified
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-secondary" /> {user?.user_id?.slice(0, 10) || "0x71C…b3aF"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search bar */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-48"
                placeholder="Search crops, farmers…"
              />
            </div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-sm font-mono hover:bg-destructive hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </motion.div>

        {/* ── KPI cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { l: "Active orders",      v: activeOrders > 0   ? String(activeOrders) : "0",    c: "primary"   },
            { l: "Trade volume · MTD", v: totalVolume > 0     ? `₹${(totalVolume/100000).toFixed(1)}L` : "₹0", c: "secondary" },
            { l: "Total listings",     v: String(liveListings.length || 0),                   c: "accent"    },
            { l: "Disputes",           v: "0",                                                 c: "primary"   },
          ].map((k) => (
            <div key={k.l} className="neon-card p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{k.l}</div>
              <div className={`font-display text-3xl font-bold mt-2 text-${k.c}`}>{k.v}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6">

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="neon-card p-3 h-fit sticky top-24"
          >
            {sidebar.map((n) => (
              <button
                key={n.l}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  n.active
                    ? "bg-secondary/15 text-secondary border border-secondary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <n.i className="w-4 h-4" />
                {n.l}
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 px-3">Filters</div>
              {[
                { l: "Crop",    o: ["All", "Tomato", "Rice", "Cotton"] },
                { l: "Quality", o: ["A", "B", "C"] },
                { l: "State",   o: ["TN", "MH", "GJ", "TS"] },
                { l: "Price",   o: ["<₹20", "₹20–50", "₹50+"] },
              ].map((g) => (
                <div key={g.l} className="mb-4 px-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">{g.l}</div>
                  <div className="flex flex-wrap gap-1">
                    {g.o.map((o) => (
                      <button
                        key={o}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:border-secondary hover:text-secondary transition-colors"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div>

            {/* Live / Demo badge */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                Active listings
                <span className="text-xs font-mono text-muted-foreground">
                  · {displayListings.length} {isLive ? "farms (live)" : "farms (demo)"}
                </span>
              </h2>
              {!isLive && listingsReady && (
                <span className="text-[10px] font-mono text-accent border border-accent/30 bg-accent/10 px-2 py-1 rounded-full">
                  Demo data — log in as Farmer to create real listings
                </span>
              )}
            </div>

            {/* ── Listings grid ──────────────────────────────────────────── */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayListings.map((l: any, i: number) => {
                const isReal    = !!l.id;
                const cropName  = l.crop_type || l.crop || "Crop";
                const grade     = l.quality_grade || l.grade || "A";
                const price     = l.asking_price  || l.price || 0;
                const qty       = l.quantity_kg   ? `${l.quantity_kg}kg` : l.qty;
                const location  = l.district      ? `${l.district}, ${l.state}` : l.loc;
                const farmerN   = l.farmer_name   || l.farmer || "Farmer";
                const trust     = l.trust          || 90;

                return (
                  <motion.div
                    key={l.id || l.crop}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="neon-card p-4 group flex flex-col"
                  >
                    {/* Mini map */}
                    <div className="h-20 rounded-lg overflow-hidden border border-border mb-3">
                      <MiniMap label={location.split(",")[0]} />
                    </div>

                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                        grade === "A"
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-secondary/10 text-secondary border-secondary/30"
                      }`}>
                        GRADE {grade}
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-accent text-accent" />
                        <span className="font-mono text-accent">{trust}</span>
                      </div>
                    </div>

                    <div className="font-display text-base font-bold mb-1">{cropName}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3" /> {location}
                    </div>

                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="font-display text-xl font-bold gradient-text">₹{price}</div>
                        <div className="text-[10px] text-muted-foreground">/kg · {qty}</div>
                      </div>
                      {isReal ? (
                        <button
                          onClick={() => handlePlaceOrder(l.id, price, cropName)}
                          disabled={orderLoading === l.id}
                          className="text-xs px-3 py-1.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary hover:text-secondary-foreground transition-colors disabled:opacity-50"
                        >
                          {orderLoading === l.id  ? "Placing…"   :
                           orderSuccess  === l.id  ? "✓ Ordered"  : "Place Order"}
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">Demo</span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>{farmerN}</span>
                      <ExternalLink className="w-3 h-3 hover:text-primary cursor-pointer" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── My Orders section (live) ──────────────────────────────── */}
            {myOrders.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  My pending orders
                  <span className="text-xs font-mono text-muted-foreground">· {myOrders.length} total</span>
                </h2>
                <div className="space-y-3">
                  {myOrders.map((t: any) => (
                    <div key={t.transaction_id || t.id} className="neon-card p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">
                          {t.listing_crop_type || "Crop"} · {t.quantity_kg}kg · ₹{t.agreed_price}/kg
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          ID: {(t.transaction_id || t.id || "").slice(0, 16)}… · {t.status}
                        </div>
                      </div>
                      <div className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                        t.status === "completed" ? "border-primary/40 text-primary bg-primary/10" :
                        t.status === "confirmed" ? "border-secondary/40 text-secondary bg-secondary/10" :
                                                   "border-accent/40 text-accent bg-accent/10"
                      }`}>
                        {t.status?.toUpperCase()}
                      </div>
                      {t.status === "pending" && (
                        <button
                          onClick={() => handleConfirmTx(t.transaction_id || t.id)}
                          className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Escrow timeline ───────────────────────────────────────── */}
            <div className="grid lg:grid-cols-3 gap-4 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="neon-card p-5 lg:col-span-2"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="font-display font-bold">TradeEscrow.sol · Order #ORD-2418</span>
                </div>

                <div className="relative grid grid-cols-5 gap-2">
                  <div className="absolute top-4 left-[10%] right-[10%] h-px bg-border" />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "40%" }}
                    transition={{ duration: 1.2, delay: 0.6 }}
                    className="absolute top-4 left-[10%] h-px bg-gradient-to-r from-primary to-secondary shadow-neon-lime"
                  />
                  {escrowSteps.map((step, i) => (
                    <div key={step.l} className="relative flex flex-col items-center text-center">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        step.s === "done"
                          ? "bg-primary text-primary-foreground shadow-neon-lime"
                          : step.s === "active"
                          ? "bg-secondary text-secondary-foreground shadow-neon-cyan"
                          : "bg-muted border border-border text-muted-foreground"
                      }`}>
                        {step.s === "done"
                          ? <CheckCircle2 className="w-4 h-4" />
                          : <span className="text-xs font-mono">{i + 1}</span>
                        }
                      </div>
                      <div className={`text-[10px] leading-tight ${step.s === "todo" ? "text-muted-foreground" : "text-foreground"}`}>
                        {step.l}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-border grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground uppercase text-[10px]">Locked</div>
                    <div className="font-display text-lg font-bold gradient-text">₹44,000</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground uppercase text-[10px]">Tx hash</div>
                    <div className="font-mono text-primary text-[11px] truncate">0x9f3a4c…e24f</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground uppercase text-[10px]">Network</div>
                    <div className="font-mono text-secondary text-[11px]">Sepolia · #5,128,442</div>
                  </div>
                </div>
              </motion.div>

              {/* Provenance QR */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="neon-card p-5 flex flex-col items-center text-center"
              >
                <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">Crop provenance</div>
                <QRBlock size={120} />
                <div className="text-xs text-muted-foreground mt-3">CropListing.sol</div>
                <a className="mt-2 text-[11px] text-primary flex items-center gap-1 hover:underline">
                  Verify on Etherscan <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            </div>

            {/* ── Route + chat ──────────────────────────────────────────── */}
            <div className="grid lg:grid-cols-2 gap-4 mt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="neon-card p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Route className="w-4 h-4 text-secondary" />
                  <span className="font-display font-bold">Route · OSRM optimized</span>
                </div>
                <div className="h-24 rounded-lg overflow-hidden border border-border mb-3">
                  <MiniMap label="Cuddalore → Bengaluru" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { l: "Distance", v: "87 km"   },
                    { l: "Time",     v: "1h 45m"  },
                    { l: "Cost",     v: "₹1,200"  },
                  ].map((r) => (
                    <div key={r.l} className="rounded bg-muted/30 p-2">
                      <div className="text-[10px] text-muted-foreground">{r.l}</div>
                      <div className="font-display font-bold">{r.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground flex items-start gap-2">
                  <Truck className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                  Recommended: hire local truck via NH-48 to Bengaluru APMC. Direct deal saves{" "}
                  <span className="text-primary font-semibold">₹38,000</span> vs broker route.
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="neon-card p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-accent" />
                  <span className="font-display font-bold">Negotiate · R. Kumar</span>
                  <span className="ml-auto text-[10px] font-mono text-primary">Online</span>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-start">
                    <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-muted/40 px-3 py-2 text-xs">
                      Asking ₹22/kg for 2 tonnes Grade A.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-secondary/15 border border-secondary/30 px-3 py-2 text-xs">
                      ₹20/kg if pickup in 3 days?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-muted/40 px-3 py-2 text-xs">
                      Deal at ₹21/kg. Locking escrow now ✓
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-2">
                  <input
                    className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                    placeholder="Type a message…"
                  />
                  <Send className="w-4 h-4 text-secondary" />
                </div>
              </motion.div>
            </div>

            {/* ── Kanban order pipeline ────────────────────────────────── */}
            <h2 className="font-display text-2xl font-bold mt-12 mb-4">Order pipeline</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {Object.entries(kanbanOrders).map(([status, items], i) => (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.06 }}
                  className="rounded-xl bg-card/50 border border-border p-3"
                >
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center justify-between">
                    {status}
                    <span className="text-primary">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="text-[10px] text-muted-foreground text-center py-2">Empty</div>
                    ) : (
                      items.map((it, j) => (
                        <div key={j} className="rounded-lg bg-background/60 border border-border p-3">
                          <div className="text-[12px] font-semibold">{it.c}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{it.f}</div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPortal;