"use client";

import { useTransactions } from "@/lib/hooks/useTransactions";
import {
  getMonthlyTotal,
  getLast7DaysNet,
  getRecentTransactions,
} from "@/lib/selectors/financeSelectors";
import { SummaryCard } from "./SummaryCard";
import { Sparkline } from "@/components/shared/Sparkline";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { LedgerLinesIcon } from "@/components/ui/icons";
import { formatIDR } from "@/lib/format";

/**
 * Bagian 7: total bulan ini + sparkline 7 hari + 3 transaksi terbaru.
 * Logic agregasi 100% dari financeSelectors — tidak dihitung ulang di sini.
 */
export function FinanceSummaryCard() {
  const { transactions, loading } = useTransactions();

  if (loading) {
    return (
      <div className="h-[220px] animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
    );
  }

  const monthlyTotal = getMonthlyTotal(transactions);
  const sparklineData = getLast7DaysNet(transactions);
  const recent = getRecentTransactions(transactions, 3);

  return (
    <SummaryCard href="/finance" title="Finance" icon={<LedgerLinesIcon />}>
      <div className="flex items-end justify-between">
        <div>
          <p
            className={`text-2xl ${monthlyTotal.net >= 0 ? "text-text-primary" : "text-danger"}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {formatIDR(monthlyTotal.net)}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">Net bulan ini</p>
        </div>
        <Sparkline points={sparklineData} />
      </div>

      {recent.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border-hairline pt-3">
          {recent.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-text-secondary">
                {tx.category || "Tanpa kategori"}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-text-primary">
                  {tx.type === "income" ? "+" : "−"}
                  {formatIDR(tx.amount)}
                </span>
                <LastEditedBy name={tx.lastEditedBy} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="border-t border-border-hairline pt-3 text-xs text-text-tertiary">
          Belum ada transaksi bulan ini.
        </p>
      )}
    </SummaryCard>
  );
}
