"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import {
  filterByWatchlistType,
  filterByWatchlistStatus,
} from "@/lib/selectors/watchlistSelectors";
import { WatchlistListItem } from "@/components/shared/WatchlistListItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookmarkIcon } from "@/components/ui/icons";
import { WATCHLIST_TYPE_LABELS } from "@/lib/types/watchlist";
import type { WatchlistItem, WatchlistType } from "@/lib/types/watchlist";

export default function WatchlistPage() {
  const { items, loading, error } = useWatchlist();
  const [typeFilter, setTypeFilter] = useState<WatchlistType | null>(null);
  const [statusFilter, setStatusFilter] = useState<WatchlistItem["status"] | null>(
    null
  );

  const filtered = useMemo(() => {
    let result = filterByWatchlistStatus(items, statusFilter);
    result = filterByWatchlistType(result, typeFilter);
    return result;
  }, [items, statusFilter, typeFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Watchlist
        </h1>
        <Link
          href="/watchlist/new"
          className="rounded-control bg-accent-emerald px-4 py-2 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
        >
          + Item
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label="Semua status"
          active={statusFilter === null}
          onClick={() => setStatusFilter(null)}
        />
        <FilterChip
          label="Direncanakan"
          active={statusFilter === "planned"}
          onClick={() => setStatusFilter("planned")}
        />
        <FilterChip
          label="Sedang dijalani"
          active={statusFilter === "in_progress"}
          onClick={() => setStatusFilter("in_progress")}
        />
        <FilterChip
          label="Selesai"
          active={statusFilter === "completed"}
          onClick={() => setStatusFilter("completed")}
        />
        <select
          value={typeFilter ?? ""}
          onChange={(e) => setTypeFilter((e.target.value || null) as WatchlistType | null)}
          className="rounded-control border border-border-hairline bg-bg-surface px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-accent-emerald"
        >
          <option value="">Semua jenis</option>
          {Object.entries(WATCHLIST_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[62px] animate-pulse rounded-control border border-border-hairline bg-bg-surface"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">Gagal memuat watchlist: {error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon width={22} height={22} />}
          title={items.length === 0 ? "Watchlist masih kosong" : "Tidak ada yang cocok"}
          description={
            items.length === 0
              ? "Tambah buku, film, series, atau artikel yang ingin dikonsumsi."
              : "Coba ubah filter untuk melihat item lain."
          }
          actionLabel={items.length === 0 ? "Tambah item" : undefined}
          onAction={
            items.length === 0
              ? () => (window.location.href = "/watchlist/new")
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <WatchlistListItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${
        active
          ? "border-accent-emerald bg-accent-emerald-soft text-text-primary"
          : "border-border-hairline text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}
