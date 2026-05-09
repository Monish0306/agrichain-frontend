import { motion } from "framer-motion";

// Stylized India SVG — 14 major states as glowing blobs at approx geo positions.
// Not geographically perfect — designed for the cyber-aesthetic dashboard.
const states = [
  { code: "JK", name: "J&K",     cx: 180, cy: 60,  v: 22 },
  { code: "PB", name: "Punjab",  cx: 195, cy: 110, v: 78 },
  { code: "HR", name: "Haryana", cx: 215, cy: 135, v: 62 },
  { code: "DL", name: "Delhi",   cx: 230, cy: 150, v: 88 },
  { code: "RJ", name: "Rajasthan",cx: 175, cy: 195, v: 54 },
  { code: "UP", name: "Uttar Pradesh", cx: 270, cy: 175, v: 96 },
  { code: "BR", name: "Bihar",   cx: 330, cy: 195, v: 71 },
  { code: "WB", name: "W.Bengal",cx: 370, cy: 235, v: 64 },
  { code: "MH", name: "Maharashtra", cx: 215, cy: 290, v: 142 },
  { code: "GJ", name: "Gujarat", cx: 140, cy: 260, v: 96 },
  { code: "KA", name: "Karnataka", cx: 230, cy: 360, v: 162 },
  { code: "TN", name: "Tamil Nadu", cx: 265, cy: 425, v: 184 },
  { code: "AP", name: "Andhra Pradesh", cx: 285, cy: 365, v: 121 },
  { code: "KL", name: "Kerala",  cx: 235, cy: 440, v: 88 },
];

const max = Math.max(...states.map((s) => s.v));

export const IndiaMap = () => (
  <svg viewBox="0 0 480 500" className="w-full h-full" role="img" aria-label="India transaction density map">
    <defs>
      <radialGradient id="indGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(142 100% 60%)" stopOpacity="0.95" />
        <stop offset="60%" stopColor="hsl(142 100% 50%)" stopOpacity="0.4" />
        <stop offset="100%" stopColor="hsl(142 100% 50%)" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="indStroke" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(142 100% 60%)" stopOpacity="0.6" />
        <stop offset="100%" stopColor="hsl(168 100% 55%)" stopOpacity="0.6" />
      </linearGradient>
      <pattern id="indGrid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(142 100% 60%)" strokeOpacity="0.06" strokeWidth="0.5" />
      </pattern>
    </defs>

    <rect width="480" height="500" fill="url(#indGrid)" />

    {/* Stylized country outline (rough) */}
    <path
      d="M 175 50 L 220 45 L 260 70 L 290 105 L 330 130 L 380 175 L 405 230 L 395 290 L 365 355 L 330 410 L 290 460 L 250 480 L 220 470 L 200 430 L 220 380 L 200 320 L 150 290 L 110 250 L 105 200 L 130 150 L 155 95 Z"
      fill="hsl(160 60% 8%)"
      stroke="url(#indStroke)"
      strokeWidth="1.5"
      opacity="0.85"
    />

    {/* State density blobs */}
    {states.map((s, i) => {
      const r = 8 + (s.v / max) * 18;
      return (
        <g key={s.code}>
          <motion.circle
            cx={s.cx}
            cy={s.cy}
            r={r * 1.8}
            fill="url(#indGlow)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.55, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.04, duration: 0.6 }}
          />
          <motion.circle
            cx={s.cx}
            cy={s.cy}
            r={r}
            fill="hsl(142 100% 55%)"
            stroke="hsl(142 100% 70%)"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.04, type: "spring", stiffness: 200 }}
          />
          <text
            x={s.cx}
            y={s.cy + r + 12}
            textAnchor="middle"
            className="font-mono"
            fontSize="9"
            fill="hsl(150 25% 88%)"
          >
            {s.code} · {s.v}
          </text>
        </g>
      );
    })}

    {/* Pulse on Tamil Nadu (highest) */}
    <motion.circle
      cx={265}
      cy={425}
      r={20}
      fill="none"
      stroke="hsl(142 100% 60%)"
      strokeWidth="1.5"
      animate={{ r: [20, 50], opacity: [0.8, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </svg>
);
