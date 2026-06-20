// src/components/SparkField.tsx
import { useEffect, useRef, useState, useCallback } from "react";

interface Spark {
  id:     number;
  x:      number;
  y:      number;
  tx:     number;
  ty:     number;
  size:   number;
  color:  string;
  dur:    number;
}

const COLORS = [
  "hsl(142 100% 60%)",  // lime   — primary
  "hsl(168 100% 55%)",  // cyan   — secondary
  "hsl(38  100% 60%)",  // amber  — accent
  "hsl(200 100% 65%)",  // blue
  "hsl(280 100% 70%)",  // purple
];

// FIX 1: `spark-fly` keyframe animation used CSS vars --tx and --ty
// BUT the @keyframes were never defined anywhere in index.css or tailwind config
// so the sparks were created but NEVER MOVED — they just appeared and faded in place.
// Fix: inject the keyframe directly into a <style> tag from this component
// so it works regardless of what's in index.css
const KEYFRAME_STYLE = `
@keyframes spark-fly {
  0%   { transform: translate(0, 0)               scale(1);   opacity: 1; }
  60%  { transform: translate(var(--tx), var(--ty)) scale(1.4); opacity: 0.8; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0);   opacity: 0; }
}
@keyframes spark-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1);   }
  50%       { opacity: 1;   transform: scale(1.3); }
}
`;

export const SparkField = ({ density = 1 }: { density?: number }) => {
  const ref          = useRef<HTMLDivElement>(null);
  const idRef        = useRef(0);
  const [sparks, setSparks] = useState<Spark[]>([]);

  // FIX 2: Memory leak — sparks array grew unbounded.
  // `prev.slice(-30)` only kept last 30 BUT new sparks were added every 220ms
  // At density=1.4: 3 sparks × (1000/220) = ~13 sparks/sec × 30 cap
  // = array always at max, causing constant re-renders and lag on low-end devices.
  // Fix: cap total sparks at 20 and clear expired ones properly
  const MAX_SPARKS = Math.ceil(20 * Math.min(density, 2));

  const spawnSparks = useCallback(() => {
    if (!ref.current) return;
    const rect  = ref.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const count = Math.ceil(2 * density);
    const newSparks: Spark[] = Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 50 + Math.random() * 120;
      return {
        id:    idRef.current++,
        x:     Math.random() * rect.width,
        y:     Math.random() * rect.height,
        tx:    Math.cos(angle) * dist,
        ty:    Math.sin(angle) * dist,
        size:  2 + Math.random() * 2.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        dur:   1.1 + Math.random() * 0.6,
      };
    });

    setSparks(prev => [...prev.slice(-(MAX_SPARKS - count)), ...newSparks]);
  }, [density, MAX_SPARKS]);

  useEffect(() => {
    const interval = setInterval(spawnSparks, 240);
    return () => clearInterval(interval);
  }, [spawnSparks]);

  return (
    <>
      {/* Inject keyframes once */}
      <style>{KEYFRAME_STYLE}</style>

      <div
        ref={ref}
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {sparks.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left:      s.x,
              top:       s.y,
              width:     s.size,
              height:    s.size,
              background: s.color,
              boxShadow: `0 0 ${s.size * 3}px ${s.color}, 0 0 ${s.size * 6}px ${s.color}`,
              // CSS custom properties for the keyframe animation
              ["--tx" as any]: `${s.tx}px`,
              ["--ty" as any]: `${s.ty}px`,
              animation: `spark-fly ${s.dur}s ease-out forwards`,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>
    </>
  );
};