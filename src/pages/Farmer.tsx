import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SparkField } from "@/components/SparkField";
import { MiniMap } from "@/components/MiniMap";
import { QRBlock } from "@/components/QRBlock";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTranslation, translateText, translateBatch } from "../i18n/useTranslation";
import {
  AlertTriangle, Banknote, BookOpen, Bug, Calculator,
  Camera, CheckCircle2, CloudRain, CloudSun, Coins,
  Droplets, ExternalLink, Home, IndianRupee, MapPin,
  Package, PlusCircle, Route, Sprout, Sun,
  TrendingUp, Volume2, Wind, X, Zap,
} from "lucide-react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { advisory, prices, marketplace, finance, weather } from "../api";
import { getAuth, clearAuth } from "../store/auth";
import { BASE_URL } from "../api";

const FALLBACK_PRICE = [
  { d: "Mon", p: 11 }, { d: "Tue", p: 13 }, { d: "Wed", p: 15 },
  { d: "Thu", p: 19 }, { d: "Fri", p: 17 }, { d: "Sat", p: 16 }, { d: "Sun", p: 14 },
];
const FALLBACK_HIST = Array.from({ length: 30 }, (_, i) => ({
  d: i + 1, p: +(12 + Math.sin(i / 3) * 4 + i / 8).toFixed(2),
}));

const sevCls = (s: string) =>
  s === "critical" || s === "high" ? "destructive"
  : s === "warning" || s === "med" ? "accent"
  : "secondary";

const FarmerPortal = () => {
  const navigate = useNavigate();
  const user     = getAuth();
  const fileRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || user.role !== "farmer") navigate("/login");
  }, []);

  const [activeTab, setActiveTab] = useState<"home"|"advisory"|"market"|"finance">("home");

  // ── Language via hook (fixes all undeclared variable crashes) ─────────
  const { lang, changeLang, isTranslating, setIsTranslating } = useTranslation();
  const [uiText,             setUiText]             = useState<Record<string, string>>({});
  const [translatedAdvisory, setTranslatedAdvisory] = useState<any>(null);
  const [translatedAlerts,   setTranslatedAlerts]   = useState<any[]>([]);
  const [translatedDisease,  setTranslatedDisease]  = useState<any>(null);

  const [weatherData, setWeatherData] = useState<any>(null);
  const [liveAlerts,  setLiveAlerts]  = useState<any[]>([]);

  const [advisoryData,    setAdvisoryData]    = useState<any>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError,   setAdvisoryError]   = useState("");
  const [advisoryForm,    setAdvisoryForm]    = useState({
    nitrogen: 90, phosphorous: 42, potassium: 43,
    temperature: 25, humidity: 65, ph: 6.5, rainfall: 200,
    soil_type: "Loamy", crop_type: "Wheat",
    gps_lat: 12.97, gps_lon: 77.59,
  });

  const [diseaseResult,  setDiseaseResult]  = useState<any>(null);
  const [diseaseLoading, setDiseaseLoading] = useState(false);

  const [priceData7,        setPriceData7]        = useState<any>(null);
  const [selectedCommodity, setSelectedCommodity] = useState("tomato");
  const [commodities,       setCommodities]        = useState<string[]>([]);

  const [myListings,      setMyListings]      = useState<any[]>([]);
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingForm,     setListingForm]     = useState({
    crop_type: "Tomato", quantity_kg: 500, asking_price: 22,
    quality_grade: "A", district: "Mysore", state: "Karnataka", description: "",
  });
  const [listingMsg,     setListingMsg]     = useState("");
  const [listingLoading, setListingLoading] = useState(false);

  const [showRoute,    setShowRoute]    = useState(false);
  const [routeResult,  setRouteResult]  = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeForm,    setRouteForm]    = useState({
    origin_lat: 12.97, origin_lon: 77.59,
    dest_lat: 12.31, dest_lon: 76.65, dest_name: "Mysore APMC",
  });

  const [financeData,    setFinanceData]    = useState<any>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeForm,    setFinanceForm]    = useState({
    crop_type: "cotton", land_acres: 3, state: "Karnataka", category: "General",
  });

  const [emiData, setEmiData] = useState<any>(null);
  const [emiForm, setEmiForm] = useState({ principal: 100000, annual_rate: 4, months: 12 });

  useEffect(() => {
    prices.getCommodities().then((r: any) => {
      const list: string[] = r.commodities || [];
      setCommodities(list);
      if (list.length > 0) setSelectedCommodity(list[0]);
    }).catch(console.error);
    marketplace.myListings().then((r: any) => setMyListings(r.listings || [])).catch(console.error);
    weather.getForecast(12.97, 77.59, "Mysore").then((r: any) => {
      setWeatherData(r);
      if (r.farming_alerts?.length) setLiveAlerts(r.farming_alerts);
    }).catch(console.error);
    runFinance({ crop_type: "cotton", land_acres: 3, state: "Karnataka", category: "General" });
  }, []);

  useEffect(() => {
    if (!selectedCommodity) return;
    prices.predictPrice(selectedCommodity, 7).then(setPriceData7).catch(console.error);
  }, [selectedCommodity]);

  const runFinance = async (form: typeof financeForm) => {
    setFinanceLoading(true);
    try { setFinanceData(await finance.calculate(form)); }
    catch { /* silent */ }
    finally { setFinanceLoading(false); }
  };

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  // ── FULL PAGE TRANSLATION via Groq API ────────────────────────────────
  const handleLangChange = async (newLang: string) => {
    changeLang(newLang); // saves to localStorage — persists across all portals
    if (newLang === "english") {
      setUiText({});
      setTranslatedAdvisory(null);
      setTranslatedAlerts([]);
      setTranslatedDisease(null);
      return;
    }
    setIsTranslating(true);
    try {
      // Translate all UI labels at once — one batch call
      const ui = await translateBatch({
        farmerPortal:    "Farmer Portal · Live",
        forecast:        "Forecast timeline",
        farmingAlerts:   "Farming alerts · AI-interpreted",
        module01:        "Module 01 · Smart Advisory · XGBoost + SHAP",
        cropRec:         "Crop Recommendation",
        nitrogen:        "Nitrogen",
        phosphorous:     "Phosphorous",
        potassium:       "Potassium",
        temperature:     "Temperature",
        humidityPct:     "Humidity %",
        ph:              "pH",
        rainfallMm:      "Rainfall mm",
        soilType:        "Soil Type",
        getRecommend:    "🌱 Get Crop Recommendation",
        best:            "BEST",
        whyThis:         "Why this recommendation? · SHAP Explainability",
        fertilizer:      "Fertilizer",
        module01b:       "Module 01B · AI Disease Detector · YOLOv8",
        uploadPhoto:     "Upload crop photo → instant diagnosis",
        clickUpload:     "Click to upload crop photo",
        jpgPng:          "JPG, PNG, WEBP · Max 10MB",
        module03:        "Module 03 · Price Intelligence · Prophet",
        sevenDay:        "7-day forecast · Prophet model",
        thirtyDay:       "30-day historical · AGMARKNET",
        module02:        "Module 02 · Marketplace · Blockchain escrow",
        listCrop:        "List my crop",
        newListing:      "New listing",
        cancelBtn:       "Cancel",
        cropType:        "Crop Type",
        quantityKg:      "Quantity (kg)",
        priceKg:         "Price/kg (₹)",
        district:        "District",
        stateLabel:      "State",
        description:     "Description",
        qualityGrade:    "Quality Grade",
        createListing:   "✅ Create Listing",
        activeListings:  "Your active listings",
        noListings:      "No listings yet",
        provenanceQR:    "Provenance QR",
        blockchainVerif: "Blockchain-verified",
        routeOptimizer:  "Route Optimizer · OSRM · Free API",
        shortestRoute:   "Shortest route to mandi",
        farmLat:         "Farm Lat",
        farmLon:         "Farm Lon",
        mandiLat:        "Mandi Lat",
        mandiLon:        "Mandi Lon",
        destName:        "Destination Name",
        getRoute:        "🗺️ Get Optimal Route",
        distance:        "Distance",
        duration:        "Duration",
        destination:     "Destination",
        module04:        "Module 04 · Finance Planner · KCC Loans",
        investCalc:      "Investment Calculator",
        cropLabel:       "Crop",
        landAcres:       "Land (Acres)",
        category:        "Category",
        calculate:       "💰 Calculate",
        costPerAcre:     "Cost per acre",
        totalInvestment: "Total investment",
        kccLoan:         "KCC loan (80%)",
        annualInterest:  "Annual interest",
        netAfterSub:     "Net after subsidy",
        kccEmiLabel:     "KCC Loan · 4% pa · 12mo",
        emiCalc:         "Loan EMI Calculator",
        loanAmount:      "Loan Amount (₹)",
        interestRate:    "Interest Rate % pa",
        durationMonths:  "Duration (months)",
        calcEmi:         "📊 Calculate EMI",
        monthlyEmi:      "Monthly EMI",
        totalPayment:    "Total payment",
        totalInterest:   "Total interest",
        principal:       "Principal",
        schemeFinder:    "Scheme finder",
        govtMoney:       "Govt money you qualify for",
        applyNow:        "Apply now",
        clickCalc:       "Click Calculate in Finance Planner to find matching schemes",
        totalSubsidy:    "Total subsidy available",
        thisSeason:      "this season",
        home:            "Home",
        advisory:        "Advisory",
        market:          "Market",
        finance:         "Finance",
        logout:          "Logout",
      }, newLang);
      setUiText(ui);

      // Translate live advisory result if available
      if (advisoryData) {
        const tAdv: any = { ...advisoryData };
        if (advisoryData.advice_summary)
          tAdv.advice_summary = await translateText(advisoryData.advice_summary, newLang);
        if (advisoryData.fertilizer_recommendation?.name)
          tAdv.fertilizer_recommendation = {
            ...advisoryData.fertilizer_recommendation,
            name: await translateText(advisoryData.fertilizer_recommendation.name, newLang),
          };
        if (advisoryData.groundwater_warning?.message)
          tAdv.groundwater_warning = {
            ...advisoryData.groundwater_warning,
            message: await translateText(advisoryData.groundwater_warning.message, newLang),
          };
        if (advisoryData.farming_alerts?.length)
          tAdv.farming_alerts = await Promise.all(
            advisoryData.farming_alerts.map(async (a: any) => ({
              ...a, message: await translateText(a.message || "", newLang),
            }))
          );
        setTranslatedAdvisory(tAdv);
      }

      // Translate farming alerts
      if (liveAlerts.length > 0) {
        const tAlerts = await Promise.all(
          liveAlerts.map(async (a: any) => ({
            ...a, message: await translateText(a.message || a.t || "", newLang),
          }))
        );
        setTranslatedAlerts(tAlerts);
      }

      // Translate disease result
      if (diseaseResult) {
        setTranslatedDisease({
          ...diseaseResult,
          disease:   await translateText(diseaseResult.disease   || "", newLang),
          treatment: await translateText(diseaseResult.treatment || "", newLang),
        });
      }
    } catch (err) { console.error("Translation error:", err); }
    finally { setIsTranslating(false); }
  };

  // tx() — returns translated text or English fallback
  const tx = (key: string, fallback: string) => uiText[key] || fallback;

  const handleAdvisory = async () => {
    setAdvisoryLoading(true); setAdvisoryError(""); setTranslatedAdvisory(null);
    try {
      const result: any = await advisory.recommend(advisoryForm);
      setAdvisoryData(result);
      // Auto-translate result if non-English selected
      if (lang !== "english" && result) {
        const tAdv: any = { ...result };
        if (result.advice_summary)
          tAdv.advice_summary = await translateText(result.advice_summary, lang);
        if (result.fertilizer_recommendation?.name)
          tAdv.fertilizer_recommendation = {
            ...result.fertilizer_recommendation,
            name: await translateText(result.fertilizer_recommendation.name, lang),
          };
        if (result.farming_alerts?.length)
          tAdv.farming_alerts = await Promise.all(
            result.farming_alerts.map(async (a: any) => ({
              ...a, message: await translateText(a.message || "", lang),
            }))
          );
        setTranslatedAdvisory(tAdv);
      }
    } catch (e: any) {
      setAdvisoryError(e.message || "Advisory failed — check backend.");
    } finally { setAdvisoryLoading(false); }
  };

  const handleDiseaseUpload = async (file: File) => {
    // Validate file type before uploading
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setDiseaseResult({
        disease:   "Invalid file type",
        treatment: "Please upload a JPG, PNG, or WEBP image of a crop leaf.",
        severity:  "high",
        is_plant:  false,
        error:     "invalid_format",
      });
      return;
    }
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setDiseaseResult({
        disease:   "File too large",
        treatment: "Please upload an image smaller than 10MB.",
        severity:  "high",
        is_plant:  false,
        error:     "file_too_large",
      });
      return;
    }

    setDiseaseLoading(true); setDiseaseResult(null); setTranslatedDisease(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const token = localStorage.getItem("agrichain_token");
      const res = await fetch(`${BASE_URL}/api/advisory/disease-detect`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();

      // Backend rejected as non-plant image
      if (res.status === 422 && data.detail?.error === "not_a_plant_image") {
        setDiseaseResult({
          disease:   "❌ Not a crop image",
          treatment: data.detail.message,
          severity:  "high",
          is_plant:  false,
          error:     "not_a_plant_image",
        });
        return;
      }

      // Other backend errors
      if (!res.ok) {
        setDiseaseResult({
          disease:   "Detection failed",
          treatment: data.detail?.message || data.detail || "Please try again with a clear crop leaf photo.",
          severity:  "high",
          is_plant:  false,
          error:     "backend_error",
        });
        return;
      }

      setDiseaseResult(data);
      if (lang !== "english" && data.disease && data.is_plant !== false) {
        setTranslatedDisease({
          ...data,
          disease:   await translateText(data.disease   || "", lang),
          treatment: await translateText(data.treatment || "", lang),
        });
      }
    } catch (e: any) {
      setDiseaseResult({
        disease:   "Upload failed",
        treatment: "Network error — check your connection and try again.",
        severity:  "high",
        is_plant:  false,
        error:     "network_error",
      });
    } finally { setDiseaseLoading(false); }
  };

  const handleCreateListing = async () => {
    setListingLoading(true); setListingMsg("");
    try {
      await marketplace.createListing(listingForm);
      setListingMsg("✅ Listing created!");
      const r: any = await marketplace.myListings();
      setMyListings(r.listings || []);
      setShowListingForm(false);
    } catch (e: any) { setListingMsg("❌ " + e.message); }
    finally { setListingLoading(false); }
  };

  const handleGetRoute = async () => {
    setRouteLoading(true); setRouteResult(null);
    try {
      const r: any = await marketplace.getRoute(
        routeForm.origin_lat, routeForm.origin_lon, routeForm.dest_lat, routeForm.dest_lon
      );
      setRouteResult(r);
    } catch (e: any) { setRouteResult({ error: e.message }); }
    finally { setRouteLoading(false); }
  };

  const handleEmi = async () => {
    try {
      const r: any = await finance.calculateEmi(emiForm.principal, emiForm.annual_rate, emiForm.months);
      setEmiData(r);
    } catch (e) { console.error(e); }
  };

  // Use translated data when available, else original
  const activeAdvisory = translatedAdvisory || advisoryData;
  const activeAlerts   = translatedAlerts.length > 0 ? translatedAlerts : liveAlerts;
  const activeDisease  = translatedDisease || diseaseResult;

  const f0        = weatherData?.forecast?.[0];
  const chartData = priceData7?.predictions?.map((p: any) => ({
    d: p.date.slice(5), p: p.predicted_price,
  })) || FALLBACK_PRICE;

  const kpis = [
    { icon: Sun,       label: tx("today",       "Today"),      value: f0 ? `${Math.round(f0.temp_max)}°C`     : "—", sub: f0?.description || "Loading…", color: "primary"   },
    { icon: Droplets,  label: tx("humidity",    "Humidity"),   value: f0 ? `${f0.humidity}%`                  : "—", sub: "Moisture level",              color: "secondary" },
    { icon: Wind,      label: tx("wind",        "Wind"),       value: f0 ? `${f0.wind_kmh} km/h`              : "—", sub: "Wind speed",                   color: "accent"    },
    { icon: CloudRain, label: tx("sevenDayRain","7-day rain"), value: f0 ? `${Math.round(f0.rain_mm || 0)}mm` : "—", sub: "Rainfall forecast",            color: "secondary" },
  ];

  const displayAlerts = activeAlerts.length > 0 ? activeAlerts : [
    { severity: "warning", message: "Heavy rain Day 3 — do not spray pesticide. Wait until Day 5." },
    { severity: "warning", message: "Humidity >85% forecast — fungal disease risk elevated." },
    { severity: "low",     message: "Temperature dropping below 15°C — cover young seedlings." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-16">
      <Navbar />
      <SparkField density={0.6} />
      <div className="container mx-auto px-4 md:px-6 pt-28 pb-16 relative z-10">

        {/* ━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="font-mono text-xs text-primary uppercase tracking-widest mb-1">
              {tx("farmerPortal", "Farmer Portal · Live")}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              வணக்கம், <span className="gradient-text">{user?.name || "Farmer"}</span>
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /> AgriChain Intelligence Platform
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* LanguageSelector — triggers full page translation */}
            <LanguageSelector
              value={lang}
              onChange={handleLangChange}
              isTranslating={isTranslating}
            />
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-destructive/40 bg-destructive/10 text-destructive text-sm hover:bg-destructive hover:text-white transition-colors"
            >
              {tx("logout", "Logout")}
            </button>
          </div>
        </motion.div>

        {/* ━━ WEATHER KPI CARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((k, i) => (
            <motion.div key={k.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="neon-card p-5"
            >
              <div className={`w-10 h-10 rounded-lg bg-${k.color}/10 ring-1 ring-${k.color}/30 flex items-center justify-center mb-3`}>
                <k.icon className={`w-5 h-5 text-${k.color}`} />
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{k.label}</div>
              <div className="font-display text-2xl font-bold mt-1">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{k.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ━━ 7-DAY FORECAST ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="neon-card p-6 mb-6"
        >
          <div className="mb-4">
            <div className="font-mono text-xs text-secondary uppercase tracking-widest">
              7-day forecast · OpenWeatherMap
              {weatherData?.source === "demo" && " · Demo"}{weatherData?.source !== "demo" && weatherData && " · Live ●"}
            </div>
            <h2 className="font-display text-xl font-bold mt-1">{tx("forecast", "Forecast timeline")}</h2>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weatherData?.forecast?.length > 0
              ? weatherData.forecast.slice(0, 7).map((day: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="rounded-xl bg-muted/30 border border-border p-3 text-center hover:border-primary/40 transition-colors"
                >
                  <div className="text-[9px] font-mono text-muted-foreground truncate">{day.date?.slice(5) || `D${i + 1}`}</div>
                  <CloudSun className="w-5 h-5 mx-auto my-2 text-accent" />
                  <div className="font-display font-bold text-sm">{Math.round(day.temp_max || 0)}°</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{Math.round(day.rain_mm || 0)}mm</div>
                </motion.div>
              ))
              : [24, 28, 32, 31, 27, 25, 24].map((t, i) => (
                <div key={i} className="rounded-xl bg-muted/30 border border-border p-3 text-center opacity-40">
                  <div className="text-[9px] font-mono text-muted-foreground">Day {i + 1}</div>
                  <CloudSun className="w-5 h-5 mx-auto my-2 text-accent" />
                  <div className="font-display font-bold text-sm">{t}°</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">–</div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* ━━ FARMING ALERTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }} className="neon-card p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-accent" />
            <span className="font-display font-bold">{tx("farmingAlerts", "Farming alerts · AI-interpreted")}</span>
            {liveAlerts.length > 0 && <span className="ml-auto text-[10px] font-mono text-primary">● LIVE</span>}
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {displayAlerts.slice(0, 3).map((a: any, i: number) => {
              const sev = a.sev || a.severity || "low";
              const c   = sevCls(sev);
              return (
                <div key={i} className={`rounded-xl border border-${c}/40 bg-${c}/5 p-4`}>
                  <div className={`text-[10px] font-mono text-${c} uppercase mb-1`}>{sev}</div>
                  <p className="text-sm leading-snug">{a.t || a.message}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ━━ MODULE 01 — CROP ADVISORY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }} className="neon-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-mono text-xs text-primary uppercase tracking-widest">
                {tx("module01", "Module 01 · Smart Advisory · XGBoost + SHAP")}
              </div>
              <h2 className="font-display text-2xl font-bold mt-1">{tx("cropRec", "Crop Recommendation")}</h2>
            </div>
            <Volume2 className="w-5 h-5 text-primary" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { en: "Nitrogen",    key: "nitrogen",    k: "nitrogen"    },
              { en: "Phosphorous", key: "phosphorous", k: "phosphorous" },
              { en: "Potassium",   key: "potassium",   k: "potassium"   },
              { en: "Temperature", key: "temperature", k: "temperature" },
              { en: "Humidity %",  key: "humidityPct", k: "humidity"    },
              { en: "pH",          key: "ph",          k: "ph"          },
              { en: "Rainfall mm", key: "rainfallMm",  k: "rainfall"    },
            ].map(f => (
              <div key={f.k}>
                <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx(f.key, f.en)}</div>
                <input type="number"
                  value={(advisoryForm as any)[f.k]}
                  onChange={e => setAdvisoryForm(p => ({ ...p, [f.k]: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none focus:border-primary transition-colors"
                />
              </div>
            ))}
            <div>
              <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx("soilType", "Soil Type")}</div>
              <select value={advisoryForm.soil_type}
                onChange={e => setAdvisoryForm(p => ({ ...p, soil_type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none focus:border-primary"
              >
                {["Black","Clayey","Loamy","Red","Sandy"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleAdvisory} disabled={advisoryLoading}
            className="mb-5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {advisoryLoading ? "🔬 Analyzing…" : tx("getRecommend", "🌱 Get Crop Recommendation")}
          </button>

          {advisoryError && (
            <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
              {advisoryError}
            </div>
          )}

          <AnimatePresence>
            {activeAdvisory && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Top 3 crops */}
                <div className="grid sm:grid-cols-3 gap-4">
                  {activeAdvisory.recommended_crops?.map((c: any, i: number) => (
                    <div key={c.name} className={`rounded-xl border p-5 ${i === 0 ? "border-primary/50 bg-primary/5 shadow-neon-lime" : "border-border bg-muted/20"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sprout className={`w-5 h-5 ${i === 0 ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="font-display text-lg font-bold">{c.name}</span>
                        {i === 0 && <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">{tx("best","BEST")}</span>}
                      </div>
                      <div className="font-display text-3xl font-bold gradient-text">{c.confidence_percent}%</div>
                      <div className="text-xs text-muted-foreground mt-1">Water: {c.water_requirement_mm}mm</div>
                      {c.soil_compatible === true  && <div className="text-xs text-primary mt-1">✅ Suits your soil</div>}
                      {c.soil_compatible === false && <div className="text-xs text-accent mt-1">⚠️ Soil mismatch</div>}
                    </div>
                  ))}
                </div>

                {/* Fertilizer */}
                {activeAdvisory.fertilizer_recommendation && (
                  <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-accent flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-semibold text-accent">{tx("fertilizer","Fertilizer")}: </span>
                      {activeAdvisory.fertilizer_recommendation.name}
                      <span className="text-muted-foreground ml-2 text-xs">— {activeAdvisory.fertilizer_recommendation.dosage_kg_per_acre} kg/acre</span>
                    </div>
                  </div>
                )}

                {/* SHAP explainability */}
                {activeAdvisory.shap_explanation?.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
                      {tx("whyThis", "Why this recommendation? · SHAP Explainability")}
                    </div>
                    <div className="space-y-2">
                      {activeAdvisory.shap_explanation.slice(0, 5).map((s: any) => (
                        <div key={s.feature}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{s.feature} <span className="text-xs text-muted-foreground">({s.value})</span></span>
                            <span className="font-mono text-primary">{s.importance_percent}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${s.importance_percent}%` }}
                              transition={{ duration: 0.8 }}
                              className="h-full bg-gradient-to-r from-primary to-secondary shadow-neon-lime"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Groundwater warning */}
                {activeAdvisory.groundwater_warning && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-destructive text-sm">⚠️ Groundwater: {activeAdvisory.groundwater_warning.category}</div>
                      <p className="text-xs mt-1">{activeAdvisory.groundwater_warning.message}</p>
                    </div>
                  </div>
                )}

                {/* Farming alerts from advisory */}
                {activeAdvisory.farming_alerts?.length > 0 && (
                  <div className="grid md:grid-cols-3 gap-3">
                    {activeAdvisory.farming_alerts.slice(0, 3).map((a: any, i: number) => {
                      const c = sevCls(a.severity || "low");
                      return <div key={i} className={`rounded-xl border border-${c}/40 bg-${c}/5 p-3`}><p className="text-xs leading-snug">{a.message}</p></div>;
                    })}
                  </div>
                )}

                {/* Advice summary */}
                {activeAdvisory.advice_summary && (
                  <div className="rounded-xl bg-muted/30 border border-border p-4">
                    <p className="text-sm">💡 {activeAdvisory.advice_summary}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ━━ MODULE 01B — DISEASE DETECTOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }} className="neon-card p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bug className="w-5 h-5 text-accent" />
            <div>
              <div className="font-mono text-xs text-accent uppercase tracking-widest">{tx("module01b","Module 01B · AI Disease Detector · YOLOv8")}</div>
              <h2 className="font-display text-lg font-bold">{tx("uploadPhoto","Upload crop photo → instant diagnosis")}</h2>
            </div>
          </div>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-accent/30 rounded-xl p-8 text-center hover:border-accent/60 hover:bg-accent/5 transition-all cursor-pointer group"
          >
            <Camera className="w-10 h-10 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold">{diseaseLoading ? "🔍 Analyzing image…" : tx("clickUpload","Click to upload crop photo")}</p>
            <p className="text-xs text-muted-foreground mt-1">{tx("jpgPng","JPG, PNG, WEBP · Max 10MB")}</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleDiseaseUpload(f); }}
            />
          </div>
          {diseaseLoading && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-accent">Analyzing with YOLOv8…</span>
            </div>
          )}
          <AnimatePresence>
            {activeDisease && !diseaseLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* ── NOT A PLANT — show red error card ── */}
                {activeDisease.is_plant === false || activeDisease.error ? (
                  <div className="mt-4 rounded-xl border-2 border-destructive/60 bg-destructive/10 p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-display font-bold text-lg text-destructive">
                          {activeDisease.disease}
                        </div>
                        <div className="text-xs font-mono text-destructive/70 mt-0.5">
                          NOT A CROP IMAGE
                        </div>
                      </div>
                    </div>
                    <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                      {activeDisease.treatment}
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">
                      <div className="font-semibold mb-1">📸 How to take a correct photo:</div>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li>Take a close-up of the affected leaf</li>
                        <li>Good daylight — no flash</li>
                        <li>Fill the frame with the leaf</li>
                        <li>Supported: tomato, rice, wheat, cotton, maize, potato, onion</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => { setDiseaseResult(null); setTranslatedDisease(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="mt-3 text-xs text-destructive hover:text-destructive/70 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Try again with a crop photo
                    </button>
                  </div>
                ) : (
                  /* ── VALID PLANT — show disease result ── */
                  <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-display font-bold text-2xl">{activeDisease.disease}</span>
                      <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
                        activeDisease.severity === "critical" || activeDisease.severity === "high"
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : activeDisease.severity === "none"
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-accent/10 text-accent border-accent/30"
                      }`}>
                        {(activeDisease.severity || "").toUpperCase()}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-accent mb-3">
                      Confidence: {activeDisease.confidence_percent ?? Math.round((activeDisease.confidence || 0) * 100)}%
                    </div>
                    <div className="text-sm leading-relaxed">{activeDisease.treatment}</div>
                    {activeDisease.mode?.includes("demo") && (
                      <div className="mt-2 text-xs text-muted-foreground font-mono">
                        Demo mode — deploy YOLOv8 ONNX to ml_models/ for live inference
                      </div>
                    )}
                    <button
                      onClick={() => { setDiseaseResult(null); setTranslatedDisease(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="mt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ━━ MODULE 03 — PRICE INTELLIGENCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }} className="neon-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-xs text-secondary uppercase tracking-widest">{tx("module03","Module 03 · Price Intelligence · Prophet")}</div>
              <h2 className="font-display text-2xl font-bold mt-1">
                {selectedCommodity.charAt(0).toUpperCase() + selectedCommodity.slice(1)}
                {priceData7 && <span className="text-lg text-muted-foreground ml-2">· ₹{priceData7.current_price}/kg today</span>}
              </h2>
            </div>
            <select value={selectedCommodity} onChange={e => setSelectedCommodity(e.target.value)}
              className="px-3 py-2 rounded-xl bg-muted/30 border border-border text-sm outline-none"
            >
              {commodities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">{tx("sevenDay","7-day forecast · Prophet model")}</div>
              <div className="h-44">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
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
                <div className={`mt-3 rounded-xl border p-4 ${priceData7.sell_recommendation.action === "WAIT" ? "border-accent/40 bg-accent/10" : "border-primary/40 bg-primary/10"}`}>
                  <div className="font-display font-bold text-lg">
                    {priceData7.sell_recommendation.action === "WAIT" ? "⏳ WAIT" : "✅ SELL NOW"}
                  </div>
                  <p className="text-sm mt-1">{priceData7.sell_recommendation.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Best: {priceData7.sell_recommendation.best_day_to_sell} · ₹{priceData7.sell_recommendation.expected_price_on_best_day}/kg
                  </p>
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">{tx("thirtyDay","30-day historical · AGMARKNET")}</div>
              <div className="h-44">
                <ResponsiveContainer>
                  <AreaChart data={FALLBACK_HIST}>
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
              {priceData7?.predictions && (
                <div className="mt-3 space-y-1 max-h-28 overflow-y-auto">
                  {priceData7.predictions.slice(0, 7).map((p: any) => (
                    <div key={p.date} className="flex justify-between text-xs p-1.5 rounded-lg bg-muted/20">
                      <span className="text-muted-foreground font-mono">{p.date}</span>
                      <span className="font-bold gradient-text">₹{p.predicted_price}</span>
                      {p.lower_bound && <span className="text-muted-foreground font-mono text-[10px]">₹{p.lower_bound}–{p.upper_bound}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ━━ MODULE 02 — MARKETPLACE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }} className="neon-card p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-mono text-xs text-secondary uppercase tracking-widest">{tx("module02","Module 02 · Marketplace · Blockchain escrow")}</div>
              <h2 className="font-display text-xl font-bold mt-1">{tx("listCrop","List my crop")}</h2>
            </div>
            <button onClick={() => { setShowListingForm(!showListingForm); setListingMsg(""); }}
              className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold shadow-neon-cyan flex items-center gap-2 hover:opacity-90"
            >
              <PlusCircle className="w-4 h-4" />
              {showListingForm ? tx("cancelBtn","Cancel") : tx("newListing","New listing")}
            </button>
          </div>

          <AnimatePresence>
            {showListingForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
              >
                <div className="border border-secondary/30 rounded-xl p-5 mb-5 bg-muted/10">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {[
                      { en: "Crop Type",     key: "cropType",   k: "crop_type",    t: "text"   },
                      { en: "Quantity (kg)", key: "quantityKg", k: "quantity_kg",  t: "number" },
                      { en: "Price/kg (₹)", key: "priceKg",    k: "asking_price", t: "number" },
                      { en: "District",      key: "district",   k: "district",     t: "text"   },
                      { en: "State",         key: "stateLabel", k: "state",        t: "text"   },
                      { en: "Description",   key: "description",k: "description",  t: "text"   },
                    ].map(f => (
                      <div key={f.k}>
                        <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx(f.key, f.en)}</div>
                        <input type={f.t} value={(listingForm as any)[f.k]}
                          onChange={e => setListingForm(p => ({ ...p, [f.k]: f.t === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none focus:border-secondary"
                        />
                      </div>
                    ))}
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx("qualityGrade","Quality Grade")}</div>
                      <select value={listingForm.quality_grade}
                        onChange={e => setListingForm(p => ({ ...p, quality_grade: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none"
                      >
                        {["A","B","C"].map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleCreateListing} disabled={listingLoading}
                      className="px-6 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90"
                    >
                      {listingLoading ? "Creating…" : tx("createListing","✅ Create Listing")}
                    </button>
                    {listingMsg && <span className={`text-sm ${listingMsg.startsWith("✅") ? "text-primary" : "text-destructive"}`}>{listingMsg}</span>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
            {tx("activeListings","Your active listings")} ({myListings.length})
          </div>
          {myListings.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border rounded-xl text-sm text-muted-foreground">
              {tx("noListings","No listings yet — click New listing to create your first")}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {myListings.map((l: any) => (
                <div key={l.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors">
                  <Package className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{l.crop_type} · {l.quantity_kg}kg · Grade {l.quality_grade}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{(l.status || "").toUpperCase()} · {l.district}</div>
                  </div>
                  <div className="font-display text-lg font-bold text-glow-lime flex-shrink-0">₹{l.asking_price}/kg</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border flex items-start gap-4">
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 flex flex-col items-center text-center flex-shrink-0">
              <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">{tx("provenanceQR","Provenance QR")}</div>
              <QRBlock size={80} />
              <p className="text-[10px] text-muted-foreground mt-2 font-mono">{tx("blockchainVerif","Blockchain-verified")}</p>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              Every listing gets a unique QR code linked to blockchain provenance.
              Merchants scan to verify crop origin, quality grade, and farmer identity on Sepolia Etherscan.
            </div>
          </div>
        </motion.div>

        {/* ━━ ROUTE OPTIMIZER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }} className="neon-card p-6 mb-6"
        >
          <button className="w-full flex items-center justify-between" onClick={() => setShowRoute(!showRoute)}>
            <div className="flex items-center gap-3">
              <Route className="w-5 h-5 text-secondary" />
              <div className="text-left">
                <div className="font-mono text-xs text-secondary uppercase tracking-widest">{tx("routeOptimizer","Route Optimizer · OSRM · Free API")}</div>
                <h2 className="font-display text-lg font-bold">
                  {tx("shortestRoute","Shortest route to mandi")}
                  {routeResult && !routeResult.error && (
                    <span className="text-sm text-muted-foreground ml-2 font-normal">· {routeResult.distance_km}km · {routeResult.duration_minutes}min</span>
                  )}
                </h2>
              </div>
            </div>
            <span className="text-muted-foreground">{showRoute ? "▲" : "▼"}</span>
          </button>
          <AnimatePresence>
            {showRoute && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4"
              >
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {[
                    { en: "Farm Lat",  key: "farmLat",  k: "origin_lat", v: routeForm.origin_lat },
                    { en: "Farm Lon",  key: "farmLon",  k: "origin_lon", v: routeForm.origin_lon },
                    { en: "Mandi Lat", key: "mandiLat", k: "dest_lat",   v: routeForm.dest_lat   },
                    { en: "Mandi Lon", key: "mandiLon", k: "dest_lon",   v: routeForm.dest_lon   },
                  ].map(f => (
                    <div key={f.k}>
                      <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx(f.key, f.en)}</div>
                      <input type="number" value={f.v}
                        onChange={e => setRouteForm(p => ({ ...p, [f.k]: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="mb-3">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx("destName","Destination Name")}</div>
                  <input value={routeForm.dest_name}
                    onChange={e => setRouteForm(p => ({ ...p, dest_name: e.target.value }))}
                    placeholder="e.g. Mysore APMC"
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none"
                  />
                </div>
                <button onClick={handleGetRoute} disabled={routeLoading}
                  className="px-6 py-2 rounded-full bg-secondary/20 text-secondary border border-secondary/30 text-sm font-semibold hover:bg-secondary hover:text-secondary-foreground transition-colors disabled:opacity-50"
                >
                  {routeLoading ? "Calculating…" : tx("getRoute","🗺️ Get Optimal Route")}
                </button>
                {routeResult && !routeResult.error && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { key: "distance",    en: "Distance",    v: `${routeResult.distance_km} km`      },
                      { key: "duration",    en: "Duration",    v: `${routeResult.duration_minutes} min` },
                      { key: "destination", en: "Destination", v: routeForm.dest_name                   },
                    ].map(r => (
                      <div key={r.key} className="rounded-xl bg-secondary/10 border border-secondary/30 p-3 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase">{tx(r.key, r.en)}</div>
                        <div className="font-display font-bold mt-1 text-sm">{r.v}</div>
                      </div>
                    ))}
                  </div>
                )}
                {routeResult?.error && <div className="mt-3 text-sm text-destructive">Route error: {routeResult.error}</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ━━ MODULE 04 — FINANCE + EMI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }} className="neon-card p-6"
          >
            <div className="font-mono text-xs text-accent uppercase tracking-widest mb-1">{tx("module04","Module 04 · Finance Planner · KCC Loans")}</div>
            <h2 className="font-display text-xl font-bold mb-4">{tx("investCalc","Investment Calculator")}</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx("cropLabel","Crop")}</div>
                <select value={financeForm.crop_type}
                  onChange={e => setFinanceForm(p => ({ ...p, crop_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none"
                >
                  {["rice","wheat","tomato","onion","cotton","maize","sugarcane","groundnut","potato"].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx("landAcres","Land (Acres)")}</div>
                <input type="number" value={financeForm.land_acres}
                  onChange={e => setFinanceForm(p => ({ ...p, land_acres: parseFloat(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none"
                />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx("stateLabel","State")}</div>
                <input type="text" value={financeForm.state}
                  onChange={e => setFinanceForm(p => ({ ...p, state: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none"
                />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx("category","Category")}</div>
                <select value={financeForm.category}
                  onChange={e => setFinanceForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none"
                >
                  {["General","SC","ST","OBC"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => runFinance(financeForm)} disabled={financeLoading}
              className="mb-4 px-5 py-2 rounded-full bg-accent/20 text-accent border border-accent/30 text-sm font-semibold hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
            >
              {financeLoading ? "Calculating…" : tx("calculate","💰 Calculate")}
            </button>
            {financeData && (
              <div className="space-y-1.5 text-sm">
                {[
                  ["costPerAcre",    "Cost per acre",    `₹${financeData.cost_per_acre?.toLocaleString()}`   ],
                  ["totalInvestment","Total investment",  `₹${financeData.total_investment?.toLocaleString()}`],
                  ["kccLoan",        "KCC loan (80%)",   `₹${financeData.kcc_loan_amount?.toLocaleString()}` ],
                  ["annualInterest", "Annual interest",  `₹${financeData.annual_interest?.toLocaleString()}` ],
                ].map(([k, en, v]) => (
                  <div key={k} className="flex justify-between text-muted-foreground">
                    <span>{tx(k, en)}</span><span className="font-mono text-foreground">{v}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between font-bold">
                  <span>{tx("netAfterSub","Net after subsidy")}</span>
                  <span className="font-mono gradient-text">₹{financeData.net_cost_after_subsidy?.toLocaleString()}</span>
                </div>
                <div className="rounded-xl bg-muted/30 border border-border p-3 flex items-center gap-3 mt-2">
                  <Banknote className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">{tx("kccEmiLabel","KCC Loan · 4% pa · 12mo")}</div>
                    <div className="font-mono font-bold">EMI ₹{financeData.monthly_emi?.toLocaleString()}/month</div>
                  </div>
                </div>
                {financeData.schemes_found > 0 && (
                  <div className="text-xs text-accent font-semibold mt-1">✅ {financeData.schemes_found} govt schemes matched</div>
                )}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }} className="neon-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-accent" />
              <div>
                <div className="font-mono text-xs text-accent uppercase tracking-widest">Standalone EMI Calculator</div>
                <h2 className="font-display text-xl font-bold">{tx("emiCalc","Loan EMI Calculator")}</h2>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              {[
                { en: "Loan Amount (₹)",    key: "loanAmount",     k: "principal",   v: emiForm.principal   },
                { en: "Interest Rate % pa", key: "interestRate",   k: "annual_rate", v: emiForm.annual_rate },
                { en: "Duration (months)",  key: "durationMonths", k: "months",      v: emiForm.months      },
              ].map(f => (
                <div key={f.k}>
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">{tx(f.key, f.en)}</div>
                  <input type="number" value={f.v}
                    onChange={e => setEmiForm(p => ({ ...p, [f.k]: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm outline-none focus:border-accent"
                  />
                </div>
              ))}
            </div>
            <button onClick={handleEmi}
              className="mb-4 px-5 py-2 rounded-full bg-accent/20 text-accent border border-accent/30 text-sm font-semibold hover:bg-accent hover:text-white transition-colors"
            >
              {tx("calcEmi","📊 Calculate EMI")}
            </button>
            {emiData && (
              <div className="space-y-3">
                <div className="rounded-xl bg-accent/10 border border-accent/30 p-4 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">{tx("monthlyEmi","Monthly EMI")}</div>
                  <div className="font-display text-3xl font-bold gradient-text mt-1">₹{emiData.monthly_emi?.toLocaleString()}</div>
                </div>
                {[
                  ["totalPayment",  "Total payment",  `₹${emiData.total_payment?.toLocaleString()}` ],
                  ["totalInterest", "Total interest", `₹${emiData.total_interest?.toLocaleString()}`],
                  ["principal",     "Principal",      `₹${emiData.principal?.toLocaleString()}`     ],
                ].map(([k, en, v]) => (
                  <div key={k} className="flex justify-between text-sm text-muted-foreground">
                    <span>{tx(k, en)}</span><span className="font-mono text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ━━ GOVERNMENT SCHEMES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }} className="neon-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-accent" />
            <div>
              <div className="font-mono text-xs text-accent uppercase tracking-widest">
                {tx("schemeFinder","Scheme finder")} · {financeData?.schemes_found ?? 0} matches
              </div>
              <h2 className="font-display text-xl font-bold">{tx("govtMoney","Govt money you qualify for")}</h2>
            </div>
          </div>
          {financeData?.matching_schemes?.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 gap-3">
                {financeData.matching_schemes.slice(0, 6).map((s: any, i: number) => (
                  <motion.div key={s.id || i}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="rounded-xl border border-border bg-muted/20 p-3 hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <span className="font-semibold text-sm">{s.scheme_name}</span>
                      <span className="font-bold text-accent text-sm flex-shrink-0">
                        {s.subsidy_amount ? `₹${Number(s.subsidy_amount).toLocaleString()}` : s.subsidy_percent ? `${s.subsidy_percent}% off` : "✅"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{s.description}</p>
                    {s.application_url && (
                      <a href={s.application_url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-accent flex items-center gap-1 hover:underline"
                      >
                        {tx("applyNow","Apply now")} <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border text-xs text-center">
                <span className="text-muted-foreground">{tx("totalSubsidy","Total subsidy available")}: </span>
                <span className="font-display font-bold text-accent">₹{financeData.total_subsidy_available?.toLocaleString() || 0}</span>
                <span className="text-muted-foreground"> {tx("thisSeason","this season")}</span>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              {tx("clickCalc","Click Calculate in Finance Planner above to find your matching govt schemes")}
            </div>
          )}
        </motion.div>

      </div>

      {/* ━━ MOBILE BOTTOM NAV ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/80 border-t border-border">
        <div className="grid grid-cols-4">
          {([
            { icon: Home,        label: tx("home",     "Home"),     tab: "home"     },
            { icon: BookOpen,    label: tx("advisory", "Advisory"), tab: "advisory" },
            { icon: TrendingUp,  label: tx("market",   "Market"),   tab: "market"   },
            { icon: IndianRupee, label: tx("finance",  "Finance"),  tab: "finance"  },
          ] as const).map(n => (
            <button key={n.tab} onClick={() => setActiveTab(n.tab)}
              className={`flex flex-col items-center py-3 text-[10px] font-mono transition-colors ${activeTab === n.tab ? "text-primary" : "text-muted-foreground"}`}
            >
              <n.icon className="w-5 h-5 mb-1" />
              {n.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default FarmerPortal;