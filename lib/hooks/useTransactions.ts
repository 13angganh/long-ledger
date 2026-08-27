"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToTransactions } from "@/lib/repositories/transactionRepo";
import type { Transaction } from "@/lib/types/transaction";

interface UseTransactionsResult {
  /** Hanya transaksi aktif (deletedAt === null) — dipakai di /finance normal. */
  transactions: Transaction[];
  /** Transaksi di Recycle Bin (deletedAt !== null) — dipakai di /trash. */
  deletedTransactions: Transaction[];
  loading: boolean;
  error: string | null;
}

/**
 * Satu-satunya cara komponen mengakses data transaksi real-time
 * (Bagian 4.2 aturan #4). Satu subscription Firestore, dipecah jadi
 * aktif/terhapus di client (Poin 7 Recycle Bin) — bukan dua listener
 * terpisah, supaya tetap efisien.
 */
export function useTransactions(): UseTransactionsResult {
  const { user } = useAuth();
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToTransactions(
      user.uid,
      (data) => {
        setRawTransactions(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const [syncedUser, setSyncedUser] = useState(user);
  if (user !== syncedUser) {
    setSyncedUser(user);
    setRawTransactions([]);
    setLoading(user ? true : false);
  }

  const transactions = useMemo(
    () => rawTransactions.filter((t) => t.deletedAt === null),
    [rawTransactions]
  );
  const deletedTransactions = useMemo(
    () => rawTransactions.filter((t) => t.deletedAt !== null),
    [rawTransactions]
  );

  return { transactions, deletedTransactions, loading, error };
}
