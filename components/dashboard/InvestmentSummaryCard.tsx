"use client";

import { useInvestments } from "@/lib/hooks/useInvestments";
import {
  getTotalPortfolioValue,
  getTotalGainLoss,
  getPortfolioByType,
  getItemsNearTarget,
  getUpcomingMaturities,
} from "@/lib/selectors/investmentSelectors";
import { SummaryCard } from "./SummaryCard";
import { TrendingUpIcon } from "@/components/ui/icons";
import { formatIDR } from "@/lib/format";

const ALLOCATION_COLORS = ["#4a7861", "#c9924d", "#6b7fa8", "#a8708c", "#8ba85a", "#9b9c9c"];

/**
 * Bagian 7: total nilai portofolio + gain/loss%, breakdown alokasi mini bar,
 * halo amber kalau ada item near-target atau upcoming maturity. Logic 100%
 * dari investmentSelectors — tidak dihitung ulang di sini.
 */
export function InvestmentSummaryCard() {
  const { investments, loading } = useInvestments();

  if (loading) {
    return (
      <div className="h-[220px] animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
    );
  }

  const totalValue = getTotalPortfolioValue(investments);
  const gainLoss = getTotalGainLoss(investments);
  const allocation = getPortfolioByType(investments).slice(0, 5);
  const nearTarget = getItemsNearTarget(investments);
  const upcomingMaturities = getUpcomingMaturities(investments);
  const isUrgent = nearTarget.length > 0 || upcomingMaturities.length > 0;
  const isGain = gainLoss.nominal >= 0;

  return (
    <SummaryCard
      href="/investments"
      title="Investasi"
      icon={<TrendingUpIcon />}
      urgent={isUrgent}
    >
      <div>
        <p className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          {formatIDR(totalValue)}
        </p>
        <p className={`mt-1 text-xs ${isGain ? "text-accent-emerald" : "text-danger"}`}>
          {isGain ? "+" : ""}
          {formatIDR(gainLoss.nominal)} ({gainLoss.percent >= 0 ? "+" : ""}
          {gainLoss.percent.toFixed(1)}%)
        </p>
      </div>

      {allocation.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border-hairline pt-3">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-bg-base">
            {allocation.map((a, i) => (
              <span
                key={a.type}
                style={{
                  width: `${a.percent}%`,
                  backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
                }}
              />
            ))}
          </div>
          <p className="text-xs text-text-tertiary">
            {allocation.map((a) => a.label).join(" · ")}
          </p>
        </div>
      ) : (
        <p className="border-t border-border-hairline pt-3 text-xs text-text-tertiary">
          Belum ada investasi tercatat.
        </p>
      )}

      {isUrgent && (
        <p className="text-xs text-accent-amber">
          {nearTarget.length > 0 &&
            `${nearTarget.length} item mendekati target. `}
          {upcomingMaturities.length > 0 &&
            `${upcomingMaturities.length} item jatuh tempo ≤30 hari.`}
        </p>
      )}
    </SummaryCard>
  );
}
