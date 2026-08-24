"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToInvestments } from "@/lib/repositories/investmentRepo";
import type { Investment } from "@/lib/types/investment";

interface UseInvestmentsResult {
  investments: Investment[];
  loading: boolean;
  error: string | null;
}

export function useInvestments(): UseInvestmentsResult {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToInvestments(
      user.uid,
      (data) => {
        setInvestments(data);
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

  // user berubah (login/logout) di tengah render: reset state (pola
  // "adjust state during render" — hindari setState sinkron di effect body).
  const [syncedUser, setSyncedUser] = useState(user);
  if (user !== syncedUser) {
    setSyncedUser(user);
    setInvestments([]);
    setLoading(user ? true : false);
  }

  return { investments, loading, error };
}
