import Link from "next/link";
import type { WatchlistItem } from "@/lib/types/watchlist";
import { WATCHLIST_TYPE_LABELS, WATCHLIST_STATUS_LABELS } from "@/lib/types/watchlist";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { RatingStars } from "@/components/shared/RatingStars";
import { Badge } from "@/components/ui/Badge";

const STATUS_TONE: Record<WatchlistItem["status"], "neutral" | "emerald" | "amber"> = {
  planned: "neutral",
  in_progress: "amber",
  completed: "emerald",
};

export function WatchlistListItem({ item }: { item: WatchlistItem }) {
  return (
    <Link
      href={`/watchlist/${item.id}`}
      className="card-interactive flex items-center justify-between gap-3 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium text-text-primary">{item.title}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">{WATCHLIST_TYPE_LABELS[item.type]}</span>
          <Badge tone={STATUS_TONE[item.status]}>{WATCHLIST_STATUS_LABELS[item.status]}</Badge>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {item.rating !== null && <RatingStars value={item.rating} size={13} />}
        <LastEditedBy name={item.lastEditedBy} />
      </div>
    </Link>
  );
}
