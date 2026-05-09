import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/farmer", label: "Farmer" },
  { to: "/merchant", label: "Merchant" },
  { to: "/monitor", label: "Monitor" },
];

export const Navbar = () => {
  const { pathname } = useLocation();
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/40 border-b border-border/60"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 blur-lg group-hover:blur-xl transition-all" />
            <Leaf className="relative w-6 h-6 text-primary" strokeWidth={2.4} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Agri<span className="text-glow-lime">Chain</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary/10 ring-1 ring-primary/40"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/farmer"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-neon-lime hover:shadow-[0_0_32px_hsl(var(--primary)/0.7)] transition-shadow"
        >
          Launch App
          <span className="pulse-dot" />
        </Link>
      </div>
    </motion.header>
  );
};
