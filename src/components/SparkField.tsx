import { useEffect, useRef, useState } from "react";

interface Spark {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
}

const COLORS = ["hsl(142 100% 60%)", "hsl(168 100% 55%)", "hsl(38 100% 60%)"];

export const SparkField = ({ density = 1 }: { density?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    let mounted = true;
    let id = 0;
    const interval = setInterval(() => {
      if (!mounted || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const newSparks: Spark[] = Array.from({ length: Math.ceil(2 * density) }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 140;
        return {
          id: id++,
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
      });
      setSparks((prev) => [...prev.slice(-30), ...newSparks]);
    }, 220);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [density]);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparks.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.x,
            top: s.y,
            width: 3,
            height: 3,
            background: s.color,
            boxShadow: `0 0 8px ${s.color}, 0 0 16px ${s.color}`,
            // @ts-expect-error css vars
            "--tx": `${s.tx}px`,
            "--ty": `${s.ty}px`,
            animation: "spark-fly 1.4s ease-out forwards",
          }}
        />
      ))}
    </div>
  );
};
