import { motion } from "framer-motion";

interface Props {
  label?: string;
}

// Stylized mini farm-location map for listing cards.
export const MiniMap = ({ label = "Farm" }: Props) => (
  <svg viewBox="0 0 200 80" className="w-full h-full">
    <defs>
      <pattern id="mm-grid" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(168 100% 55%)" strokeOpacity="0.12" strokeWidth="0.5" />
      </pattern>
      <radialGradient id="mm-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(142 100% 60%)" stopOpacity="0.8" />
        <stop offset="100%" stopColor="hsl(142 100% 60%)" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="200" height="80" fill="hsl(160 50% 5%)" />
    <rect width="200" height="80" fill="url(#mm-grid)" />
    {/* Roads */}
    <path d="M 0 50 Q 80 20 200 40" stroke="hsl(168 100% 55%)" strokeOpacity="0.4" strokeWidth="1.2" fill="none" />
    <path d="M 30 0 L 60 80" stroke="hsl(142 100% 55%)" strokeOpacity="0.3" strokeWidth="1" fill="none" />
    <path d="M 140 0 L 170 80" stroke="hsl(142 100% 55%)" strokeOpacity="0.3" strokeWidth="1" fill="none" />
    {/* Pin */}
    <motion.circle
      cx={100}
      cy={40}
      r={14}
      fill="url(#mm-glow)"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <circle cx={100} cy={40} r={4} fill="hsl(142 100% 60%)" />
    <circle cx={100} cy={40} r={4} fill="none" stroke="hsl(142 100% 70%)" strokeWidth="0.8" />
    <text x={100} y={66} textAnchor="middle" fontSize="8" className="font-mono" fill="hsl(150 25% 75%)">
      {label}
    </text>
  </svg>
);
