import type { Transaction } from "@/lib/types/transaction";
import type { Investment } from "@/lib/types/investment";
import type { Subscription } from "@/lib/types/subscription";
import type { WatchlistItem } from "@/lib/types/watchlist";
import type { Contact } from "@/lib/types/contact";
import type { ActivityModule } from "@/lib/types/activityLog";
import type { Timestamp } from "firebase/firestore";

/**
 * SATU-SATUNYA tempat yang menyeragamkan 5 tipe data berbeda jadi satu
 * bentuk seragam untuk halaman /trash (Poin 7). Setiap modul punya field
 * label yang berbeda (category, name, title, dst) — fungsi di sini yang
 * menerjemahkan itu jadi satu `label` konsisten.
 */
export interface TrashItem {
  module: ActivityModule;
  id: string;
  label: string;
  subtitle: string;
  deletedAt: Timestamp;
  lastEditedBy: string;
  /** Hanya terisi untuk module "finance" bertipe transfer (Poin 9). */
  transferPairId?: string | null;
}

export function transactionsToTrashItems(items: Transaction[]): TrashItem[] {
  return items
    .filter((t) => t.deletedAt !== null)
    .map((t) => ({
      module: "finance" as const,
      id: t.id,
      label: t.category || "Transaksi",
      subtitle:
        t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer",
      deletedAt: t.deletedAt!,
      lastEditedBy: t.lastEditedBy,
      transferPairId: t.transferPairId,
    }));
}

export function investmentsToTrashItems(items: Investment[]): TrashItem[] {
  return items
    .filter((i) => i.deletedAt !== null)
    .map((i) => ({
      module: "investment" as const,
      id: i.id,
      label: i.name,
      subtitle: "Investasi",
      deletedAt: i.deletedAt!,
      lastEditedBy: i.lastEditedBy,
    }));
}

export function subscriptionsToTrashItems(items: Subscription[]): TrashItem[] {
  return items
    .filter((s) => s.deletedAt !== null)
    .map((s) => ({
      module: "subscription" as const,
      id: s.id,
      label: s.name,
      subtitle: "Langganan",
      deletedAt: s.deletedAt!,
      lastEditedBy: s.lastEditedBy,
    }));
}

export function watchlistToTrashItems(items: WatchlistItem[]): TrashItem[] {
  return items
    .filter((w) => w.deletedAt !== null)
    .map((w) => ({
      module: "watchlist" as const,
      id: w.id,
      label: w.title,
      subtitle: "Watchlist",
      deletedAt: w.deletedAt!,
      lastEditedBy: w.lastEditedBy,
    }));
}

export function contactsToTrashItems(items: Contact[]): TrashItem[] {
  return items
    .filter((c) => c.deletedAt !== null)
    .map((c) => ({
      module: "contact" as const,
      id: c.id,
      label: c.name,
      subtitle: "Kontak",
      deletedAt: c.deletedAt!,
      lastEditedBy: c.lastEditedBy,
    }));
}

/** Gabungkan semua trash item dari 5 modul, urut terbaru dihapus dulu. */
export function mergeAndSortTrashItems(...groups: TrashItem[][]): TrashItem[] {
  return groups.flat().sort((a, b) => b.deletedAt.toMillis() - a.deletedAt.toMillis());
}
