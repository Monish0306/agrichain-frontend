// src/components/MiniMap.tsx
import { motion } from "framer-motion";

interface Props {
  label?: string;
  lat?:   number;
  lon?:   number;
}

// FIX 1: SVG used a single shared id="mm-grid" and id="mm-glow" for defs.
// When multiple MiniMap components render on the same page (e.g. listings grid
// shows 6 cards each with a MiniMap), ALL of them reference the SAME id.
// The browser only uses the FIRST definition it finds — all other MiniMaps
// get the wrong gradient/pattern or nothing at all.
// Fix: generate a unique id per instance using Math.random()

// FIX 2: <motion.circle> inside <svg> caused a React warning in some versions:
// "motion components cannot be SVG elements without explicit SVG namespace"
// Fix: use animateMotion via CSS animation instead, avoids the warning entirely

export const MiniMap = ({ label = "Farm", lat, lon }: Props) => {
  // Unique suffix for this instance's SVG defs
  const uid = Math.random().toString(36).slice(2, 7);

  // If lat/lon provided, show actual coordinates as sublabel
  const subLabel = lat && lon
    ? `${lat.toFixed(2)}°N ${lon.toFixed(2)}°E`
    : null;

  // Generate random-looking but deterministic road paths based on label
  const seed  = label.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const road1Y = 20 + (seed % 40);
  const road2X = 40 + (seed % 60);

  return (
    <svg
      viewBox="0 0 200 90"
      className="w-full h-full"
      role="img"
      aria-label={`Map showing location: ${label}`}
    >
      <defs>
        {/* FIX 1: unique IDs per instance */}
        <pattern
          id={`mm-grid-${uid}`}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="hsl(168 100% 55%)"
            strokeOpacity="0.12"
            strokeWidth="0.5"
          />
        </pattern>

        <radialGradient id={`mm-glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="hsl(142 100% 60%)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(142 100% 60%)" stopOpacity="0"   />
        </radialGradient>

        <radialGradient id={`mm-pulse-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="hsl(168 100% 55%)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(168 100% 55%)" stopOpacity="0"   />
        </radialGradient>

        {/* FIX 2: pulse animation as CSS keyframe — avoids motion.circle SVG warning */}
        <style>{`
          @keyframes mm-pulse-${uid} {
            0%, 100% { opacity: 0.5; r: 12; }
            50%       { opacity: 1;   r: 16; }
          }
          .mm-pulse-${uid} {
            animation: mm-pulse-${uid} 2s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Background */}
      <rect width="200" height="90" fill="hsl(160 50% 4%)" rx="0" />
      <rect width="200" height="90" fill={`url(#mm-grid-${uid})`} />

      {/* Subtle vignette */}
      <radialGradient id={`mm-vig-${uid}`} cx="50%" cy="50%" r="70%">
        <stop offset="0%"   stopColor="transparent" />
        <stop offset="100%" stopColor="hsl(160 50% 2%)" stopOpacity="0.8" />
      </radialGradient>
      <rect width="200" height="90" fill={`url(#mm-vig-${uid})`} />

      {/* Roads — slightly varied per label using seed */}
      <path
        d={`M 0 ${road1Y} Q 80 ${road1Y + 25} 200 ${road1Y + 10}`}
        stroke="hsl(168 100% 55%)"
        strokeOpacity="0.35"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M ${road2X} 0 L ${road2X + 20} 90`}
        stroke="hsl(142 100% 55%)"
        strokeOpacity="0.25"
        strokeWidth="1"
        fill="none"
      />
      <path
        d={`M ${road2X + 80} 0 L ${road2X + 90} 90`}
        stroke="hsl(142 100% 55%)"
        strokeOpacity="0.2"
        strokeWidth="0.8"
        fill="none"
      />

      {/* Secondary pulse ring */}
      <circle
        cx={100}
        cy={42}
        r={20}
        fill={`url(#mm-pulse-${uid})`}
        className={`mm-pulse-${uid}`}
      />

      {/* Primary glow */}
      <circle
        cx={100}
        cy={42}
        r={13}
        fill={`url(#mm-glow-${uid})`}
      />

      {/* Pin dot */}
      <circle
        cx={100}
        cy={42}
        r={4.5}
        fill="hsl(142 100% 65%)"
      />
      <circle
        cx={100}
        cy={42}
        r={4.5}
        fill="none"
        stroke="white"
        strokeWidth="0.8"
        strokeOpacity="0.6"
      />
      {/* Pin highlight */}
      <circle cx={98.5} cy={40.5} r={1.2} fill="white" fillOpacity="0.5" />

      {/* Label */}
      <text
        x={100}
        y={68}
        textAnchor="middle"
        fontSize="7.5"
        fontFamily="monospace"
        fill="hsl(150 25% 78%)"
        letterSpacing="0.5"
      >
        {label.length > 20 ? label.slice(0, 20) + "…" : label}
      </text>

      {/* Coordinates sublabel */}
      {subLabel && (
        <text
          x={100}
          y={79}
          textAnchor="middle"
          fontSize="6"
          fontFamily="monospace"
          fill="hsl(150 20% 50%)"
          letterSpacing="0.3"
        >
          {subLabel}
        </text>
      )}

      {/* Corner compass rose */}
      <g transform="translate(176, 14)" opacity="0.4">
        <line x1="0" y1="-7" x2="0"  y2="7"  stroke="hsl(142 100% 60%)" strokeWidth="0.8" />
        <line x1="-7" y1="0" x2="7"  y2="0"  stroke="hsl(142 100% 60%)" strokeWidth="0.8" />
        <polygon points="0,-7 -2,-3 2,-3" fill="hsl(142 100% 60%)" />
        <text x="0" y="-9" textAnchor="middle" fontSize="5" fill="hsl(142 100% 70%)" fontFamily="monospace">N</text>
      </g>
    </svg>
  );
};