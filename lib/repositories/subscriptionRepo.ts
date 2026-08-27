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
import { subscriptionConverter } from "@/lib/firebase/converters";
import type { Subscription, SubscriptionInput } from "@/lib/types/subscription";
import { logActivity } from "@/lib/repositories/activityLogRepo";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk subscriptions
 * (Bagian 4.2). Hapus bersifat SOFT-DELETE (Poin 7) — lihat catatan
 * lengkap di transactionRepo.ts. Hapus permanen ada di trashRepo.ts.
 */

function subscriptionsCollection(userId: string) {
  return collection(db, "users", userId, "subscriptions").withConverter(
    subscriptionConverter
  );
}

export function subscribeToSubscriptions(
  userId: string,
  onChange: (subscriptions: Subscription[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    subscriptionsCollection(userId),
    orderBy("nextRenewalDate", "asc")
  );
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data())),
    (error) => onError?.(error)
  );
}

export async function createSubscription(
  userId: string,
  input: SubscriptionInput
): Promise<string> {
  const ref = await addDoc(subscriptionsCollection(userId), {
    ...input,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as SubscriptionInput);
  await logActivity(userId, {
    module: "subscription",
    action: "create",
    targetId: ref.id,
    targetLabel: input.name,
    actorName: input.lastEditedBy,
  });
  return ref.id;
}

export async function updateSubscription(
  userId: string,
  subscriptionId: string,
  input: Partial<SubscriptionInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "subscriptions", subscriptionId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  await logActivity(userId, {
    module: "subscription",
    action: "update",
    targetId: subscriptionId,
    targetLabel: input.name ?? "Langganan",
    actorName: input.lastEditedBy ?? "Pengguna",
  });
}

export async function softDeleteSubscription(
  userId: string,
  subscriptionId: string,
  actorName: string,
  targetLabel: string
): Promise<void> {
  const ref = doc(db, "users", userId, "subscriptions", subscriptionId);
  await updateDoc(ref, {
    deletedAt: Timestamp.now(),
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, {
    module: "subscription",
    action: "delete",
    targetId: subscriptionId,
    targetLabel,
    actorName,
  });
}

export async function restoreSubscription(
  userId: string,
  subscriptionId: string,
  actorName: string,
  targetLabel: string
): Promise<void> {
  const ref = doc(db, "users", userId, "subscriptions", subscriptionId);
  await updateDoc(ref, {
    deletedAt: null,
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, {
    module: "subscription",
    action: "restore",
    targetId: subscriptionId,
    targetLabel,
    actorName,
  });
}
