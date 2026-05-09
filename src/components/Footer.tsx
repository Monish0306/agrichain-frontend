import { Leaf } from "lucide-react";

export const Footer = () => (
  <footer className="relative border-t border-border/60 py-12 mt-12">
    <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <Leaf className="w-5 h-5 text-primary" />
        <span className="font-display font-bold">AgriChain Intelligence Platform</span>
      </div>
      <div className="font-mono text-xs text-muted-foreground text-center md:text-right">
        Tagline · "No broker. No delay. No exploitation. Just a farmer and a fair price."<br />
        Built for 140M farmers · Tamil · Kannada · Telugu · Hindi · English
      </div>
    </div>
  </footer>
);
