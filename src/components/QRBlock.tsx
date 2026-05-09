// Decorative QR-like SVG block — represents blockchain provenance code.
export const QRBlock = ({ size = 80 }: { size?: number }) => {
  const cells = 11;
  const cellSize = size / cells;
  // Deterministic pseudo-random pattern
  const pattern = Array.from({ length: cells * cells }, (_, i) => {
    const x = i % cells;
    const y = Math.floor(i / cells);
    // Position markers (corners)
    if ((x < 3 && y < 3) || (x > cells - 4 && y < 3) || (x < 3 && y > cells - 4)) {
      const inCorner =
        (x < 3 && y < 3) || (x > cells - 4 && y < 3) || (x < 3 && y > cells - 4);
      const cornerX = x < 3 ? x : cells - 1 - x;
      const cornerY = y < 3 ? y : cells - 1 - y;
      if (inCorner && (cornerX === 0 || cornerY === 0 || (cornerX === 1 && cornerY === 1))) return 1;
      if (inCorner) return 0;
    }
    return (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1 > 0.5 ? 1 : 0;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-md">
      <rect width={size} height={size} fill="hsl(160 50% 6%)" />
      {pattern.map((v, i) =>
        v ? (
          <rect
            key={i}
            x={(i % cells) * cellSize}
            y={Math.floor(i / cells) * cellSize}
            width={cellSize}
            height={cellSize}
            fill="hsl(142 100% 60%)"
          />
        ) : null
      )}
    </svg>
  );
};
