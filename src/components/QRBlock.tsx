// src/components/QRBlock.tsx
// Decorative QR-like SVG — represents blockchain provenance / crop traceability

interface Props {
  size?:  number;
  value?: string; // optional string to vary the pattern (e.g. listing ID)
  glow?:  boolean;
}

// FIX 1: Corner marker logic was wrong — the condition checked inCorner twice
// (redundant) and the border/fill pattern for QR corner squares was incorrect.
// Real QR corners = 7x7 with: outer border ring (all 1s), 1-cell gap (all 0s),
// inner 3x3 filled block. Your code used cells=11 with 3x3 corner markers
// but the pattern logic `cornerX === 0 || cornerY === 0 || (cornerX === 1 && cornerY === 1)`
// produced an irregular L-shape instead of a proper corner square.
// Fix: rewrite corner detection with correct QR-spec border + inner fill logic.

// FIX 2: `Math.sin(i * 12.9898 + 78.233) * 43758.5453 % 1` — the `% 1` operator
// in JS on a large float can return NEGATIVE values (e.g. -0.3).
// So `-0.3 > 0.5` is false → cell is 0 → fewer cells filled → QR looks sparse.
// Fix: use Math.abs() before the modulo.

// FIX 3: No aria-label or role on the SVG — screen readers read it as blank.
// Also no visual glow effect even though this represents blockchain provenance
// which should look impressive on the Merchant card.

const seededRandom = (seed: number): number => {
  // FIX 2: Math.abs ensures result is always 0–1
  return Math.abs((Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1);
};

// FIX 1: Correct QR corner marker — returns 1 (filled), 0 (empty), -1 (skip/let data fill)
const getCornerValue = (x: number, y: number, cells: number): number | null => {
  const isTopLeft     = x < 7 && y < 7;
  const isTopRight    = x >= cells - 7 && y < 7;
  const isBottomLeft  = x < 7 && y >= cells - 7;

  if (!isTopLeft && !isTopRight && !isBottomLeft) return null; // not in corner zone

  // Local coords within corner
  const lx = isTopRight    ? x - (cells - 7) : x;
  const ly = isBottomLeft  ? y - (cells - 7) : y;

  // Outer border (ring of 1s)
  if (lx === 0 || lx === 6 || ly === 0 || ly === 6) return 1;
  // Gap ring (0s)
  if (lx === 1 || lx === 5 || ly === 1 || ly === 5) return 0;
  // Inner 3x3 filled block
  return 1;
};

export const QRBlock = ({ size = 80, value = "agrichain", glow = true }: Props) => {
  const cells    = 13; // 13×13 gives better visual density
  const cellSize = size / cells;
  const padding  = cellSize * 0.06; // tiny gap between cells

  // Seed from value string for deterministic variation per listing
  const strSeed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const pattern = Array.from({ length: cells * cells }, (_, i) => {
    const x = i % cells;
    const y = Math.floor(i / cells);

    // FIX 1: Check corners first with correct QR logic
    const cornerVal = getCornerValue(x, y, cells);
    if (cornerVal !== null) return cornerVal;

    // Data cells — seeded pseudo-random
    return seededRandom(i + strSeed) > 0.45 ? 1 : 0;
  });

  // Color per cell — mostly lime, some cyan for variety
  const getCellColor = (i: number): string => {
    const r = seededRandom(i * 3.7 + strSeed);
    if (r > 0.85) return "hsl(168 100% 55%)"; // cyan  — 15%
    if (r > 0.75) return "hsl(38  100% 60%)"; // amber —  5% (rare, looks like data bits)
    return "hsl(142 100% 60%)";                // lime  — 80%
  };

  return (
    <div className="relative inline-block">
      {/* FIX 3: Glow effect behind QR */}
      {glow && (
        <div
          className="absolute inset-0 rounded-md blur-xl opacity-40 pointer-events-none"
          style={{ background: "hsl(142 100% 60%)" }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative rounded-md block"
        role="img"
        aria-label="Blockchain provenance QR code for crop traceability"
      >
        {/* Background */}
        <rect width={size} height={size} fill="hsl(160 50% 5%)" rx={cellSize * 0.5} />

        {/* Quiet zone border */}
        <rect
          width={size}
          height={size}
          fill="none"
          stroke="hsl(142 100% 60%)"
          strokeWidth="0.6"
          strokeOpacity="0.3"
          rx={cellSize * 0.5}
        />

        {/* QR cells */}
        {pattern.map((v, i) => {
          if (!v) return null;
          const cx = (i % cells) * cellSize + padding;
          const cy = Math.floor(i / cells) * cellSize + padding;
          const cw = cellSize - padding * 2;
          const x  = i % cells;
          const y  = Math.floor(i / cells);

          // Corner cells always lime, no glow variation
          const isCorner = getCornerValue(x, y, cells) !== null;
          const fill     = isCorner ? "hsl(142 100% 62%)" : getCellColor(i);

          return (
            <rect
              key={i}
              x={cx}
              y={cy}
              width={cw}
              height={cw}
              fill={fill}
              rx={isCorner ? 0 : cw * 0.18}
              opacity={isCorner ? 1 : 0.85 + seededRandom(i * 7.3) * 0.15}
            />
          );
        })}

        {/* Centre eye — AgriChain logo dot */}
        <rect
          x={size / 2 - cellSize}
          y={size / 2 - cellSize}
          width={cellSize * 2}
          height={cellSize * 2}
          fill="hsl(142 100% 60%)"
          rx={cellSize * 0.3}
          opacity="0.9"
        />
        <rect
          x={size / 2 - cellSize * 0.5}
          y={size / 2 - cellSize * 0.5}
          width={cellSize}
          height={cellSize}
          fill="hsl(160 50% 5%)"
          rx={cellSize * 0.2}
        />
      </svg>
    </div>
  );
};