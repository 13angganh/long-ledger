"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { softDeleteSubscription } from "@/lib/repositories/subscriptionRepo";
import type { Subscription } from "@/lib/types/subscription";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { QuickActions } from "@/components/shared/QuickActions";
import { QuickViewModal, QuickViewRow } from "@/components/shared/QuickViewModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDateID } from "@/lib/format";
import { OWNER_LABELS } from "@/lib/types/transaction";

const CYCLE_LABELS: Record<Subscription["billingCycle"], string> = {
  monthly: "/bulan",
  yearly: "/tahun",
  weekly: "/minggu",
};

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

export function SubscriptionListItem({ subscription }: { subscription: Subscription }) {
  const { user } = useAuth();
  const renewalDate = subscription.nextRenewalDate.toDate();
  const days = daysUntil(renewalDate);
  const isUrgent = subscription.status === "active" && days >= 0 && days <= 7;
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await softDeleteSubscription(user.uid, subscription.id, editorName, subscription.name);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Link
        href={`/subscriptions/${subscription.id}`}
        className={`card-interactive flex flex-col gap-2 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5 ${
          isUrgent ? "halo-amber" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-text-primary">
                {subscription.name}
              </span>
              {subscription.status !== "active" && (
                <Badge tone="neutral">
                  {subscription.status === "paused" ? "Dijeda" : "Dibatalkan"}
                </Badge>
              )}
              <Badge tone="neutral">{OWNER_LABELS[subscription.owner]}</Badge>
            </div>
            <span className="text-xs text-text-tertiary">
              {subscription.status === "active"
                ? days < 0
                  ? `Terlewat ${formatDateID(renewalDate)}`
                  : days === 0
                    ? "Perpanjang hari ini"
                    : `Perpanjang dalam ${days} hari`
                : formatDateID(renewalDate)}
            </span>
          </div>

          <span className="shrink-0 text-sm font-medium text-text-primary">
            {formatIDR(subscription.amount)}
            <span className="text-xs text-text-tertiary">
              {CYCLE_LABELS[subscription.billingCycle]}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border-hairline pt-2">
          <LastEditedBy name={subscription.lastEditedBy} />
          <QuickActions
            onView={() => setViewOpen(true)}
            editHref={`/subscriptions/${subscription.id}`}
            onDelete={() => setConfirmOpen(true)}
          />
        </div>
      </Link>

      <QuickViewModal
        open={viewOpen}
        title={subscription.name}
        editHref={`/subscriptions/${subscription.id}`}
        onClose={() => setViewOpen(false)}
      >
        <QuickViewRow
          label="Jumlah"
          value={`${formatIDR(subscription.amount)}${CYCLE_LABELS[subscription.billingCycle]}`}
        />
        <QuickViewRow label="Perpanjangan berikutnya" value={formatDateID(renewalDate)} />
        <QuickViewRow label="Pemilik" value={OWNER_LABELS[subscription.owner]} />
        {subscription.category && <QuickViewRow label="Kategori" value={subscription.category} />}
        <QuickViewRow
          label="Status"
          value={
            subscription.status === "active"
              ? "Aktif"
              : subscription.status === "paused"
                ? "Dijeda"
                : "Dibatalkan"
          }
        />
        <QuickViewRow label="Terakhir diubah" value={<LastEditedBy name={subscription.lastEditedBy} />} />
      </QuickViewModal>

      <ConfirmDialog
        open={confirmOpen}
        title="Pindahkan ke Recycle Bin?"
        description="Langganan akan dipindah ke Recycle Bin dan bisa dipulihkan kapan saja dalam 30 hari sebelum terhapus permanen."
        confirmLabel={deleting ? "Memindahkan…" : "Pindahkan"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
