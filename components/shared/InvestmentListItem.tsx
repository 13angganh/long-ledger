"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { softDeleteInvestment } from "@/lib/repositories/investmentRepo";
import type { Investment } from "@/lib/types/investment";
import { INVESTMENT_TYPE_LABELS } from "@/lib/types/investment";
import { getInvestmentCurrentValue, getInvestmentGainLoss } from "@/lib/selectors/investmentSelectors";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { QuickActions } from "@/components/shared/QuickActions";
import { QuickViewModal, QuickViewRow } from "@/components/shared/QuickViewModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDateID } from "@/lib/format";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

export function InvestmentListItem({ investment }: { investment: Investment }) {
  const { user } = useAuth();
  const currentValue = getInvestmentCurrentValue(investment);
  const gainLoss = getInvestmentGainLoss(investment);
  const isGain = gainLoss.nominal >= 0;
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await softDeleteInvestment(user.uid, investment.id, editorName, investment.name);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Link
        href={`/investments/${investment.id}`}
        className="card-interactive flex flex-col gap-2 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-text-primary">
                {investment.name}
              </span>
              {investment.status !== "active" && (
                <Badge tone="neutral">
                  {investment.status === "sold" ? "Terjual" : "Jatuh tempo"}
                </Badge>
              )}
            </div>
            <span className="text-xs text-text-tertiary">
              {INVESTMENT_TYPE_LABELS[investment.type]}
            </span>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm font-medium text-text-primary">
              {formatIDR(currentValue)}
            </span>
            <span className={`text-xs ${isGain ? "text-accent-emerald" : "text-danger"}`}>
              {isGain ? "+" : ""}
              {gainLoss.percent.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border-hairline pt-2">
          <LastEditedBy name={investment.lastEditedBy} />
          <QuickActions
            onView={() => setViewOpen(true)}
            editHref={`/investments/${investment.id}`}
            onDelete={() => setConfirmOpen(true)}
          />
        </div>
      </Link>

      <QuickViewModal
        open={viewOpen}
        title={investment.name}
        editHref={`/investments/${investment.id}`}
        onClose={() => setViewOpen(false)}
      >
        <QuickViewRow label="Jenis" value={INVESTMENT_TYPE_LABELS[investment.type]} />
        <QuickViewRow label="Nilai saat ini" value={formatIDR(currentValue)} />
        <QuickViewRow
          label="Gain/Loss"
          value={`${isGain ? "+" : ""}${formatIDR(gainLoss.nominal)} (${gainLoss.percent.toFixed(1)}%)`}
        />
        <QuickViewRow label="Modal awal" value={formatIDR(investment.purchaseTotal)} />
        <QuickViewRow label="Tanggal beli" value={formatDateID(investment.purchaseDate.toDate())} />
        {investment.note && <QuickViewRow label="Catatan" value={investment.note} />}
        <QuickViewRow label="Terakhir diubah" value={<LastEditedBy name={investment.lastEditedBy} />} />
      </QuickViewModal>

      <ConfirmDialog
        open={confirmOpen}
        title="Pindahkan ke Recycle Bin?"
        description="Investasi akan dipindah ke Recycle Bin dan bisa dipulihkan kapan saja dalam 30 hari sebelum terhapus permanen."
        confirmLabel={deleting ? "Memindahkan…" : "Pindahkan"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
