"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToWatchlist } from "@/lib/repositories/watchlistRepo";
import type { WatchlistItem } from "@/lib/types/watchlist";

interface UseWatchlistResult {
  items: WatchlistItem[];
  loading: boolean;
  error: string | null;
}

export function useWatchlist(): UseWatchlistResult {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToWatchlist(
      user.uid,
      (data) => {
        setItems(data);
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
    setItems([]);
    setLoading(user ? true : false);
  }

  return { items, loading, error };
}
