import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroScene } from "./HeroScene";
import { SparkField } from "./SparkField";

export const Hero = () => {
  return (
    <section className="relative min-h-screen pt-24 overflow-hidden bg-gradient-hero">
      {/* Animated grid */}
      <div className="absolute inset-0 bg-grid animate-grid-drift opacity-60" />
      <SparkField density={1.4} />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/15 rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)] py-12">
        {/* Left — copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono uppercase tracking-wider text-primary mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            NMIT Hacks 2026 · AI + Blockchain Track
          </motion.div>

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

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed"
          >
            AgriChain is a multilingual, AI-powered, blockchain-secured platform that gives
            India's <span className="text-foreground font-semibold">140 million farmers</span> the
            market intelligence, crop guidance and payment guarantees previously reserved for
            agribusiness giants.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/farmer"
              className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-neon-lime overflow-hidden"
            >
              <span className="relative z-10">Open Farmer Portal</span>
              <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/3 animate-neon-sweep" />
            </Link>

            <Link
              to="/merchant"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border bg-card/50 backdrop-blur text-foreground font-semibold hover:border-secondary hover:text-secondary transition-colors"
            >
              Merchant Login
            </Link>

            <Link
              to="/monitor"
              className="text-sm text-muted-foreground font-mono hover:text-accent transition-colors"
            >
              /monitor →
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-12 grid grid-cols-3 gap-6 max-w-md"
          >
            {[
              { v: "140M", l: "Farmers" },
              { v: "5", l: "Languages" },
              { v: "₹0", l: "Cost" },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-display text-3xl font-bold gradient-text">{s.v}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — 3D scene */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="relative h-[480px] lg:h-[620px]"
        >
          <div className="absolute inset-0">
            <HeroScene />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-background/60 backdrop-blur text-xs font-mono text-muted-foreground">
            <span className="pulse-dot" />
            LIVE · Sepolia Testnet
          </div>
        </motion.div>
      </div>
    </section>
  );
};
