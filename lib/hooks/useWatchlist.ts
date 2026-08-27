"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToWatchlist } from "@/lib/repositories/watchlistRepo";
import type { WatchlistItem } from "@/lib/types/watchlist";

interface UseWatchlistResult {
  items: WatchlistItem[];
  deletedItems: WatchlistItem[];
  loading: boolean;
  error: string | null;
}

export function useWatchlist(): UseWatchlistResult {
  const { user } = useAuth();
  const [rawItems, setRawItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToWatchlist(
      user.uid,
      (data) => {
        setRawItems(data);
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
    setRawItems([]);
    setLoading(user ? true : false);
  }

  const items = useMemo(
    () => rawItems.filter((i) => i.deletedAt === null),
    [rawItems]
  );
  const deletedItems = useMemo(
    () => rawItems.filter((i) => i.deletedAt !== null),
    [rawItems]
  );

  return { items, deletedItems, loading, error };
}
