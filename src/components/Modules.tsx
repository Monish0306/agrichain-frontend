import { motion } from "framer-motion";
import { Brain, Coins, LineChart, Wallet } from "lucide-react";

const modules = [
  {
    icon: Brain,
    tag: "Module 01",
    title: "Smart Crop & Weather Advisory",
    body: "XGBoost on ICAR soil-crop data fused with 7-day OpenWeather forecasts and IMD disaster overrides. SHAP explains every recommendation.",
    accent: "from-primary to-secondary",
    glow: "shadow-neon-lime",
  },
  {
    icon: Coins,
    tag: "Module 02",
    title: "Farmer ↔ Merchant Marketplace",
    body: "Solidity escrow on Ethereum Sepolia. Payment locked the moment a deal is struck. Auto-released on dual delivery confirmation.",
    accent: "from-secondary to-accent",
    glow: "shadow-neon-cyan",
  },
  {
    icon: LineChart,
    tag: "Module 03",
    title: "Market Price Intelligence",
    body: "LSTM + Prophet trained on 5 years of AGMARKNET data. SELL today or WAIT — with the exact rupee delta per tonne.",
    accent: "from-accent to-primary",
    glow: "shadow-neon-amber",
  },
  {
    icon: Wallet,
    tag: "Module 04",
    title: "Financial Planner & Subsidy Finder",
    body: "Investment, EMI, profit. Then surfaces every PM-KISAN, PMKSY and state scheme the farmer qualifies for — translated, in voice.",
    accent: "from-primary to-accent",
    glow: "shadow-neon-lime",
  },
];

export const Modules = () => {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-grid-dense opacity-40" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/5 text-xs font-mono uppercase tracking-wider text-secondary mb-4">
            <span className="pulse-dot" style={{ background: "hsl(var(--secondary))" }} />
            Four Core Modules
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Intelligence, secured <br />
            <span className="gradient-text">end-to-end on chain.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {modules.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="neon-card scanline group p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${m.accent} flex items-center justify-center ${m.glow}`}>
                  <m.icon className="w-7 h-7 text-background" strokeWidth={2.5} />
                </div>
                <span className="font-mono text-xs text-muted-foreground tracking-widest">{m.tag}</span>
              </div>
              <h3 className="font-display text-2xl font-bold mb-3 group-hover:text-glow-lime transition-all">{m.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{m.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
