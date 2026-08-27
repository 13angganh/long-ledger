"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subscribeToActivityLog } from "@/lib/repositories/activityLogRepo";
import type { ActivityLogEntry } from "@/lib/types/activityLog";

interface UseActivityLogResult {
  entries: ActivityLogEntry[];
  loading: boolean;
  error: string | null;
}

export function useActivityLog(): UseActivityLogResult {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToActivityLog(
      user.uid,
      (data) => {
        setEntries(data);
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
    setEntries([]);
    setLoading(user ? true : false);
  }

  return { entries, loading, error };
}
