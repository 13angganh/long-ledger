import type { SparklinePoint } from "@/lib/selectors/financeSelectors";

interface SparklineProps {
  points: SparklinePoint[];
  width?: number;
  height?: number;
}

/**
 * Mini sparkline 7 hari (Bagian 7, FinanceSummaryCard). SVG inline murni,
 * tidak perlu chart library untuk elemen sekecil ini.
 */
export function Sparkline({ points, width = 96, height = 32 }: SparklineProps) {
  if (points.length === 0) return null;

  const values = points.map((p) => p.net);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p.net - min) / range) * height;
    return `${x},${y}`;
  });

  const isPositiveTrend = values[values.length - 1] >= values[0];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={isPositiveTrend ? "#4a7861" : "#c9924d"}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
