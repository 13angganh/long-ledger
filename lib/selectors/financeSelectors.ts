import type { Transaction } from "@/lib/types/transaction";

/**
 * SATU-SATUNYA lapisan yang menghitung logic agregasi/turunan untuk data
 * finance (Bagian 4.2 aturan #2). Dashboard DAN /finance sama-sama panggil
 * fungsi di sini — tidak pernah dihitung ulang di komponen.
 */

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface MonthlyTotal {
  income: number;
  expense: number;
  net: number;
}

/**
 * Total pemasukan/pengeluaran/net untuk bulan berjalan (default: bulan ini).
 */
export function getMonthlyTotal(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): MonthlyTotal {
  const monthStart = startOfMonth(referenceDate);

  return transactions.reduce<MonthlyTotal>(
    (acc, tx) => {
      const txDate = tx.date.toDate();
      if (txDate < monthStart) return acc;

      if (tx.type === "income") {
        acc.income += tx.amount;
      } else {
        acc.expense += tx.amount;
      }
      acc.net = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, net: 0 }
  );
}

export interface SparklinePoint {
  date: string; // ISO date, untuk key React
  net: number; // net harian (income - expense)
}

/**
 * Net harian untuk 7 hari terakhir (termasuk hari ini), untuk mini
 * sparkline di FinanceSummaryCard (Bagian 7).
 */
export function getLast7DaysNet(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): SparklinePoint[] {
  const days: SparklinePoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date(referenceDate);
    day.setDate(day.getDate() - i);

    const net = transactions
      .filter((tx) => isSameDay(tx.date.toDate(), day))
      .reduce(
        (sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
        0
      );

    days.push({ date: day.toISOString().slice(0, 10), net });
  }

  return days;
}

/** Transaksi terbaru, diurut descending by date, dibatasi `limit` item. */
export function getRecentTransactions(
  transactions: Transaction[],
  limit = 3
): Transaction[] {
  return [...transactions]
    .sort((a, b) => b.date.toMillis() - a.date.toMillis())
    .slice(0, limit);
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}

/**
 * Breakdown pengeluaran per kategori untuk bulan berjalan, diurut dari
 * terbesar. Dipakai untuk chart/list breakdown di /finance.
 */
export function getExpenseByCategory(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): CategoryBreakdown[] {
  const monthStart = startOfMonth(referenceDate);
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    if (tx.date.toDate() < monthStart) continue;
    const key = tx.category || "Tanpa kategori";
    totals.set(key, (totals.get(key) ?? 0) + tx.amount);
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/** Filter transaksi berdasarkan kategori (untuk halaman /finance). */
export function filterByCategory(
  transactions: Transaction[],
  category: string | null
): Transaction[] {
  if (!category) return transactions;
  return transactions.filter((tx) => tx.category === category);
}

/** Filter transaksi berdasarkan tipe (income/expense/semua). */
export function filterByType(
  transactions: Transaction[],
  type: Transaction["type"] | null
): Transaction[] {
  if (!type) return transactions;
  return transactions.filter((tx) => tx.type === type);
}
