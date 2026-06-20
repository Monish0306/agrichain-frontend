// src/components/IndiaMap.tsx
import { motion } from "framer-motion";

// FIX 1: SVG used shared hardcoded ids — id="indGlow", id="indStroke", id="indGrid"
// If IndiaMap ever renders more than once on the page (e.g. Monitor overview + Analytics tab),
// both instances share the same defs and the second one breaks visually.
// Fix: unique uid per instance

// FIX 2: <motion.circle> with animate={{ r: [20, 50] }} — animating SVG attribute `r`
// via Framer Motion's animate prop does NOT work reliably across browsers.
// SVG presentation attributes (r, cx, cy) must be animated via CSS or SMIL,
// not JS style. Fix: use CSS @keyframes for the pulse ring.

// FIX 3: All state blobs used the same color hsl(142 100% 55%) regardless of
// transaction volume — high-volume states (TN=184, KA=162) looked identical
// to low-volume states (JK=22). Fix: interpolate color from cyan→lime based on volume.

const states = [
  { code: "JK", name: "J&K",              cx: 180, cy: 60,  v: 22  },
  { code: "PB", name: "Punjab",           cx: 195, cy: 110, v: 78  },
  { code: "HR", name: "Haryana",          cx: 215, cy: 135, v: 62  },
  { code: "DL", name: "Delhi",            cx: 230, cy: 150, v: 88  },
  { code: "RJ", name: "Rajasthan",        cx: 175, cy: 195, v: 54  },
  { code: "UP", name: "Uttar Pradesh",    cx: 270, cy: 175, v: 96  },
  { code: "BR", name: "Bihar",            cx: 330, cy: 195, v: 71  },
  { code: "WB", name: "W.Bengal",         cx: 370, cy: 235, v: 64  },
  { code: "MH", name: "Maharashtra",      cx: 215, cy: 290, v: 142 },
  { code: "GJ", name: "Gujarat",          cx: 140, cy: 260, v: 96  },
  { code: "KA", name: "Karnataka",        cx: 230, cy: 360, v: 162 },
  { code: "TN", name: "Tamil Nadu",       cx: 265, cy: 425, v: 184 },
  { code: "AP", name: "Andhra Pradesh",   cx: 285, cy: 365, v: 121 },
  { code: "KL", name: "Kerala",           cx: 235, cy: 440, v: 88  },
];

const MAX_V = Math.max(...states.map(s => s.v));

// FIX 3: Color based on volume — low=cyan, mid=lime, high=amber
const getStateColor = (v: number) => {
  const t = v / MAX_V; // 0 → 1
  if (t > 0.75) return { fill: "hsl(38  100% 60%)", stroke: "hsl(38  100% 75%)", glow: "hsl(38  100% 60%)" }; // amber  — highest
  if (t > 0.45) return { fill: "hsl(142 100% 58%)", stroke: "hsl(142 100% 72%)", glow: "hsl(142 100% 58%)" }; // lime   — mid
  return              { fill: "hsl(168 100% 52%)", stroke: "hsl(168 100% 70%)", glow: "hsl(168 100% 52%)" }; // cyan   — low
};

// Top state by volume — gets the animated pulse ring
const topState = states.reduce((a, b) => (a.v > b.v ? a : b));

export const IndiaMap = () => {
  const uid = Math.random().toString(36).slice(2, 7);

  return (
    <svg
      viewBox="0 0 480 500"
      className="w-full h-full"
      role="img"
      aria-label="India transaction density map"
    >
      <defs>
        {/* FIX 1: unique IDs */}
        <radialGradient id={`indGlow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="hsl(142 100% 60%)" stopOpacity="0.95" />
          <stop offset="60%"  stopColor="hsl(142 100% 50%)" stopOpacity="0.4"  />
          <stop offset="100%" stopColor="hsl(142 100% 50%)" stopOpacity="0"    />
        </radialGradient>

        <radialGradient id={`indGlowAmber-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="hsl(38 100% 60%)" stopOpacity="0.95" />
          <stop offset="60%"  stopColor="hsl(38 100% 50%)" stopOpacity="0.4"  />
          <stop offset="100%" stopColor="hsl(38 100% 50%)" stopOpacity="0"    />
        </radialGradient>

        <radialGradient id={`indGlowCyan-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="hsl(168 100% 55%)" stopOpacity="0.95" />
          <stop offset="60%"  stopColor="hsl(168 100% 45%)" stopOpacity="0.4"  />
          <stop offset="100%" stopColor="hsl(168 100% 45%)" stopOpacity="0"    />
        </radialGradient>

        <linearGradient id={`indStroke-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="hsl(142 100% 60%)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="hsl(168 100% 55%)" stopOpacity="0.6" />
        </linearGradient>

        <pattern id={`indGrid-${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="hsl(142 100% 60%)"
            strokeOpacity="0.06"
            strokeWidth="0.5"
          />
        </pattern>

        {/* FIX 2: CSS keyframe pulse — animates SVG correctly without Framer Motion r issue */}
        <style>{`
          @keyframes ind-pulse-${uid} {
            0%   { r: 20px; opacity: 0.8; }
            100% { r: 55px; opacity: 0;   }
          }
          .ind-pulse-${uid} {
            animation: ind-pulse-${uid} 2.2s ease-out infinite;
          }
          @keyframes ind-pulse2-${uid} {
            0%   { r: 20px; opacity: 0.5; }
            100% { r: 45px; opacity: 0;   }
          }
          .ind-pulse2-${uid} {
            animation: ind-pulse2-${uid} 2.2s ease-out 1.1s infinite;
          }
        `}</style>
      </defs>

      {/* Background */}
      <rect width="480" height="500" fill="hsl(160 60% 3%)" />
      <rect width="480" height="500" fill={`url(#indGrid-${uid})`} />

      {/* Country outline */}
      <path
        d="M 175 50 L 220 45 L 260 70 L 290 105 L 330 130 L 380 175 L 405 230
           L 395 290 L 365 355 L 330 410 L 290 460 L 250 480 L 220 470 L 200 430
           L 220 380 L 200 320 L 150 290 L 110 250 L 105 200 L 130 150 L 155 95 Z"
        fill="hsl(160 60% 7%)"
        stroke={`url(#indStroke-${uid})`}
        strokeWidth="1.5"
        opacity="0.9"
      />

      {/* State density blobs */}
      {states.map((s, i) => {
        const t      = s.v / MAX_V;
        const r      = 7 + t * 20;
        const colors = getStateColor(s.v);
        const glowId = t > 0.75
          ? `indGlowAmber-${uid}`
          : t > 0.45
          ? `indGlow-${uid}`
          : `indGlowCyan-${uid}`;

        return (
          <g key={s.code}>
            {/* Glow halo */}
            <motion.circle
              cx={s.cx}
              cy={s.cy}
              r={r * 2}
              fill={`url(#${glowId})`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.5,  scale: 1 }}
              transition={{ delay: 0.15 + i * 0.04, duration: 0.6 }}
            />

            {/* Main dot — FIX 3: color varies by volume */}
            <motion.circle
              cx={s.cx}
              cy={s.cy}
              r={r}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth="1"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.92, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 220, damping: 14 }}
            />

            {/* Highlight dot */}
            <circle
              cx={s.cx - r * 0.25}
              cy={s.cy - r * 0.25}
              r={r * 0.22}
              fill="white"
              fillOpacity="0.35"
            />

            {/* State label */}
            <motion.text
              x={s.cx}
              y={s.cy + r + 13}
              textAnchor="middle"
              fontSize="8.5"
              fontFamily="monospace"
              fill="hsl(150 25% 82%)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.04 }}
            >
              {s.code}
            </motion.text>
            <motion.text
              x={s.cx}
              y={s.cy + r + 23}
              textAnchor="middle"
              fontSize="7"
              fontFamily="monospace"
              fill={colors.fill}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.04 }}
            >
              {s.v}
            </motion.text>
          </g>
        );
      })}

      {/* FIX 2: Pulse ring on top state using CSS animation — no Framer Motion r bug */}
      <circle
        cx={topState.cx}
        cy={topState.cy}
        r={20}
        fill="none"
        stroke="hsl(38 100% 60%)"
        strokeWidth="1.5"
        className={`ind-pulse-${uid}`}
      />
      <circle
        cx={topState.cx}
        cy={topState.cy}
        r={20}
        fill="none"
        stroke="hsl(38 100% 60%)"
        strokeWidth="1"
        strokeOpacity="0.5"
        className={`ind-pulse2-${uid}`}
      />

      {/* Legend */}
      <g transform="translate(10, 460)">
        <text fontSize="7" fontFamily="monospace" fill="hsl(150 20% 55%)">Transaction density</text>
        {[
          { color: "hsl(168 100% 52%)", label: "Low"  },
          { color: "hsl(142 100% 58%)", label: "Mid"  },
          { color: "hsl(38  100% 60%)", label: "High" },
        ].map((l, i) => (
          <g key={l.label} transform={`translate(${i * 60}, 10)`}>
            <circle cx={5} cy={5} r={5} fill={l.color} fillOpacity="0.9" />
            <text x={13} y={9} fontSize="7" fontFamily="monospace" fill="hsl(150 20% 65%)">{l.label}</text>
          </g>
        ))}
      </g>

      {/* Top state callout */}
      <motion.g
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <rect
          x={topState.cx + 15}
          y={topState.cy - 18}
          width={78}
          height={26}
          rx={4}
          fill="hsl(160 60% 6%)"
          stroke="hsl(38 100% 60%)"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
        <text
          x={topState.cx + 54}
          y={topState.cy - 6}
          textAnchor="middle"
          fontSize="7"
          fontFamily="monospace"
          fill="hsl(38 100% 70%)"
        >
          ★ {topState.name}
        </text>
        <text
          x={topState.cx + 54}
          y={topState.cy + 5}
          textAnchor="middle"
          fontSize="7"
          fontFamily="monospace"
          fill="hsl(150 20% 60%)"
        >
          {topState.v} transactions
        </text>
      </motion.g>
    </svg>
  );
};