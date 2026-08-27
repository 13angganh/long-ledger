import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit as limitFn,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { activityLogConverter } from "@/lib/firebase/converters";
import type { ActivityLogEntry, ActivityLogInput } from "@/lib/types/activityLog";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk activityLog
 * (Bagian 4.2, Poin 8). Dipanggil dari 5 repository lain setiap kali
 * create/update/delete/restore terjadi — lihat pemanggilan `logActivity()`
 * di transactionRepo, investmentRepo, subscriptionRepo, watchlistRepo,
 * contactRepo.
 */

function activityLogCollection(userId: string) {
  return collection(db, "users", userId, "activityLog").withConverter(
    activityLogConverter
  );
}

/** Tulis satu entri log. Dipanggil internal oleh repository modul lain. */
export async function logActivity(
  userId: string,
  input: ActivityLogInput
): Promise<void> {
  await addDoc(activityLogCollection(userId), {
    ...input,
    createdAt: serverTimestamp(),
  } as ActivityLogInput);
}

const DEFAULT_LOG_LIMIT = 100;

/** Subscribe ke log terbaru, dibatasi `limit` entri (default 100 terakhir). */
export function subscribeToActivityLog(
  userId: string,
  onChange: (entries: ActivityLogEntry[]) => void,
  onError?: (error: Error) => void,
  limitCount: number = DEFAULT_LOG_LIMIT
): Unsubscribe {
  const q = query(
    activityLogCollection(userId),
    orderBy("createdAt", "desc"),
    limitFn(limitCount)
  );
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data())),
    (error) => onError?.(error)
  );
}
