"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToSubscriptions } from "@/lib/repositories/subscriptionRepo";
import type { Subscription } from "@/lib/types/subscription";

interface UseSubscriptionsResult {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
}

export function useSubscriptions(): UseSubscriptionsResult {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToSubscriptions(
      user.uid,
      (data) => {
        setSubscriptions(data);
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
    setSubscriptions([]);
    setLoading(user ? true : false);
  }

  return { subscriptions, loading, error };
}
