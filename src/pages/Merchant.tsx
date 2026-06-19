import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { MiniMap } from "@/components/MiniMap";
import { QRBlock } from "@/components/QRBlock";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTranslation, translateBatch } from "../i18n/useTranslation";
import {
  BarChart3, CheckCircle2, ExternalLink, Filter,
  History, LayoutDashboard, MapPin, MessageCircle,
  Package, Route, Search, Send, ShieldCheck,
  ShoppingBag, Star, TrendingUp, Truck, Wallet, X,
} from "lucide-react";
import { marketplace, prices, BASE_URL } from "../api";
import { getAuth, clearAuth } from "../store/auth";

// ── Static fallback listings ──────────────────────────────────────────────────
const staticListings = [
  { crop: "Tomato Grade A",     farmer: "R. Kumar", loc: "Cuddalore, TN", qty: "2.0 t",  price: 22, trust: 94, grade: "A" },
  { crop: "Onion Grade B",      farmer: "S. Devi",  loc: "Nashik, MH",    qty: "5.5 t",  price: 18, trust: 88, grade: "B" },
  { crop: "Basmati Rice",       farmer: "H. Singh", loc: "Karnal, HR",    qty: "12 t",   price: 41, trust: 97, grade: "A" },
  { crop: "Groundnut",          farmer: "M. Patel", loc: "Junagadh, GJ",  qty: "3.2 t",  price: 65, trust: 91, grade: "A" },
  { crop: "Cotton Long Staple", farmer: "K. Reddy", loc: "Warangal, TS",  qty: "8 t",    price: 78, trust: 96, grade: "A" },
  { crop: "Black Gram",         farmer: "P. Naidu", loc: "Guntur, AP",    qty: "1.8 t",  price: 92, trust: 89, grade: "B" },
];

const staticOrders = {
  Pending:       [{ c: "Tomato · 2t · ₹22",       f: "R. Kumar" }],
  Confirmed:     [{ c: "Onion · 5.5t · ₹18",      f: "S. Devi"  }, { c: "Cotton · 8t · ₹78", f: "K. Reddy" }],
  "In Transit":  [{ c: "Basmati · 12t · ₹41",     f: "H. Singh" }],
  Delivered:     [{ c: "Groundnut · 3.2t · ₹65",  f: "M. Patel" }],
  Completed:     [{ c: "Black Gram · 1.8t · ₹92", f: "P. Naidu" }],
};

const escrowSteps = [
  { l: "Order placed",       s: "done"   },
  { l: "Payment escrowed",   s: "done"   },
  { l: "Crop dispatched",    s: "active" },
  { l: "Delivery confirmed", s: "todo"   },
  { l: "Payment released",   s: "todo"   },
];

const groupByStatus = (txList: any[]) => {
  const map: Record<string, { c: string; f: string }[]> = {
    Pending: [], Confirmed: [], "In Transit": [], Delivered: [], Completed: [],
  };
  txList.forEach(t => {
    const key =
      t.status === "pending"   ? "Pending"   :
      t.status === "confirmed" ? "Confirmed" :
      t.status === "completed" ? "Completed" : "Pending";
    if (map[key]) {
      map[key].push({
        c: `${t.listing_crop_type || t.crop_type || "Crop"} · ₹${t.agreed_price || t.offer_price_per_kg || 0}/kg · ${t.quantity_kg || 0}kg`,
        f: t.farmer_name || "Farmer",
      });
    }
  });
  return map;
};

type Tab = "dashboard" | "listings" | "orders" | "history" | "analytics";

// ─────────────────────────────────────────────────────────────────────────────
const MerchantPortal = () => {
  const navigate = useNavigate();
  const user     = getAuth();

  useEffect(() => {
    if (!user || user.role !== "merchant") navigate("/login");
  }, []);

  // ── Language ──────────────────────────────────────────────────────────────
  const { lang, changeLang, isTranslating, setIsTranslating } = useTranslation();
  const [uiText, setUiText] = useState<Record<string, string>>({});

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // ── Listings ──────────────────────────────────────────────────────────────
  const [liveListings,  setLiveListings]  = useState<any[]>([]);
  const [listingsReady, setListingsReady] = useState(false);

  // ── Search & filters ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCrop,  setFilterCrop]  = useState("All");
  const [filterGrade, setFilterGrade] = useState("All");
  const [filterState, setFilterState] = useState("All");

  // ── Orders ────────────────────────────────────────────────────────────────
  const [myOrders,     setMyOrders]     = useState<any[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // ── Inline order form ─────────────────────────────────────────────────────
  const [orderFormId,  setOrderFormId]  = useState<string | null>(null);
  const [orderQty,     setOrderQty]     = useState("");
  const [orderPrice,   setOrderPrice]   = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMsg,     setOrderMsg]     = useState("");

  // ── Price check ───────────────────────────────────────────────────────────
  const [commodities,       setCommodities]       = useState<string[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState("tomato");
  const [priceData,         setPriceData]         = useState<any>(null);

  // ── Route optimizer ───────────────────────────────────────────────────────
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeForm,     setRouteForm]     = useState({
    origin_lat: 12.97, origin_lon: 77.59,
    dest_lat: 13.08,   dest_lon: 80.27, dest_name: "Chennai APMC",
  });
  const [routeResult,  setRouteResult]  = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isLive          = listingsReady && liveListings.length > 0;
  const allListings     = isLive ? liveListings : staticListings;
  const activeOrders    = myOrders.filter(t => ["pending","confirmed"].includes(t.status)).length;
  const completedOrders = myOrders.filter(t => t.status === "completed");
  const totalVolume     = completedOrders.reduce((s, t) =>
    s + (t.agreed_price || t.offer_price_per_kg || 0) * (t.quantity_kg || 0), 0);
  const kanbanOrders    = myOrders.length > 0 ? groupByStatus(myOrders) : staticOrders;
  const anyFilterActive = filterCrop !== "All" || filterGrade !== "All" || filterState !== "All" || searchQuery !== "";

  const filteredListings = allListings.filter((l: any) => {
    const crop   = (l.crop_type || l.crop  || "").toLowerCase();
    const state  = (l.state     || l.loc   || "").toLowerCase();
    const grade  = l.quality_grade || l.grade || "A";
    const search = searchQuery.toLowerCase();
    const matchSearch = !search || crop.includes(search) ||
      (l.farmer_name || l.farmer || "").toLowerCase().includes(search) || state.includes(search);
    const matchCrop  = filterCrop  === "All" || crop.includes(filterCrop.toLowerCase());
    const matchGrade = filterGrade === "All" || grade === filterGrade;
    const matchState = filterState === "All" || state.includes(filterState.toLowerCase());
    return matchSearch && matchCrop && matchGrade && matchState;
  });

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    // FIX 1: use marketplace.getListings() to fetch live listings
    marketplace.getListings()
      .then((r: any) => { setLiveListings(r.listings || []); setListingsReady(true); })
      .catch(() => setListingsReady(true));

    // FIX 2: was r.transactions — correct key is r.orders
    marketplace.myOrders()
      .then((r: any) => setMyOrders(r.orders || r.transactions || []))
      .catch(console.error);

    prices.getCommodities()
      .then((r: any) => {
        const list: string[] = r.commodities || [];
        setCommodities(list);
        if (list.length > 0) setSelectedCommodity(list[0]);
      }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedCommodity) return;
    prices.predictPrice(selectedCommodity, 7).then(setPriceData).catch(console.error);
  }, [selectedCommodity]);

  // ── Full page translation via pre-built dict ──────────────────────────────
  const handleLangChange = async (newLang: string) => {
    changeLang(newLang);
    if (newLang === "english") { setUiText({}); return; }
    setIsTranslating(true);
    try {
      const ui = await translateBatch({
        merchantPortal:   "Merchant Portal",
        kycVerified:      "KYC verified",
        searchPlaceholder:"Search crops, farmers…",
        logout:           "Logout",
        activeOrders:     "Active orders",
        tradeVolume:      "Trade vol · total",
        liveListings:     "Live listings",
        completedTrades:  "Completed trades",
        dashboard:        "Dashboard",
        browseListings:   "Browse Listings",
        myOrders:         "My Orders",
        txHistory:        "Tx History",
        analytics:        "Analytics",
        filterLabel:      "Filters",
        cropFilter:       "Crop",
        qualityFilter:    "Quality",
        stateFilter:      "State",
        clearFilters:     "Clear all filters",
        activeListings:   "Active listings",
        demoLabel:        "Demo — login as Farmer to see real listings",
        priceCheck:       "Price check:",
        placeOrder:       "Place Order",
        cancelBtn:        "Cancel",
        quantityKg:       "Quantity (kg)",
        offerPrice:       "Offer ₹/kg",
        confirmOrder:     "✅ Confirm Order",
        noListings:       "No listings match your filters.",
        recentOrders:     "My recent orders",
        escrowTitle:      "TradeEscrow.sol · Smart Contract",
        lockedAmount:     "Locked",
        latestStatus:     "Latest status",
        network:          "Network",
        cropProvenance:   "Crop provenance",
        verifyEtherscan:  "Verify on Etherscan",
        routeTitle:       "Route · OSRM optimized",
        farmLat:          "Farm Lat",
        farmLon:          "Farm Lon",
        mandiLat:         "Mandi Lat",
        mandiLon:         "Mandi Lon",
        destLabel:        "Destination name",
        getRoute:         "🗺️ Get Optimal Route",
        calculating:      "Calculating…",
        distance:         "Distance",
        time:             "Time",
        to:               "To",
        hireLocal:        "Hire local truck to destination. Direct deal saves broker fees.",
        negotiateTitle:   "Negotiate · Direct Chat",
        comingSoon:       "Coming soon",
        orderPipeline:    "Order pipeline",
        totalOrders:      "Total orders placed",
        completedLabel:   "Completed trades",
        activeLabel:      "Active / pending",
        totalValue:       "Total trade value",
        avgOrder:         "Avg order value",
        browsedListings:  "Live listings browsed",
        confirmBtn:       "Confirm",
        totalLabel:       "Total",
      }, newLang);
      setUiText(ui);
    } catch (err) { console.error("Translation error:", err); }
    finally { setIsTranslating(false); }
  };

  // tx() — returns translated text or English fallback
  const tx = (key: string, fallback: string) => uiText[key] || fallback;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePlaceOrder = async (listingId: string) => {
    const qty   = parseFloat(orderQty);
    const price = parseFloat(orderPrice);
    if (!qty || qty <= 0 || !price || price <= 0) {
      setOrderMsg("❌ Enter valid quantity and price");
      return;
    }
    setOrderLoading(true); setOrderMsg("");
    try {
      // marketplace.placeOrder expects 3 args: (listingId, quantityKg, pricePerKg)
      await marketplace.placeOrder(listingId, qty, price);
      setOrderMsg("✅ Order placed!");
      setOrderFormId(null); setOrderQty(""); setOrderPrice("");
      const r: any = await marketplace.myOrders();
      setMyOrders(r.orders || r.transactions || []);
    } catch (e: any) { setOrderMsg("❌ " + e.message); }
    finally { setOrderLoading(false); }
  };

  const handleConfirmTx = async (txId: string) => {
    setConfirmingId(txId);
    try {
      await marketplace.confirmTransaction(txId);
      const r: any = await marketplace.myOrders();
      setMyOrders(r.orders || r.transactions || []);
    } catch (e: any) { alert("❌ " + e.message); }
    finally { setConfirmingId(null); }
  };

  const handleGetRoute = async () => {
    setRouteLoading(true); setRouteResult(null);
    try {
      const r: any = await marketplace.getRoute(
        routeForm.origin_lat, routeForm.origin_lon,
        routeForm.dest_lat,   routeForm.dest_lon
      );
      setRouteResult(r);
    } catch (e: any) { setRouteResult({ error: e.message }); }
    finally { setRouteLoading(false); }
  };

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  const sidebarNav: { icon: any; label: string; tab: Tab }[] = [
    { icon: LayoutDashboard, label: tx("dashboard",      "Dashboard"),       tab: "dashboard" },
    { icon: ShoppingBag,     label: tx("browseListings", "Browse Listings"), tab: "listings"  },
    { icon: Package,         label: tx("myOrders",       "My Orders"),       tab: "orders"    },
    { icon: History,         label: tx("txHistory",      "Tx History"),      tab: "history"   },
    { icon: BarChart3,       label: tx("analytics",      "Analytics"),       tab: "analytics" },
  ];

  const latestOrder  = myOrders[0];
  const escrowLocked = latestOrder
    ? `₹${((latestOrder.agreed_price || latestOrder.offer_price_per_kg || 0) * (latestOrder.quantity_kg || 0)).toLocaleString()}`
    : "₹0";
  const latestStatus = latestOrder?.status?.toUpperCase() || "No orders yet";

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 md:px-6 pt-28 pb-16">

        {/* ━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="font-mono text-xs text-secondary uppercase tracking-widest mb-2">
              {tx("merchantPortal", "Merchant Portal")}
            </div>
            <h1 className="font-display text-4xl font-bold">
              <span className="gradient-text">{user?.name || "Merchant"}</span>
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                {tx("kycVerified", "KYC verified")}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-secondary" />
                {user?.user_id?.slice(0, 12) || "0x71C…b3aF"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-44"
                placeholder={tx("searchPlaceholder", "Search crops, farmers…")}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <LanguageSelector value={lang} onChange={handleLangChange} isTranslating={isTranslating} />
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-sm hover:bg-destructive hover:text-white transition-colors"
            >
              {tx("logout", "Logout")}
            </button>
          </div>
        </motion.div>

        {/* ━━ KPI CARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { l: tx("activeOrders",    "Active orders"),     v: String(activeOrders),                                      c: "primary"   },
            { l: tx("tradeVolume",     "Trade vol · total"), v: totalVolume > 0 ? `₹${(totalVolume / 100000).toFixed(1)}L` : "₹0", c: "secondary" },
            { l: tx("liveListings",    "Live listings"),     v: String(liveListings.length),                               c: "accent"    },
            { l: tx("completedTrades", "Completed trades"),  v: String(completedOrders.length),                            c: "primary"   },
          ].map(k => (
            <div key={k.l} className="neon-card p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{k.l}</div>
              <div className={`font-display text-3xl font-bold mt-2 text-${k.c}`}>{k.v}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6">

          {/* ━━ SIDEBAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="neon-card p-3 h-fit sticky top-24"
          >
            {sidebarNav.map(n => (
              <button key={n.tab} onClick={() => setActiveTab(n.tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === n.tab
                    ? "bg-secondary/15 text-secondary border border-secondary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                <n.icon className="w-4 h-4" />
                {n.label}
              </button>
            ))}

            {/* Filters */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1 mb-3 px-3">
                <Filter className="w-3 h-3 text-muted-foreground" />
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  {tx("filterLabel", "Filters")} {anyFilterActive && <span className="text-accent">· Active</span>}
                </div>
              </div>

              {[
                { label: tx("cropFilter",    "Crop"),    state: filterCrop,  setter: setFilterCrop,  opts: ["All","Tomato","Rice","Cotton","Onion","Groundnut"] },
                { label: tx("qualityFilter", "Quality"), state: filterGrade, setter: setFilterGrade, opts: ["All","A","B","C"] },
                { label: tx("stateFilter",   "State"),   state: filterState, setter: setFilterState, opts: ["All","TN","MH","GJ","TS","AP","HR"] },
              ].map(f => (
                <div key={f.label} className="mb-3 px-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">{f.label}</div>
                  <div className="flex flex-wrap gap-1">
                    {f.opts.map(o => (
                      <button key={o} onClick={() => f.setter(o)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          f.state === o
                            ? "border-secondary bg-secondary/15 text-secondary"
                            : "border-border hover:border-secondary hover:text-secondary"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {anyFilterActive && (
                <button
                  onClick={() => { setFilterCrop("All"); setFilterGrade("All"); setFilterState("All"); setSearchQuery(""); }}
                  className="w-full text-[10px] text-destructive border border-destructive/30 rounded-lg py-1.5 hover:bg-destructive/10 transition-colors"
                >
                  {tx("clearFilters", "Clear all filters")}
                </button>
              )}
            </div>
          </motion.aside>

          {/* ━━ MAIN CONTENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <div>

            {/* ── LISTINGS + DASHBOARD ─────────────────────────────────────── */}
            {(activeTab === "dashboard" || activeTab === "listings") && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                    {tx("activeListings", "Active listings")}
                    <span className="text-xs font-mono text-muted-foreground">
                      · {filteredListings.length} {isLive ? "(live)" : "(demo)"}
                      {anyFilterActive && " · filtered"}
                    </span>
                  </h2>
                  {!isLive && listingsReady && (
                    <span className="text-[10px] font-mono text-accent border border-accent/30 bg-accent/10 px-2 py-1 rounded-full">
                      {tx("demoLabel", "Demo — login as Farmer to see real listings")}
                    </span>
                  )}
                </div>

                {/* Price check bar */}
                {commodities.length > 0 && (
                  <div className="mb-4 neon-card p-4 flex items-center gap-3 flex-wrap">
                    <TrendingUp className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      {tx("priceCheck", "Price check:")}
                    </span>
                    <select
                      value={selectedCommodity}
                      onChange={e => setSelectedCommodity(e.target.value)}
                      className="px-3 py-1 rounded-lg bg-muted/30 border border-border text-sm outline-none"
                    >
                      {commodities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {priceData && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-display font-bold gradient-text">₹{priceData.current_price}/kg today</span>
                        {priceData.sell_recommendation && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                            priceData.sell_recommendation.action === "WAIT"
                              ? "border-accent/40 text-accent bg-accent/10"
                              : "border-primary/40 text-primary bg-primary/10"
                          }`}>
                            Farmer advised: {priceData.sell_recommendation.action}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Listings grid */}
                {filteredListings.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                    {tx("noListings", "No listings match your filters.")}{" "}
                    <button
                      onClick={() => { setFilterCrop("All"); setFilterGrade("All"); setFilterState("All"); setSearchQuery(""); }}
                      className="text-accent underline"
                    >
                      {tx("clearFilters", "Clear filters")}
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredListings.map((l: any, i: number) => {
                      const isReal   = !!l.id;
                      const cropName = l.crop_type || l.crop || "Crop";
                      const grade    = l.quality_grade || l.grade || "A";
                      const price    = l.asking_price  || l.price || 0;
                      const qty      = l.quantity_kg ? `${l.quantity_kg}kg` : l.qty;
                      const location = l.district ? `${l.district}, ${l.state}` : l.loc;
                      const farmerN  = l.farmer_name || l.farmer || "Farmer";
                      const trust    = l.trust || 90;

                      return (
                        <motion.div key={l.id || l.crop}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="neon-card p-4 flex flex-col"
                        >
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
                          <div className="flex items-end justify-between mb-2">
                            <div>
                              <div className="font-display text-xl font-bold gradient-text">₹{price}</div>
                              <div className="text-[10px] text-muted-foreground">/kg · {qty}</div>
                            </div>
                            {isReal ? (
                              <button
                                onClick={() => {
                                  setOrderFormId(orderFormId === l.id ? null : l.id);
                                  setOrderPrice(String(price));
                                  setOrderMsg("");
                                }}
                                className="text-xs px-3 py-1.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary hover:text-secondary-foreground transition-colors"
                              >
                                {orderFormId === l.id ? tx("cancelBtn", "Cancel") : tx("placeOrder", "Place Order")}
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-mono">Demo</span>
                            )}
                          </div>

                          {/* Inline order form */}
                          <AnimatePresence>
                            {orderFormId === l.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                              >
                                <div className="border-t border-border pt-3 space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx("quantityKg", "Quantity (kg)")}</div>
                                      <input type="number" value={orderQty}
                                        onChange={e => setOrderQty(e.target.value)}
                                        placeholder="e.g. 500"
                                        className="w-full px-2 py-1.5 rounded-lg bg-muted/30 border border-border text-xs outline-none focus:border-secondary"
                                      />
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx("offerPrice", "Offer ₹/kg")}</div>
                                      <input type="number" value={orderPrice}
                                        onChange={e => setOrderPrice(e.target.value)}
                                        placeholder={String(price)}
                                        className="w-full px-2 py-1.5 rounded-lg bg-muted/30 border border-border text-xs outline-none focus:border-secondary"
                                      />
                                    </div>
                                  </div>
                                  {orderQty && orderPrice && (
                                    <div className="text-[10px] text-muted-foreground">
                                      {tx("totalLabel", "Total")}: ₹{(parseFloat(orderQty || "0") * parseFloat(orderPrice || "0")).toLocaleString()}
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handlePlaceOrder(l.id)}
                                    disabled={orderLoading}
                                    className="w-full py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold disabled:opacity-50 hover:opacity-90"
                                  >
                                    {orderLoading ? tx("calculating", "Placing…") : tx("confirmOrder", "✅ Confirm Order")}
                                  </button>
                                  {orderMsg && (
                                    <p className={`text-xs ${orderMsg.startsWith("✅") ? "text-primary" : "text-destructive"}`}>
                                      {orderMsg}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-auto">
                            <span>{farmerN}</span>
                            <ExternalLink className="w-3 h-3 hover:text-primary cursor-pointer" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Dashboard-only sections */}
                {activeTab === "dashboard" && (
                  <>
                    {/* Recent orders */}
                    {myOrders.length > 0 && (
                      <div className="mt-10">
                        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                          {tx("recentOrders", "My recent orders")}
                          <span className="text-xs font-mono text-muted-foreground">· {myOrders.length} total</span>
                        </h2>
                        <div className="space-y-3">
                          {myOrders.slice(0, 4).map((t: any) => (
                            <div key={t.transaction_id || t.id}
                              className="neon-card p-4 flex items-center justify-between gap-4"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm">
                                  {t.listing_crop_type || t.crop_type || "Crop"} · {t.quantity_kg}kg · ₹{t.agreed_price || t.offer_price_per_kg}/kg
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                  {tx("totalLabel", "Total")}: ₹{((t.agreed_price || t.offer_price_per_kg || 0) * (t.quantity_kg || 0)).toLocaleString()}
                                </div>
                              </div>
                              <div className={`text-[10px] px-2 py-0.5 rounded-full border font-mono flex-shrink-0 ${
                                t.status === "completed" ? "border-primary/40 text-primary bg-primary/10"       :
                                t.status === "confirmed" ? "border-secondary/40 text-secondary bg-secondary/10" :
                                                           "border-accent/40 text-accent bg-accent/10"
                              }`}>
                                {t.status?.toUpperCase()}
                              </div>
                              {(t.status === "pending" || t.status === "confirmed") && (
                                <button
                                  onClick={() => handleConfirmTx(t.transaction_id || t.id)}
                                  disabled={confirmingId === (t.transaction_id || t.id)}
                                  className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 flex-shrink-0"
                                >
                                  {confirmingId === (t.transaction_id || t.id) ? "…" : tx("confirmBtn", "Confirm")}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Escrow timeline */}
                    <div className="grid lg:grid-cols-3 gap-4 mt-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }} className="neon-card p-5 lg:col-span-2"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          <span className="font-display font-bold">{tx("escrowTitle", "TradeEscrow.sol · Smart Contract")}</span>
                        </div>
                        <div className="relative grid grid-cols-5 gap-2">
                          <div className="absolute top-4 left-[10%] right-[10%] h-px bg-border" />
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: "40%" }}
                            transition={{ duration: 1.2, delay: 0.6 }}
                            className="absolute top-4 left-[10%] h-px bg-gradient-to-r from-primary to-secondary shadow-neon-lime"
                          />
                          {escrowSteps.map((step, i) => (
                            <div key={step.l} className="relative flex flex-col items-center text-center">
                              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                step.s === "done"   ? "bg-primary text-primary-foreground shadow-neon-lime"     :
                                step.s === "active" ? "bg-secondary text-secondary-foreground shadow-neon-cyan" :
                                                      "bg-muted border border-border text-muted-foreground"
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
                            <div className="text-muted-foreground uppercase text-[10px]">{tx("lockedAmount", "Locked")}</div>
                            <div className="font-display text-lg font-bold gradient-text">{escrowLocked}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground uppercase text-[10px]">{tx("latestStatus", "Latest status")}</div>
                            <div className="font-mono text-primary text-[11px]">{latestStatus}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground uppercase text-[10px]">{tx("network", "Network")}</div>
                            <div className="font-mono text-secondary text-[11px]">Sepolia Testnet</div>
                          </div>
                        </div>
                      </motion.div>

                      {/* QR Provenance */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }} className="neon-card p-5 flex flex-col items-center text-center"
                      >
                        <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">
                          {tx("cropProvenance", "Crop provenance")}
                        </div>
                        <QRBlock size={120} />
                        <div className="text-xs text-muted-foreground mt-3">CropListing.sol</div>
                        <a className="mt-2 text-[11px] text-primary flex items-center gap-1 hover:underline cursor-pointer">
                          {tx("verifyEtherscan", "Verify on Etherscan")} <ExternalLink className="w-3 h-3" />
                        </a>
                      </motion.div>
                    </div>

                    {/* Route + Chat */}
                    <div className="grid lg:grid-cols-2 gap-4 mt-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }} className="neon-card p-5"
                      >
                        <button
                          className="w-full flex items-center justify-between mb-3"
                          onClick={() => setShowRouteForm(!showRouteForm)}
                        >
                          <div className="flex items-center gap-2">
                            <Route className="w-4 h-4 text-secondary" />
                            <span className="font-display font-bold">
                              {tx("routeTitle", "Route · OSRM optimized")}
                              {routeResult && !routeResult.error && (
                                <span className="text-sm text-muted-foreground font-normal ml-2">
                                  · {routeResult.distance_km}km · {routeResult.duration_minutes}min
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-xs">{showRouteForm ? "▲" : "▼"}</span>
                        </button>

                        <AnimatePresence>
                          {showRouteForm && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                {[
                                  { l: tx("farmLat",  "Farm Lat"),  k: "origin_lat", v: routeForm.origin_lat },
                                  { l: tx("farmLon",  "Farm Lon"),  k: "origin_lon", v: routeForm.origin_lon },
                                  { l: tx("mandiLat", "Mandi Lat"), k: "dest_lat",   v: routeForm.dest_lat   },
                                  { l: tx("mandiLon", "Mandi Lon"), k: "dest_lon",   v: routeForm.dest_lon   },
                                ].map(f => (
                                  <div key={f.k}>
                                    <div className="text-[9px] text-muted-foreground uppercase mb-1">{f.l}</div>
                                    <input type="number" value={f.v}
                                      onChange={e => setRouteForm(p => ({ ...p, [f.k]: parseFloat(e.target.value) || 0 }))}
                                      className="w-full px-2 py-1.5 rounded-lg bg-muted/30 border border-border text-xs outline-none"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="mb-2">
                                <div className="text-[9px] text-muted-foreground uppercase mb-1">{tx("destLabel", "Destination name")}</div>
                                <input
                                  value={routeForm.dest_name}
                                  onChange={e => setRouteForm(p => ({ ...p, dest_name: e.target.value }))}
                                  className="w-full px-2 py-1.5 rounded-lg bg-muted/30 border border-border text-xs outline-none"
                                />
                              </div>
                              <button
                                onClick={handleGetRoute}
                                disabled={routeLoading}
                                className="w-full py-2 rounded-full bg-secondary/20 text-secondary border border-secondary/30 text-xs font-semibold hover:bg-secondary hover:text-secondary-foreground transition-colors disabled:opacity-50 mb-3"
                              >
                                {routeLoading ? tx("calculating", "Calculating…") : tx("getRoute", "🗺️ Get Optimal Route")}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!showRouteForm && !routeResult && (
                          <div className="h-24 rounded-lg overflow-hidden border border-border">
                            <MiniMap label="Farm → Mandi" />
                          </div>
                        )}

                        {routeResult && !routeResult.error && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {[
                              { l: tx("distance", "Distance"), v: `${routeResult.distance_km} km`       },
                              { l: tx("time",     "Time"),     v: `${routeResult.duration_minutes} min`  },
                              { l: tx("to",       "To"),       v: routeForm.dest_name                    },
                            ].map(r => (
                              <div key={r.l} className="rounded bg-muted/30 p-2">
                                <div className="text-[10px] text-muted-foreground">{r.l}</div>
                                <div className="font-display font-bold text-xs">{r.v}</div>
                              </div>
                            ))}
                            <div className="col-span-3 mt-2 text-[11px] text-muted-foreground flex items-start gap-2">
                              <Truck className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                              {tx("hireLocal", "Hire local truck to destination. Direct deal saves broker fees.")}
                            </div>
                          </div>
                        )}
                        {routeResult?.error && (
                          <div className="text-xs text-destructive mt-2">Route error: {routeResult.error}</div>
                        )}
                      </motion.div>

                      {/* Negotiation chat */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }} className="neon-card p-5"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <MessageCircle className="w-4 h-4 text-accent" />
                          <span className="font-display font-bold">{tx("negotiateTitle", "Negotiate · Direct Chat")}</span>
                          <span className="ml-auto text-[10px] font-mono text-muted-foreground">{tx("comingSoon", "Coming soon")}</span>
                        </div>
                        <div className="space-y-2 mb-3">
                          {[
                            { side: "left",  msg: "Asking ₹22/kg for 2 tonnes Grade A."  },
                            { side: "right", msg: "₹20/kg if pickup in 3 days?"          },
                            { side: "left",  msg: "Deal at ₹21/kg. Locking escrow now ✓" },
                          ].map((m, i) => (
                            <div key={i} className={`flex ${m.side === "right" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs ${
                                m.side === "right"
                                  ? "rounded-br-sm bg-secondary/15 border border-secondary/30"
                                  : "rounded-bl-sm bg-muted/40"
                              }`}>{m.msg}</div>
                            </div>
                          ))}
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

                    {/* Kanban */}
                    <h2 className="font-display text-2xl font-bold mt-10 mb-4">{tx("orderPipeline", "Order pipeline")}</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {Object.entries(kanbanOrders).map(([status, items], i) => (
                        <motion.div key={status}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + i * 0.06 }}
                          className="rounded-xl bg-card/50 border border-border p-3"
                        >
                          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center justify-between">
                            {status}<span className="text-primary">{items.length}</span>
                          </div>
                          <div className="space-y-2">
                            {items.length === 0 ? (
                              <div className="text-[10px] text-muted-foreground text-center py-2">Empty</div>
                            ) : (
                              items.map((it, j) => (
                                <div key={j} className="rounded-lg bg-background/60 border border-border p-3">
                                  <div className="text-[11px] font-semibold leading-tight">{it.c}</div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">{it.f}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── ORDERS / HISTORY tab ─────────────────────────────────────── */}
            {(activeTab === "orders" || activeTab === "history") && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">
                  {activeTab === "orders" ? tx("myOrders", "My Orders") : tx("txHistory", "Transaction History")}
                  <span className="text-xs font-mono text-muted-foreground ml-2">· {myOrders.length} total</span>
                </h2>
                {myOrders.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                    No orders yet — browse listings and place an order
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map((t: any) => (
                      <div key={t.transaction_id || t.id} className="neon-card p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">
                            {t.listing_crop_type || t.crop_type || "Crop"} · {t.quantity_kg}kg · ₹{t.agreed_price || t.offer_price_per_kg}/kg
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {(t.transaction_id || t.id || "").toString().slice(0, 20)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {tx("totalLabel", "Total")}: ₹{((t.agreed_price || t.offer_price_per_kg || 0) * (t.quantity_kg || 0)).toLocaleString()}
                          </div>
                        </div>
                        <div className={`text-[10px] px-2 py-0.5 rounded-full border font-mono flex-shrink-0 ${
                          t.status === "completed" ? "border-primary/40 text-primary bg-primary/10"       :
                          t.status === "confirmed" ? "border-secondary/40 text-secondary bg-secondary/10" :
                                                     "border-accent/40 text-accent bg-accent/10"
                        }`}>
                          {t.status?.toUpperCase()}
                        </div>
                        {(t.status === "pending" || t.status === "confirmed") && (
                          <button
                            onClick={() => handleConfirmTx(t.transaction_id || t.id)}
                            disabled={confirmingId === (t.transaction_id || t.id)}
                            className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 flex-shrink-0"
                          >
                            {confirmingId === (t.transaction_id || t.id) ? "…" : tx("confirmBtn", "Confirm")}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYTICS tab ────────────────────────────────────────────── */}
            {activeTab === "analytics" && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-6">{tx("analytics", "Analytics")}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { l: tx("totalOrders",     "Total orders placed"),   v: myOrders.length,                                                                                    c: "primary"   },
                    { l: tx("completedLabel",  "Completed trades"),      v: completedOrders.length,                                                                             c: "primary"   },
                    { l: tx("activeLabel",     "Active / pending"),      v: activeOrders,                                                                                       c: "secondary" },
                    { l: tx("totalValue",      "Total trade value"),     v: `₹${totalVolume.toLocaleString()}`,                                                                 c: "accent"    },
                    { l: tx("avgOrder",        "Avg order value"),       v: completedOrders.length > 0 ? `₹${Math.round(totalVolume / completedOrders.length).toLocaleString()}` : "₹0", c: "secondary" },
                    { l: tx("browsedListings", "Live listings browsed"), v: liveListings.length,                                                                                c: "accent"    },
                  ].map(s => (
                    <div key={s.l} className="neon-card p-5">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.l}</div>
                      <div className={`font-display text-3xl font-bold mt-2 text-${s.c}`}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPortal;