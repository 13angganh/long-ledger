"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { softDeleteWatchlistItem } from "@/lib/repositories/watchlistRepo";
import type { WatchlistItem } from "@/lib/types/watchlist";
import { WATCHLIST_TYPE_LABELS, WATCHLIST_STATUS_LABELS } from "@/lib/types/watchlist";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { RatingStars } from "@/components/shared/RatingStars";
import { QuickActions } from "@/components/shared/QuickActions";
import { QuickViewModal, QuickViewRow } from "@/components/shared/QuickViewModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { formatDateShortID, formatDateID } from "@/lib/format";

const STATUS_TONE: Record<WatchlistItem["status"], "neutral" | "emerald" | "amber"> = {
  planned: "neutral",
  in_progress: "amber",
  completed: "emerald",
};

/** Tanggal paling relevan untuk ditampilkan sesuai status saat ini. */
function relevantDateLabel(item: WatchlistItem): string | null {
  if (item.status === "completed" && item.completedAt) {
    return `Selesai ${formatDateShortID(item.completedAt.toDate())}`;
  }
  if (item.status === "in_progress" && item.startedAt) {
    return `Dimulai ${formatDateShortID(item.startedAt.toDate())}`;
  }
  return null;
}

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

export function WatchlistListItem({ item }: { item: WatchlistItem }) {
  const { user } = useAuth();
  const dateLabel = relevantDateLabel(item);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await softDeleteWatchlistItem(user.uid, item.id, editorName, item.title);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Link
        href={`/watchlist/${item.id}`}
        className="card-interactive flex flex-col gap-2 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium text-text-primary">{item.title}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary">{WATCHLIST_TYPE_LABELS[item.type]}</span>
              <Badge tone={STATUS_TONE[item.status]}>{WATCHLIST_STATUS_LABELS[item.status]}</Badge>
              {dateLabel && <span className="text-xs text-text-tertiary">· {dateLabel}</span>}
            </div>
          </div>

          {item.rating !== null && <RatingStars value={item.rating} size={13} />}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border-hairline pt-2">
          <LastEditedBy name={item.lastEditedBy} />
          <QuickActions
            onView={() => setViewOpen(true)}
            editHref={`/watchlist/${item.id}`}
            onDelete={() => setConfirmOpen(true)}
          />
        </div>
      </Link>

      <QuickViewModal
        open={viewOpen}
        title={item.title}
        editHref={`/watchlist/${item.id}`}
        onClose={() => setViewOpen(false)}
      >
        <QuickViewRow label="Jenis" value={WATCHLIST_TYPE_LABELS[item.type]} />
        <QuickViewRow label="Status" value={WATCHLIST_STATUS_LABELS[item.status]} />
        {item.rating !== null && (
          <QuickViewRow label="Rating" value={<RatingStars value={item.rating} size={16} />} />
        )}
        {item.startedAt && (
          <QuickViewRow label="Dimulai" value={formatDateID(item.startedAt.toDate())} />
        )}
        {item.completedAt && (
          <QuickViewRow label="Selesai" value={formatDateID(item.completedAt.toDate())} />
        )}
        {item.note && <QuickViewRow label="Catatan" value={item.note} />}
        <QuickViewRow label="Terakhir diubah" value={<LastEditedBy name={item.lastEditedBy} />} />
      </QuickViewModal>

      <ConfirmDialog
        open={confirmOpen}
        title="Pindahkan ke Recycle Bin?"
        description="Item akan dipindah ke Recycle Bin dan bisa dipulihkan kapan saja dalam 30 hari sebelum terhapus permanen."
        confirmLabel={deleting ? "Memindahkan…" : "Pindahkan"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
