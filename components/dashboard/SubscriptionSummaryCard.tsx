"use client";

import { useSubscriptions } from "@/lib/hooks/useSubscriptions";
import {
  getMonthlySpend,
  getUrgentRenewals,
  getUpcomingRenewals,
} from "@/lib/selectors/subscriptionSelectors";
import { SummaryCard } from "./SummaryCard";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { RepeatIcon } from "@/components/ui/icons";
import { formatIDR, formatDateShortID } from "@/lib/format";

/**
 * Bagian 7: total spend bulanan (dinormalisasi) + list renewal terdekat,
 * halo amber kalau ada renewal ≤7 hari. Logic 100% dari
 * subscriptionSelectors — tidak dihitung ulang di sini.
 */
export function SubscriptionSummaryCard() {
  const { subscriptions, loading } = useSubscriptions();

  if (loading) {
    return (
      <div className="h-[220px] animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
    );
  }

  const monthlySpend = getMonthlySpend(subscriptions);
  const urgent = getUrgentRenewals(subscriptions);
  const upcoming = getUpcomingRenewals(subscriptions, 3);

  return (
    <SummaryCard
      href="/subscriptions"
      title="Langganan"
      icon={<RepeatIcon />}
      urgent={urgent.length > 0}
    >
      <div>
        <p className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          {formatIDR(monthlySpend)}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">per bulan (dinormalisasi)</p>
      </div>

      {upcoming.length > 0 ? (
        <div className="flex flex-col gap-2.5 border-t border-border-hairline pt-3">
          {upcoming.map((sub) => (
            <div key={sub.id} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-text-secondary">{sub.name}</span>
                <span className="shrink-0 text-xs text-text-primary">
                  {formatDateShortID(sub.nextRenewalDate.toDate())}
                </span>
              </div>
              <div className="flex justify-end">
                <LastEditedBy name={sub.lastEditedBy} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="border-t border-border-hairline pt-3 text-xs text-text-tertiary">
          Belum ada langganan aktif.
        </p>
      )}

      {urgent.length > 0 && (
        <p className="text-xs text-accent-amber">
          {urgent.length} langganan perpanjang dalam ≤7 hari.
        </p>
      )}
    </SummaryCard>
  );
}
