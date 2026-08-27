"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { softDeleteTransaction } from "@/lib/repositories/transactionRepo";
import type { Transaction } from "@/lib/types/transaction";
import { ACCOUNT_TYPE_LABELS, OWNER_LABELS } from "@/lib/types/transaction";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { QuickActions } from "@/components/shared/QuickActions";
import { QuickViewModal, QuickViewRow } from "@/components/shared/QuickViewModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDateID, formatDateShortID } from "@/lib/format";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

export function TransactionListItem({ transaction }: { transaction: Transaction }) {
  const { user } = useAuth();
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await softDeleteTransaction(
        user.uid,
        transaction.id,
        editorName,
        transaction.category || "Transaksi",
        transaction.transferPairId
      );
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Link
        href={`/finance/${transaction.id}`}
        className="card-interactive flex flex-col gap-2 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-text-primary">
                {transaction.category || "Tanpa kategori"}
              </span>
              {isTransfer && <Badge tone="amber">Transfer</Badge>}
            </div>
            <span className="truncate text-xs text-text-tertiary">
              {formatDateShortID(transaction.date.toDate())} ·{" "}
              {ACCOUNT_TYPE_LABELS[transaction.accountType]} · {OWNER_LABELS[transaction.owner]}
              {transaction.note ? ` · ${transaction.note}` : ""}
            </span>
          </div>

          <span
            className={`shrink-0 text-sm font-medium ${
              isTransfer
                ? "text-accent-amber"
                : isIncome
                  ? "text-accent-emerald"
                  : "text-text-primary"
            }`}
          >
            {isTransfer ? "⇄" : isIncome ? "+" : "−"}
            {formatIDR(transaction.amount)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border-hairline pt-2">
          <LastEditedBy name={transaction.lastEditedBy} />
          <QuickActions
            onView={() => setViewOpen(true)}
            editHref={`/finance/${transaction.id}`}
            onDelete={() => setConfirmOpen(true)}
          />
        </div>
      </Link>

      <QuickViewModal
        open={viewOpen}
        title={transaction.category || "Transaksi"}
        editHref={`/finance/${transaction.id}`}
        onClose={() => setViewOpen(false)}
      >
        <QuickViewRow
          label="Tipe"
          value={isTransfer ? "Transfer" : isIncome ? "Pemasukan" : "Pengeluaran"}
        />
        <QuickViewRow label="Jumlah" value={formatIDR(transaction.amount)} />
        <QuickViewRow label="Akun" value={ACCOUNT_TYPE_LABELS[transaction.accountType]} />
        <QuickViewRow label="Pemilik" value={OWNER_LABELS[transaction.owner]} />
        <QuickViewRow label="Tanggal" value={formatDateID(transaction.date.toDate())} />
        {transaction.note && <QuickViewRow label="Catatan" value={transaction.note} />}
        <QuickViewRow label="Terakhir diubah" value={<LastEditedBy name={transaction.lastEditedBy} />} />
      </QuickViewModal>

      <ConfirmDialog
        open={confirmOpen}
        title="Pindahkan ke Recycle Bin?"
        description={
          isTransfer
            ? "Ini bagian dari transfer — kedua sisi (asal & tujuan) akan dipindah ke Recycle Bin bersamaan dan bisa dipulihkan kapan saja dalam 30 hari."
            : "Transaksi akan dipindah ke Recycle Bin dan bisa dipulihkan kapan saja dalam 30 hari sebelum terhapus permanen."
        }
        confirmLabel={deleting ? "Memindahkan…" : "Pindahkan"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
