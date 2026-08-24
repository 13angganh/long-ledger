"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAppMeta } from "@/lib/repositories/metaRepo";
import type { AppMeta } from "@/lib/types/shared";

const EMPTY_META: AppMeta = {
  categories: { finance: [], subscription: [] },
  tags: [],
};

/**
 * Autocomplete list untuk kategori/tag (Bagian 6.1). Tidak perlu real-time
 * listener — cukup fetch sekali per mount, cukup untuk kebutuhan suggestion.
 */
export function useAppMeta(): { meta: AppMeta; loading: boolean } {
  const { user } = useAuth();
  const [meta, setMeta] = useState<AppMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getAppMeta(user.uid)
      .then(setMeta)
      .finally(() => setLoading(false));
  }, [user]);

  // user berubah (login/logout) di tengah render: reset state supaya tidak
  // menampilkan meta user sebelumnya sekilas. Pola "adjust state during
  // render" React — menghindari setState sinkron di effect body.
  const [syncedUser, setSyncedUser] = useState(user);
  if (user !== syncedUser) {
    setSyncedUser(user);
    setMeta(EMPTY_META);
    setLoading(user ? true : false);
  }

  return { meta, loading };
}
