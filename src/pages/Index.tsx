import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Modules } from "@/components/Modules";
import { FlowSection } from "@/components/FlowSection";
import { Portals } from "@/components/Portals";
import { TechStack } from "@/components/TechStack";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Modules />
        <FlowSection />
        <Portals />
        <TechStack />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
