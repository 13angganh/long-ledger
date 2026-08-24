import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { watchlistItemConverter } from "@/lib/firebase/converters";
import type { WatchlistItem, WatchlistItemInput } from "@/lib/types/watchlist";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk watchlistItems
 * (Bagian 4.2). Ikuti pola transactionRepo.ts persis.
 */

function watchlistCollection(userId: string) {
  return collection(db, "users", userId, "watchlistItems").withConverter(
    watchlistItemConverter
  );
}

export function subscribeToWatchlist(
  userId: string,
  onChange: (items: WatchlistItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(watchlistCollection(userId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data())),
    (error) => onError?.(error)
  );
}

export async function createWatchlistItem(
  userId: string,
  input: WatchlistItemInput
): Promise<string> {
  const ref = await addDoc(watchlistCollection(userId), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as WatchlistItemInput);
  return ref.id;
}

export async function updateWatchlistItem(
  userId: string,
  itemId: string,
  input: Partial<WatchlistItemInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "watchlistItems", itemId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
}

export async function deleteWatchlistItem(
  userId: string,
  itemId: string
): Promise<void> {
  const ref = doc(db, "users", userId, "watchlistItems", itemId);
  await deleteDoc(ref);
}
