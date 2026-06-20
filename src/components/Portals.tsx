// src/components/Portals.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Leaf, Tractor, ShieldCheck, ArrowRight } from "lucide-react";
import { getAuth } from "../store/auth";

// FIX 1: Used dynamic Tailwind classes like `bg-${p.color}/10`, `text-${p.color}`
// Tailwind PURGES dynamic classes at build time — colors never showed up
// Fix: use full static class strings per portal
const portals = [
  {
    to:          "/login",
    icon:        Tractor,
    name:        "Farmer Portal",
    auth:        "Phone + Name · 7 languages · Voice enabled",
    body:        "Mobile-first advisory. AI crop recommendation, disease detection, weather forecast, price intelligence, marketplace listing and finance planning.",
    iconBg:      "bg-primary/10 ring-1 ring-primary/30",
    iconGlow:    "shadow-neon-lime",
    iconColor:   "text-primary",
    cardBorder:  "hover:border-primary/60",
    labelColor:  "text-primary",
    role:        "farmer",
  },
  {
    to:          "/login",
    icon:        Leaf,
    name:        "Merchant Portal",
    auth:        "Email + Password · GST verified · KYC",
    body:        "Browse live crop listings with filters, place escrow-backed orders, manage your order pipeline with Kanban view, and verify blockchain provenance.",
    iconBg:      "bg-secondary/10 ring-1 ring-secondary/30",
    iconGlow:    "shadow-neon-cyan",
    iconColor:   "text-secondary",
    cardBorder:  "hover:border-secondary/60",
    labelColor:  "text-secondary",
    role:        "merchant",
  },
  {
    to:          "/login",
    icon:        ShieldCheck,
    name:        "Monitor Dashboard",
    auth:        "Restricted · 2h JWT · Fully audited",
    body:        "India-wide telemetry, subsidy disbursement tracking, AI fraud detection, immutable blockchain audit trail and real-time geographic distribution.",
    iconBg:      "bg-accent/10 ring-1 ring-accent/30",
    iconGlow:    "shadow-neon-amber",
    iconColor:   "text-accent",
    cardBorder:  "hover:border-accent/60",
    labelColor:  "text-accent",
    role:        "monitor",
  },
];

export const Portals = () => {
  const user = getAuth();

  // FIX 2: If already logged in, clicking a portal card should go
  // directly to that portal — not back to login
  const getPortalLink = (role: string, defaultTo: string) => {
    if (user?.role === role) {
      return `/${role}`;
    }
    return defaultTo;
  };

  return (
    <section id="portals" className="relative py-28 overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative">

        {/* Header */}
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
            Built for{" "}
            <span className="gradient-text">every stakeholder.</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Whether you grow it, buy it, or govern it — AgriChain has a portal built exactly for you.
          </p>
        </motion.div>

        {/* Portal cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {portals.map((p, i) => {
            const href = getPortalLink(p.role, p.to);
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
              >
                {/* FIX 3: Was using <a href="/login"> — hard page reload on every click
                    React Router <Link to="..."> does client-side navigation (instant, no reload) */}
                <Link
                  to={href}
                  className={`block neon-card p-8 h-full group transition-all duration-300 ${p.cardBorder}`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${p.iconBg} ${p.iconGlow} group-hover:scale-110 transition-transform duration-300`}>
                    <p.icon className={`w-7 h-7 ${p.iconColor}`} strokeWidth={2.4} />
                  </div>

                  {/* Auth badge */}
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                    {p.auth}
                  </div>

                  {/* Name */}
                  <h3 className="font-display text-2xl font-bold mb-3">{p.name}</h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {p.body}
                  </p>

                  {/* CTA */}
                  <div className={`inline-flex items-center gap-2 text-sm font-semibold ${p.labelColor} group-hover:gap-3 transition-all duration-200`}>
                    {user?.role === p.role ? `Go to ${p.name}` : `Enter ${p.name}`}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Farmers onboarded",    value: "14,000+", color: "text-primary"   },
            { label: "Live crop listings",   value: "1,200+",  color: "text-secondary" },
            { label: "Trade volume",         value: "₹28 Cr",  color: "text-accent"    },
            { label: "States covered",       value: "18",      color: "text-primary"   },
          ].map((s, i) => (
            <div
              key={s.label}
              className="neon-card p-4 text-center"
            >
              <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};