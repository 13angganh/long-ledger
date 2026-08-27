"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToSubscriptions } from "@/lib/repositories/subscriptionRepo";
import type { Subscription } from "@/lib/types/subscription";

interface UseSubscriptionsResult {
  subscriptions: Subscription[];
  deletedSubscriptions: Subscription[];
  loading: boolean;
  error: string | null;
}

export function useSubscriptions(): UseSubscriptionsResult {
  const { user } = useAuth();
  const [rawSubscriptions, setRawSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToSubscriptions(
      user.uid,
      (data) => {
        setRawSubscriptions(data);
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
    setRawSubscriptions([]);
    setLoading(user ? true : false);
  }

  const subscriptions = useMemo(
    () => rawSubscriptions.filter((s) => s.deletedAt === null),
    [rawSubscriptions]
  );
  const deletedSubscriptions = useMemo(
    () => rawSubscriptions.filter((s) => s.deletedAt !== null),
    [rawSubscriptions]
  );

  return { subscriptions, deletedSubscriptions, loading, error };
}
