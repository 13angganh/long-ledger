import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
} from "firebase/firestore";
import type { Transaction } from "@/lib/types/transaction";
import type { Investment } from "@/lib/types/investment";
import type { Subscription } from "@/lib/types/subscription";
import type { WatchlistItem } from "@/lib/types/watchlist";
import type { Contact } from "@/lib/types/contact";
import type { ActivityLogEntry } from "@/lib/types/activityLog";

/**
 * SATU-SATUNYA tempat definisi Firestore data converters (Bagian 4.2).
 * Setiap converter: strip `id` saat menulis (id datang dari dokumen ref,
 * bukan field), dan sisipkan `id` dari snapshot saat membaca.
 *
 * PENTING — backward compatibility (insiden pasca-v1.0.0, 2026-08-27):
 * dokumen yang dibuat SEBELUM sebuah field ditambahkan ke skema (mis.
 * `deletedAt`, `accountType`, `owner` yang ditambah setelah app sudah
 * dipakai) TIDAK PUNYA field itu sama sekali di Firestore — bukan `null`,
 * benar-benar tidak ada key-nya, sehingga terbaca `undefined` di JS.
 * `undefined !== null` bernilai true, jadi filter `deletedAt === null`
 * (transaksi aktif) gagal, TAPI transaksi itu juga tidak valid tampil di
 * Recycle Bin karena field lain yang dianggap wajib (accountType, owner)
 * juga undefined dan bikin halaman crash saat coba render label-nya.
 * Hasilnya: data terlihat "hilang" padahal masih ada utuh di Firestore.
 *
 * Setiap kali skema modul bertambah field BARU di masa depan, WAJIB
 * tambahkan default-nya di sini — jangan asumsikan field itu selalu ada
 * di dokumen manapun.
 */
function makeConverter<T extends { id: string }>(
  defaults: Partial<Omit<T, "id">> = {}
): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      const { id: _id, ...rest } = data;
      return rest;
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options: SnapshotOptions
    ): T {
      const data = snapshot.data(options);
      return {
        ...defaults,
        ...(data as Omit<T, "id">),
        id: snapshot.id,
      } as T;
    },
  };
}

export const transactionConverter = makeConverter<Transaction>({
  deletedAt: null,
  accountType: "cash",
  owner: "suami",
  transferToAccountType: null,
  transferPairId: null,
});

export const investmentConverter = makeConverter<Investment>({
  deletedAt: null,
});

export const subscriptionConverter = makeConverter<Subscription>({
  deletedAt: null,
  owner: "suami",
});

export const watchlistItemConverter = makeConverter<WatchlistItem>({
  deletedAt: null,
});

export const contactConverter = makeConverter<Contact>({
  deletedAt: null,
});

export const activityLogConverter = makeConverter<ActivityLogEntry>();
