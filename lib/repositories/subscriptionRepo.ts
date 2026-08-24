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
import { subscriptionConverter } from "@/lib/firebase/converters";
import type { Subscription, SubscriptionInput } from "@/lib/types/subscription";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk subscriptions
 * (Bagian 4.2). Ikuti pola transactionRepo.ts persis.
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as SubscriptionInput);
  return ref.id;
}

export async function updateSubscription(
  userId: string,
  subscriptionId: string,
  input: Partial<SubscriptionInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "subscriptions", subscriptionId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
}

export async function deleteSubscription(
  userId: string,
  subscriptionId: string
): Promise<void> {
  const ref = doc(db, "users", userId, "subscriptions", subscriptionId);
  await deleteDoc(ref);
}
