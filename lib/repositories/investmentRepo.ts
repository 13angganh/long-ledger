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
import { investmentConverter } from "@/lib/firebase/converters";
import type { Investment, InvestmentInput } from "@/lib/types/investment";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk investments
 * (Bagian 4.2). Komponen React tidak pernah import firebase/firestore
 * langsung — selalu lewat fungsi di sini, dikonsumsi lewat
 * lib/hooks/useInvestments.ts.
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as InvestmentInput);
  return ref.id;
}

export async function updateInvestment(
  userId: string,
  investmentId: string,
  input: Partial<InvestmentInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "investments", investmentId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
}

export async function deleteInvestment(
  userId: string,
  investmentId: string
): Promise<void> {
  const ref = doc(db, "users", userId, "investments", investmentId);
  await deleteDoc(ref);
}
