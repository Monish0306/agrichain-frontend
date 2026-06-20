// src/components/Navbar.tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Menu, X, LogOut } from "lucide-react";
import { getAuth, clearAuth } from "../store/auth";

const NAV_LINKS = [
  { to: "/",        label: "Home"     },
  { to: "/farmer",  label: "Farmer"   },
  { to: "/merchant",label: "Merchant" },
  { to: "/monitor", label: "Monitor"  },
];

export const Navbar = () => {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const user         = getAuth();

  // FIX 1: No mobile menu — on small screens the nav was completely hidden
  // and the Launch App button had no mobile equivalent
  const [menuOpen,   setMenuOpen]   = useState(false);

  // FIX 2: No scroll detection — navbar looked same whether user
  // scrolled or not, making it feel flat on landing page
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // FIX 3: "Launch App" always went to /farmer even if merchant/monitor
  // was already logged in — now goes to correct portal
  const launchHref =
    user?.role === "merchant" ? "/merchant" :
    user?.role === "monitor"  ? "/monitor"  : "/farmer";

  const launchLabel = user
    ? `Go to ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`
    : "Launch App";

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-2xl bg-background/80 border-border/80 shadow-lg shadow-background/20"
          : "backdrop-blur-xl  bg-background/40 border-border/60"
      }`}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 blur-lg group-hover:blur-xl transition-all" />
            <Leaf className="relative w-6 h-6 text-primary" strokeWidth={2.4} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Agri<span className="text-glow-lime">Chain</span>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
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

        {/* ── Right side ── */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {/* Show username if logged in */}
          {user && (
            <span className="text-xs text-muted-foreground font-mono hidden lg:block">
              {user.name}
            </span>
          )}

          <Link
            to={launchHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-neon-lime hover:shadow-[0_0_32px_hsl(var(--primary)/0.7)] transition-all hover:scale-105"
          >
            {launchLabel}
            <span className="pulse-dot" />
          </Link>

          {/* Logout button — only shows when logged in */}
          {user && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          onClick={() => setMenuOpen(p => !p)}
          className="md:hidden p-2 rounded-xl border border-border/60 hover:border-primary/40 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen
            ? <X    className="w-5 h-5" />
            : <Menu className="w-5 h-5" />
          }
        </button>
      </div>

      {/* ── Mobile dropdown menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{    opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-border/60 bg-background/95 backdrop-blur-xl"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((l) => {
                const active = pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}

              <div className="pt-2 border-t border-border/40 mt-2 flex flex-col gap-2">
                <Link
                  to={launchHref}
                  className="w-full text-center px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  {launchLabel} →
                </Link>

                {user && (
                  <button
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive hover:text-white transition-colors"
                  >
                    Logout ({user.name})
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};