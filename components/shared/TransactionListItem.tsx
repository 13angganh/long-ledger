import Link from "next/link";
import type { Transaction } from "@/lib/types/transaction";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { formatIDR, formatDateShortID } from "@/lib/format";

export function TransactionListItem({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "income";

  return (
    <Link
      href={`/finance/${transaction.id}`}
      className="card-interactive flex items-center justify-between gap-3 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-text-primary">
          {transaction.category || "Tanpa kategori"}
        </span>
        <span className="truncate text-xs text-text-tertiary">
          {formatDateShortID(transaction.date.toDate())}
          {transaction.note ? ` · ${transaction.note}` : ""}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`text-sm font-medium ${isIncome ? "text-accent-emerald" : "text-text-primary"}`}
        >
          {isIncome ? "+" : "−"}
          {formatIDR(transaction.amount)}
        </span>
        <LastEditedBy name={transaction.lastEditedBy} />
      </div>
    </Link>
  );
}
