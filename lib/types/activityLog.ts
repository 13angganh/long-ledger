import type { Timestamp } from "firebase/firestore";

export type ActivityAction = "create" | "update" | "delete" | "restore";

export type ActivityModule =
  | "finance"
  | "investment"
  | "subscription"
  | "watchlist"
  | "contact";

export interface ActivityLogEntry {
  id: string;
  module: ActivityModule;
  action: ActivityAction;
  /** id dokumen yang terpengaruh, untuk link balik kalau masih ada. */
  targetId: string;
  /** Label singkat dokumen saat kejadian (nama/judul/kategori) — supaya
   * log tetap terbaca meski dokumen sudah dihapus permanen. */
  targetLabel: string;
  actorName: string;
  createdAt: Timestamp;
}

export type ActivityLogInput = Omit<ActivityLogEntry, "id" | "createdAt">;

export const ACTIVITY_MODULE_LABELS: Record<ActivityModule, string> = {
  finance: "Finance",
  investment: "Investasi",
  subscription: "Langganan",
  watchlist: "Watchlist",
  contact: "Kontak",
};

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  create: "membuat",
  update: "mengubah",
  delete: "menghapus",
  restore: "memulihkan",
};
