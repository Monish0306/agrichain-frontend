// src/components/Hero.tsx
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Users, Globe, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroScene } from "./HeroScene";
import { SparkField } from "./SparkField";
import { getAuth } from "../store/auth";

export const Hero = () => {
  const user = getAuth();

  // FIX 1: "Open Farmer Portal" and "Merchant Login" buttons linked directly
  // to /farmer and /merchant — if NOT logged in, these pages immediately
  // redirect to /login anyway, causing a confusing double redirect.
  // Fix: route to /login if not logged in, correct portal if logged in.
  const farmerLink   = user?.role === "farmer"   ? "/farmer"   : "/login";
  const merchantLink = user?.role === "merchant" ? "/merchant" : "/login";
  const monitorLink  = user?.role === "monitor"  ? "/monitor"  : "/monitor";

  return (
    <section className="relative min-h-screen pt-24 overflow-hidden bg-gradient-hero">

      {/* Animated grid */}
      <div className="absolute inset-0 bg-grid animate-grid-drift opacity-60" />
      <SparkField density={1.4} />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20   rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-accent/10    rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)] py-12">

        {/* ── Left — copy ── */}
        <div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono uppercase tracking-wider text-primary mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            NMIT Hacks 2026 · AI + Blockchain Track
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tighter"
          >
            No broker.<br />
            No delay.<br />
            <span className="gradient-text">Just a fair price.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
          >
            AgriChain is a multilingual, AI-powered, blockchain-secured platform
            that gives India's{" "}
            <span className="text-foreground font-semibold">140 million farmers</span>{" "}
            the market intelligence, crop guidance and payment guarantees previously
            reserved for agribusiness giants.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            {/* FIX 2: Primary CTA had a broken sweep animation
                `animate-neon-sweep` is not a default Tailwind class — it was
                defined but caused a layout shift making the button text jump.
                Replaced with a stable hover:scale effect that works everywhere */}
            <Link
              to={farmerLink}
              className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-neon-lime hover:shadow-[0_0_40px_hsl(var(--primary)/0.8)] hover:scale-105 transition-all duration-200 overflow-hidden"
            >
              <span className="relative z-10">
                {user?.role === "farmer" ? "Go to Farmer Portal" : "Open Farmer Portal"}
              </span>
              <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to={merchantLink}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border bg-card/50 backdrop-blur text-foreground font-semibold hover:border-secondary hover:text-secondary hover:scale-105 transition-all duration-200"
            >
              {user?.role === "merchant" ? "Go to Merchant Portal" : "Merchant Login"}
            </Link>

            <Link
              to={monitorLink}
              className="text-sm text-muted-foreground font-mono hover:text-accent transition-colors"
            >
              /monitor →
            </Link>
          </motion.div>

          {/* Stats */}
          {/* FIX 3: Stats said "5 Languages" but the app supports 7 languages
              (English, Tamil, Hindi, Kannada, Telugu, Marathi, Gujarati).
              Also "₹0 Cost" is misleading for a hackathon demo — changed to
              meaningful stats that match the actual platform */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-12 grid grid-cols-3 gap-6 max-w-md"
          >
            {[
              { v: "140M",  l: "Farmers",    icon: Users  },
              { v: "7",     l: "Languages",  icon: Globe  },
              { v: "50+",   l: "AI Endpoints", icon: Zap  },
            ].map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <s.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="font-display text-3xl font-bold gradient-text">{s.v}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  {s.l}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            {[
              "XGBoost + SHAP",
              "Prophet ML",
              "Groq Vision",
              "OSRM Routing",
              "Blockchain Escrow",
              "AGMARKNET Prices",
            ].map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-border/60 bg-muted/20 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── Right — 3D scene ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="relative h-[480px] lg:h-[620px]"
        >
          <div className="absolute inset-0">
            <HeroScene />
          </div>

          {/* Live badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-background/60 backdrop-blur text-xs font-mono text-muted-foreground whitespace-nowrap">
            <span className="pulse-dot" />
            LIVE · Sepolia Testnet · agrichain-api-tnhz.onrender.com
          </div>
        </motion.div>

      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Scroll to explore
        </div>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-5 h-8 rounded-full border border-border/60 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-primary" />
        </motion.div>
      </motion.div>

    </section>
  );
};