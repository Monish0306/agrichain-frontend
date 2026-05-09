import { motion } from "framer-motion";

const stack = [
  { cat: "Frontend", items: ["React 18", "Tailwind", "Web3.js 4", "Plotly", "Leaflet", "i18next"] },
  { cat: "Backend", items: ["FastAPI", "PostgreSQL", "Redis", "Celery", "JWT", "Nginx"] },
  { cat: "AI / ML", items: ["XGBoost", "PyTorch LSTM", "Prophet", "Groq Llama 3", "Whisper", "SHAP"] },
  { cat: "Blockchain", items: ["Solidity 0.8", "Sepolia", "Hardhat", "MetaMask", "Infura", "IPFS"] },
];

export const TechStack = () => (
  <section className="relative py-28 border-t border-border/60">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/5 text-xs font-mono uppercase tracking-wider text-secondary mb-4">
          Stack
        </div>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
          Built on <span className="gradient-text">free, open infrastructure.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          ₹0 build cost. ₹0 cost to the farmer. Every API and dataset documented in the spec.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stack.map((col, i) => (
          <motion.div
            key={col.cat}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="neon-card p-6"
          >
            <div className="font-mono text-xs text-primary mb-4 uppercase tracking-widest">{col.cat}</div>
            <ul className="space-y-2">
              {col.items.map((it) => (
                <li key={it} className="flex items-center gap-2 text-sm text-foreground/90">
                  <span className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                  {it}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
