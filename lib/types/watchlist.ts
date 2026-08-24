import type { Timestamp } from "firebase/firestore";

export type WatchlistType = "book" | "movie" | "series" | "article";
export type WatchlistStatus = "planned" | "in_progress" | "completed";

export interface WatchlistItem {
  id: string;
  title: string;
  type: WatchlistType;
  status: WatchlistStatus;
  rating: number | null;
  note: string;
  startedAt: Timestamp | null;
  completedAt: Timestamp | null;
  lastEditedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type WatchlistItemInput = Omit<
  WatchlistItem,
  "id" | "createdAt" | "updatedAt"
>;

export const WATCHLIST_TYPE_LABELS: Record<WatchlistType, string> = {
  book: "Buku",
  movie: "Film",
  series: "Series",
  article: "Artikel",
};

export const WATCHLIST_STATUS_LABELS: Record<WatchlistStatus, string> = {
  planned: "Direncanakan",
  in_progress: "Sedang dijalani",
  completed: "Selesai",
};
