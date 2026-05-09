import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Tractor, ShieldCheck } from "lucide-react";

const portals = [
  {
    to: "/login",
    icon: Tractor,
    name: "Farmer Portal",
    auth: "Phone + OTP · 5 languages",
    body: "Mobile-first, voice-enabled. Crop advisory, weather, pricing, finance, marketplace.",
    color: "primary",
    glow: "shadow-neon-lime",
  },
  {
    to: "/login",
    icon: Leaf,
    name: "Merchant Portal",
    auth: "Email + GST verification",
    body: "Browse listings, place orders, manage Kanban pipeline, view blockchain provenance.",
    color: "secondary",
    glow: "shadow-neon-cyan",
  },
  {
    to: "/login",
    icon: ShieldCheck,
    name: "Monitor Dashboard",
    auth: "Restricted · 2h JWT · audited",
    body: "India-wide telemetry. Subsidy disbursement. Fraud flags. Immutable audit trail.",
    color: "accent",
    glow: "shadow-neon-amber",
  },
];

export const Portals = () => (
  <section className="relative py-28">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono uppercase tracking-wider text-primary mb-4">
          Three Portals · One Platform
        </div>
        <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
          Built for <span className="gradient-text">every stakeholder.</span>
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {portals.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <a href="/login" className="block neon-card p-8 h-full group">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-${p.color}/10 ring-1 ring-${p.color}/30 ${p.glow}`}>
                <p.icon className={`w-7 h-7 text-${p.color}`} strokeWidth={2.4} />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{p.auth}</div>
              <h3 className="font-display text-2xl font-bold mb-3">{p.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{p.body}</p>
              <div className={`inline-flex items-center gap-2 text-sm font-semibold text-${p.color} group-hover:gap-3 transition-all`}>
                Enter {p.name} <span>→</span>
              </div>
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
