"use client";

import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { getInProgressItems, getPlannedCount } from "@/lib/selectors/watchlistSelectors";
import { SummaryCard } from "./SummaryCard";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { BookmarkIcon } from "@/components/ui/icons";
import { WATCHLIST_TYPE_LABELS } from "@/lib/types/watchlist";

/**
 * Bagian 7: item "in_progress" saat ini + jumlah "planned" menumpuk.
 * Logic 100% dari watchlistSelectors — tidak dihitung ulang di sini.
 */
export function WatchlistProgressCard() {
  const { items, loading } = useWatchlist();

  if (loading) {
    return (
      <div className="h-[220px] animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
    );
  }

  const inProgress = getInProgressItems(items);
  const plannedCount = getPlannedCount(items);

  return (
    <SummaryCard href="/watchlist" title="Watchlist" icon={<BookmarkIcon />}>
      {inProgress.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {inProgress.slice(0, 3).map((item) => (
            <div key={item.id} className="flex flex-col gap-0.5">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-text-primary">
                  {item.title}
                </span>
                <span className="text-xs text-text-tertiary">
                  {WATCHLIST_TYPE_LABELS[item.type]}
                </span>
              </div>
              <div className="flex justify-end">
                <LastEditedBy name={item.lastEditedBy} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">Tidak ada yang sedang dijalani.</p>
      )}

      <p className="border-t border-border-hairline pt-3 text-xs text-text-tertiary">
        {plannedCount} item menunggu untuk dimulai
      </p>
    </SummaryCard>
  );
}
