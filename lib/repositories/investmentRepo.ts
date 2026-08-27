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
import { investmentConverter } from "@/lib/firebase/converters";
import type { Investment, InvestmentInput } from "@/lib/types/investment";
import { logActivity } from "@/lib/repositories/activityLogRepo";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk investments
 * (Bagian 4.2). Komponen React tidak pernah import firebase/firestore
 * langsung — selalu lewat fungsi di sini, dikonsumsi lewat
 * lib/hooks/useInvestments.ts.
 *
 * Hapus bersifat SOFT-DELETE (Poin 7) — lihat catatan lengkap di
 * transactionRepo.ts. Hapus permanen ada di lib/repositories/trashRepo.ts.
 */

function investmentsCollection(userId: string) {
  return collection(db, "users", userId, "investments").withConverter(
    investmentConverter
  );
}

export function subscribeToInvestments(
  userId: string,
  onChange: (investments: Investment[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    investmentsCollection(userId),
    orderBy("purchaseDate", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data())),
    (error) => onError?.(error)
  );
}

export async function createInvestment(
  userId: string,
  input: InvestmentInput
): Promise<string> {
  const ref = await addDoc(investmentsCollection(userId), {
    ...input,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as InvestmentInput);
  await logActivity(userId, {
    module: "investment",
    action: "create",
    targetId: ref.id,
    targetLabel: input.name,
    actorName: input.lastEditedBy,
  });
  return ref.id;
}

export async function updateInvestment(
  userId: string,
  investmentId: string,
  input: Partial<InvestmentInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "investments", investmentId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  await logActivity(userId, {
    module: "investment",
    action: "update",
    targetId: investmentId,
    targetLabel: input.name ?? "Investasi",
    actorName: input.lastEditedBy ?? "Pengguna",
  });
}

export async function softDeleteInvestment(
  userId: string,
  investmentId: string,
  actorName: string,
  targetLabel: string
): Promise<void> {
  const ref = doc(db, "users", userId, "investments", investmentId);
  await updateDoc(ref, {
    deletedAt: Timestamp.now(),
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, {
    module: "investment",
    action: "delete",
    targetId: investmentId,
    targetLabel,
    actorName,
  });
}

export async function restoreInvestment(
  userId: string,
  investmentId: string,
  actorName: string,
  targetLabel: string
): Promise<void> {
  const ref = doc(db, "users", userId, "investments", investmentId);
  await updateDoc(ref, {
    deletedAt: null,
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, {
    module: "investment",
    action: "restore",
    targetId: investmentId,
    targetLabel,
    actorName,
  });
}
