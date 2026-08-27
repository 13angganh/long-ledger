"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToInvestments } from "@/lib/repositories/investmentRepo";
import type { Investment } from "@/lib/types/investment";

interface UseInvestmentsResult {
  investments: Investment[];
  deletedInvestments: Investment[];
  loading: boolean;
  error: string | null;
}

export function useInvestments(): UseInvestmentsResult {
  const { user } = useAuth();
  const [rawInvestments, setRawInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToInvestments(
      user.uid,
      (data) => {
        setRawInvestments(data);
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
    setRawInvestments([]);
    setLoading(user ? true : false);
  }

  const investments = useMemo(
    () => rawInvestments.filter((i) => i.deletedAt === null),
    [rawInvestments]
  );
  const deletedInvestments = useMemo(
    () => rawInvestments.filter((i) => i.deletedAt !== null),
    [rawInvestments]
  );

  return { investments, deletedInvestments, loading, error };
}
