import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { watchlistItemConverter } from "@/lib/firebase/converters";
import type { WatchlistItem, WatchlistItemInput } from "@/lib/types/watchlist";
import { logActivity } from "@/lib/repositories/activityLogRepo";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk watchlistItems
 * (Bagian 4.2). Hapus bersifat SOFT-DELETE (Poin 7) — lihat catatan
 * lengkap di transactionRepo.ts. Hapus permanen ada di trashRepo.ts.
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
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as WatchlistItemInput);
  await logActivity(userId, {
    module: "watchlist",
    action: "create",
    targetId: ref.id,
    targetLabel: input.title,
    actorName: input.lastEditedBy,
  });
  return ref.id;
}

export async function updateWatchlistItem(
  userId: string,
  itemId: string,
  input: Partial<WatchlistItemInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "watchlistItems", itemId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  await logActivity(userId, {
    module: "watchlist",
    action: "update",
    targetId: itemId,
    targetLabel: input.title ?? "Item watchlist",
    actorName: input.lastEditedBy ?? "Pengguna",
  });
}

export async function softDeleteWatchlistItem(
  userId: string,
  itemId: string,
  actorName: string,
  targetLabel: string
): Promise<void> {
  const ref = doc(db, "users", userId, "watchlistItems", itemId);
  await updateDoc(ref, {
    deletedAt: Timestamp.now(),
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, {
    module: "watchlist",
    action: "delete",
    targetId: itemId,
    targetLabel,
    actorName,
  });
}

export async function restoreWatchlistItem(
  userId: string,
  itemId: string,
  actorName: string,
  targetLabel: string
): Promise<void> {
  const ref = doc(db, "users", userId, "watchlistItems", itemId);
  await updateDoc(ref, {
    deletedAt: null,
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, {
    module: "watchlist",
    action: "restore",
    targetId: itemId,
    targetLabel,
    actorName,
  });
}
