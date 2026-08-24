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

/**
 * SATU-SATUNYA tempat definisi Firestore data converters (Bagian 4.2).
 * Setiap converter: strip `id` saat menulis (id datang dari dokumen ref,
 * bukan field), dan sisipkan `id` dari snapshot saat membaca.
 *
 * Dipakai HANYA di lib/repositories/ — komponen React tidak pernah
 * memanggil converter ini langsung.
 */
function makeConverter<
  T extends { id: string },
>(): FirestoreDataConverter<T> {
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
      return { ...(data as Omit<T, "id">), id: snapshot.id } as T;
    },
  };
}

export const transactionConverter = makeConverter<Transaction>();
export const investmentConverter = makeConverter<Investment>();
export const subscriptionConverter = makeConverter<Subscription>();
export const watchlistItemConverter = makeConverter<WatchlistItem>();
export const contactConverter = makeConverter<Contact>();
