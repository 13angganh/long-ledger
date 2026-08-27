import type { ActivityModule } from "@/lib/types/activityLog";
import { restoreTransaction } from "@/lib/repositories/transactionRepo";
import { restoreInvestment } from "@/lib/repositories/investmentRepo";
import { restoreSubscription } from "@/lib/repositories/subscriptionRepo";
import { restoreWatchlistItem } from "@/lib/repositories/watchlistRepo";
import { restoreContact } from "@/lib/repositories/contactRepo";
import { permanentlyDelete } from "@/lib/repositories/trashRepo";

/**
 * Dispatcher tipis: halaman /trash bicara ke SATU fungsi ini, bukan
 * import 5 fungsi restore berbeda dan if-else module di komponen. Fungsi
 * restore aslinya tetap di masing-masing repository modul (Bagian 4.2 —
 * repository tetap satu-satunya lapisan Firestore per modul), ini cuma
 * routing tipis di atasnya.
 */
export async function restoreTrashItem(
  userId: string,
  module: ActivityModule,
  docId: string,
  actorName: string,
  label: string,
  pairId?: string | null
): Promise<void> {
  switch (module) {
    case "finance":
      return restoreTransaction(userId, docId, actorName, label, pairId);
    case "investment":
      return restoreInvestment(userId, docId, actorName, label);
    case "subscription":
      return restoreSubscription(userId, docId, actorName, label);
    case "watchlist":
      return restoreWatchlistItem(userId, docId, actorName, label);
    case "contact":
      return restoreContact(userId, docId, actorName, label);
  }
}

export async function permanentlyDeleteTrashItem(
  userId: string,
  module: ActivityModule,
  docId: string,
  actorName: string,
  label: string
): Promise<void> {
  return permanentlyDelete(userId, module, docId, actorName, label);
}
