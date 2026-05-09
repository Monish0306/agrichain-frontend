import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";

const steps = [
  { n: "01", title: "Farmer lists crop", body: "GPS, quantity, quality grade, photos. CropListing.sol deploys on Sepolia. QR code generated." },
  { n: "02", title: "Merchant browses & orders", body: "Filterable feed of all listings. Trust score on chain. Confirms price." },
  { n: "03", title: "Escrow auto-deploys", body: "TradeEscrow.sol locks funds. Farmer sees: 'Payment of ₹X secured ✓'" },
  { n: "04", title: "Dual confirmation", body: "Both parties tap Confirm Delivery. Smart contract releases instantly. Zero brokers." },
];

export const FlowSection = () => (
  <section className="relative py-28 overflow-hidden border-y border-border/60 bg-card/30">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-xs font-mono uppercase tracking-wider text-accent mb-4">
          The Blockchain Flow
        </div>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
          Four steps. <span className="gradient-text-amber">Zero intermediaries.</span>
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="relative neon-card p-6"
          >
            <div className="font-mono text-xs text-primary mb-3">STEP {s.n}</div>
            <h3 className="font-display text-xl font-bold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            {i < steps.length - 1 && (
              <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-12 neon-card p-8 ring-neon"
      >
        <div className="font-mono text-xs text-primary mb-2">VERIFIED ON CHAIN</div>
        <div className="font-mono text-sm md:text-base break-all text-foreground/90">
          0x9f3<span className="text-primary">a4c8b2e7d1...</span>e24f · TradeEscrow.sol · Block #5,128,442
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Anyone can verify on etherscan.io/sepolia
        </div>
      </motion.div>
    </div>
  </section>
);
