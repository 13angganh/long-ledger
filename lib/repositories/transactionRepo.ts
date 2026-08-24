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
import { transactionConverter } from "@/lib/firebase/converters";
import type { Transaction, TransactionInput } from "@/lib/types/transaction";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk transactions
 * (Bagian 4.2, aturan keras #1). Komponen React TIDAK PERNAH import
 * firebase/firestore langsung — selalu lewat fungsi di sini, dikonsumsi
 * lewat lib/hooks/useTransactions.ts.
 */

function transactionsCollection(userId: string) {
  return collection(db, "users", userId, "transactions").withConverter(
    transactionConverter
  );
}

/**
 * Subscribe real-time ke seluruh transaksi user, urut tanggal terbaru dulu.
 * Listener hidup di sini (Bagian 4.2 aturan #4), bukan di komponen.
 */
export function subscribeToTransactions(
  userId: string,
  onChange: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(transactionsCollection(userId), orderBy("date", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((d) => d.data()));
    },
    (error) => onError?.(error)
  );
}

export async function createTransaction(
  userId: string,
  input: TransactionInput
): Promise<string> {
  const ref = await addDoc(transactionsCollection(userId), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as TransactionInput);
  return ref.id;
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: Partial<TransactionInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "transactions", transactionId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
}

export async function deleteTransaction(
  userId: string,
  transactionId: string
): Promise<void> {
  const ref = doc(db, "users", userId, "transactions", transactionId);
  await deleteDoc(ref);
}
