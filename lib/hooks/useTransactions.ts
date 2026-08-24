"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToTransactions } from "@/lib/repositories/transactionRepo";
import type { Transaction } from "@/lib/types/transaction";

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

/**
 * Satu-satunya cara komponen mengakses data transaksi real-time
 * (Bagian 4.2 aturan #4). Auto re-subscribe kalau user berubah.
 */
export function useTransactions(): UseTransactionsResult {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Tidak perlu setLoading(true) di sini: initial state sudah `true`,
    // dan callback onSnapshot di bawah akan setLoading(false) begitu
    // snapshot pertama datang. Menghindari setState sinkron di body effect.
    const unsubscribe = subscribeToTransactions(
      user.uid,
      (data) => {
        setTransactions(data);
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

  // user berubah (login/logout) di tengah render: reset state supaya tidak
  // menampilkan data user sebelumnya sekilas. Pola "adjust state during
  // render" React — menghindari setState sinkron di effect body
  // (react-hooks/set-state-in-effect).
  const [syncedUser, setSyncedUser] = useState(user);
  if (user !== syncedUser) {
    setSyncedUser(user);
    setTransactions([]);
    setLoading(user ? true : false);
  }

  return { transactions, loading, error };
}
