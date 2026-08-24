import type { WatchlistItem, WatchlistType } from "@/lib/types/watchlist";

/**
 * SATU-SATUNYA lapisan yang menghitung logic agregasi/turunan untuk data
 * watchlist (Bagian 4.2). Dashboard DAN /watchlist sama-sama panggil
 * fungsi di sini.
 */

/** Item yang sedang berjalan (status "in_progress"), terbaru diupdate dulu. */
export function getInProgressItems(items: WatchlistItem[]): WatchlistItem[] {
  return items
    .filter((item) => item.status === "in_progress")
    .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
}

/** Jumlah item yang masih "planned" (menumpuk, belum dimulai). */
export function getPlannedCount(items: WatchlistItem[]): number {
  return items.filter((item) => item.status === "planned").length;
}

/** Filter berdasarkan jenis (buku/film/series/artikel). */
export function filterByWatchlistType(
  items: WatchlistItem[],
  type: WatchlistType | null
): WatchlistItem[] {
  if (!type) return items;
  return items.filter((item) => item.type === type);
}

/** Filter berdasarkan status. */
export function filterByWatchlistStatus(
  items: WatchlistItem[],
  status: WatchlistItem["status"] | null
): WatchlistItem[] {
  if (!status) return items;
  return items.filter((item) => item.status === status);
}

/** Item completed dengan rating tertinggi, dibatasi `limit` — untuk highlight. */
export function getTopRated(items: WatchlistItem[], limit = 5): WatchlistItem[] {
  return items
    .filter((item) => item.status === "completed" && item.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);
}
