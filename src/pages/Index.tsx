// src/pages/Index.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar }       from "@/components/Navbar";
import { Hero }         from "@/components/Hero";
import { Modules }      from "@/components/Modules";
import { FlowSection }  from "@/components/FlowSection";
import { Portals }      from "@/components/Portals";
import { TechStack }    from "@/components/TechStack";
import { Footer }       from "@/components/Footer";
import { getAuth }      from "../store/auth";

// ── Index (Landing Page) ──────────────────────────────────────────────────────
// Improvements over original:
// 1. If user is already logged in → redirect straight to their portal
// 2. Smooth scroll behaviour for anchor links (Portals section uses #farmer etc)
// 3. Scroll-to-top on mount
// 4. Page title set correctly

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set page title
    document.title = "AgriChain — No broker. No delay. Just a fair price.";

    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: "smooth" });

    // If already logged in, redirect to correct portal
    const user = getAuth();
    if (user?.access_token) {
      if      (user.role === "farmer")   navigate("/farmer",   { replace: true });
      else if (user.role === "merchant") navigate("/merchant", { replace: true });
      else if (user.role === "monitor")  navigate("/monitor",  { replace: true });
    }

    // Enable smooth scrolling for anchor links (#modules, #portals etc)
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main>
        {/* Each section has an id for smooth anchor scrolling */}
        <section id="home">
          <Hero />
        </section>

        <section id="modules">
          <Modules />
        </section>

        <section id="flow">
          <FlowSection />
        </section>

        <section id="portals">
          <Portals />
        </section>

        <section id="tech">
          <TechStack />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;