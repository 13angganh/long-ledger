import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { logActivity } from "@/lib/repositories/activityLogRepo";
import type { ActivityModule } from "@/lib/types/activityLog";

/**
 * Hapus PERMANEN generik untuk item yang sudah ada di Recycle Bin
 * (Poin 7). Terpisah dari 5 repository modul supaya logic hapus-permanen
 * tidak diduplikasi 5×. Dipanggil dari halaman /trash.
 */

/** Nama collection Firestore untuk tiap module — satu-satunya mapping ini. */
const MODULE_COLLECTION: Record<ActivityModule, string> = {
  finance: "transactions",
  investment: "investments",
  subscription: "subscriptions",
  watchlist: "watchlistItems",
  contact: "contacts",
};

export async function permanentlyDelete(
  userId: string,
  module: ActivityModule,
  docId: string,
  actorName: string,
  targetLabel: string
): Promise<void> {
  const collectionName = MODULE_COLLECTION[module];
  const ref = doc(db, "users", userId, collectionName, docId);
  await deleteDoc(ref);
  await logActivity(userId, {
    module,
    action: "delete",
    targetId: docId,
    targetLabel: `${targetLabel} (permanen)`,
    actorName,
  });
}

const AUTO_PURGE_DAYS = 30;

/** Ambang waktu: item dengan deletedAt lebih lama dari ini siap di-purge. */
export function isPastAutoPurgeThreshold(deletedAt: Date, now: Date = new Date()): boolean {
  const diffDays = (now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= AUTO_PURGE_DAYS;
}

export { AUTO_PURGE_DAYS };
