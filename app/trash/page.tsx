"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useInvestments } from "@/lib/hooks/useInvestments";
import { useSubscriptions } from "@/lib/hooks/useSubscriptions";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { useContacts } from "@/lib/hooks/useContacts";
import {
  transactionsToTrashItems,
  investmentsToTrashItems,
  subscriptionsToTrashItems,
  watchlistToTrashItems,
  contactsToTrashItems,
  mergeAndSortTrashItems,
  type TrashItem,
} from "@/lib/selectors/trashSelectors";
import {
  restoreTrashItem,
  permanentlyDeleteTrashItem,
} from "@/lib/repositories/trashActions";
import { AUTO_PURGE_DAYS, isPastAutoPurgeThreshold } from "@/lib/repositories/trashRepo";
import { ACTIVITY_MODULE_LABELS } from "@/lib/types/activityLog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { TrashIcon, RestoreIcon } from "@/components/ui/icons";
import { formatDateID } from "@/lib/format";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

function daysAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TrashPage() {
  const { user } = useAuth();
  const { deletedTransactions, loading: l1 } = useTransactions();
  const { deletedInvestments, loading: l2 } = useInvestments();
  const { deletedSubscriptions, loading: l3 } = useSubscriptions();
  const { deletedItems, loading: l4 } = useWatchlist();
  const { deletedContacts, loading: l5 } = useContacts();

  const loading = l1 || l2 || l3 || l4 || l5;

  const trashItems = useMemo(
    () =>
      mergeAndSortTrashItems(
        transactionsToTrashItems(deletedTransactions),
        investmentsToTrashItems(deletedInvestments),
        subscriptionsToTrashItems(deletedSubscriptions),
        watchlistToTrashItems(deletedItems),
        contactsToTrashItems(deletedContacts)
      ),
    [deletedTransactions, deletedInvestments, deletedSubscriptions, deletedItems, deletedContacts]
  );

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<TrashItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleRestore(item: TrashItem) {
    if (!user) return;
    setRestoringId(item.id);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await restoreTrashItem(user.uid, item.module, item.id, editorName, item.label, item.transferPairId);
    } finally {
      setRestoringId(null);
    }
  }

  async function handleConfirmPermanentDelete() {
    if (!user || !confirmTarget) return;
    setDeleting(true);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await permanentlyDeleteTrashItem(
        user.uid,
        confirmTarget.module,
        confirmTarget.id,
        editorName,
        confirmTarget.label
      );
    } finally {
      setDeleting(false);
      setConfirmTarget(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Recycle Bin
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Item di sini otomatis terhapus permanen setelah {AUTO_PURGE_DAYS} hari.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-control border border-border-hairline bg-bg-surface"
            />
          ))}
        </div>
      ) : trashItems.length === 0 ? (
        <EmptyState
          icon={<TrashIcon width={22} height={22} />}
          title="Recycle Bin kosong"
          description="Item yang dihapus dari modul manapun akan muncul di sini dan bisa dipulihkan."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {trashItems.map((item) => {
            const deletedDate = item.deletedAt.toDate();
            const daysLeft = AUTO_PURGE_DAYS - daysAgo(deletedDate);
            const nearPurge = isPastAutoPurgeThreshold(deletedDate) || daysLeft <= 3;

            return (
              <div
                key={`${item.module}-${item.id}`}
                className={`flex flex-col gap-2 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5 ${
                  nearPurge ? "halo-amber" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {item.label}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {ACTIVITY_MODULE_LABELS[item.module]} · {item.subtitle} · dihapus{" "}
                      {formatDateID(deletedDate)}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 text-xs ${nearPurge ? "text-accent-amber" : "text-text-tertiary"}`}
                  >
                    {daysLeft <= 0 ? "Segera terhapus" : `${daysLeft} hari lagi`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border-hairline pt-2">
                  <LastEditedBy name={item.lastEditedBy} />
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleRestore(item)}
                      disabled={restoringId === item.id}
                      className="flex items-center gap-1.5 rounded-control bg-accent-emerald-soft px-3 py-1.5 text-xs font-medium text-accent-emerald transition-opacity hover:opacity-80 disabled:opacity-60"
                    >
                      <RestoreIcon width={14} height={14} />
                      {restoringId === item.id ? "Memulihkan…" : "Pulihkan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(item)}
                      className="rounded-control border border-danger/40 px-3 py-1.5 text-xs text-danger hover:bg-danger-soft"
                    >
                      Hapus permanen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Hapus permanen?"
        description={`"${confirmTarget?.label}" akan dihapus selamanya dan TIDAK BISA dipulihkan lagi.`}
        confirmLabel={deleting ? "Menghapus…" : "Hapus permanen"}
        onConfirm={handleConfirmPermanentDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
