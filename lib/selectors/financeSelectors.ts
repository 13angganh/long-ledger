import type { Transaction, Owner } from "@/lib/types/transaction";
import { OWNER_LABELS } from "@/lib/types/transaction";

/**
 * SATU-SATUNYA lapisan yang menghitung logic agregasi/turunan untuk data
 * finance (Bagian 4.2 aturan #2). Dashboard DAN /finance sama-sama panggil
 * fungsi di sini — tidak pernah dihitung ulang di komponen.
 *
 * PENTING (Poin 9): transaksi bertipe "transfer" (perpindahan tunai<->bank)
 * SELALU dikecualikan dari total income/expense — uangnya tidak hilang atau
 * bertambah, cuma pindah tempat, jadi tidak boleh dihitung sebagai
 * pemasukan/pengeluaran sungguhan.
 */

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Awal bulan BERIKUTNYA — dipakai sebagai batas atas (eksklusif) supaya
 * filter "bulan X" tidak ikut menghitung transaksi dari bulan setelahnya. */
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
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
 * Total pemasukan/pengeluaran/net untuk SATU bulan spesifik (default: bulan
 * ini) — bukan "bulan X dan seterusnya". Transfer DIKECUALIKAN sepenuhnya
 * dari perhitungan ini.
 */
export function getMonthlyTotal(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): MonthlyTotal {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  return transactions.reduce<MonthlyTotal>(
    (acc, tx) => {
      const txDate = tx.date.toDate();
      if (txDate < monthStart || txDate >= monthEnd) return acc;
      if (tx.type === "transfer") return acc;

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

/**
 * True kalau ada transaksi non-transfer di bulan berjalan. Dipakai UI untuk
 * membedakan "Rp 0 karena memang belum ada transaksi bulan ini" (tampilkan
 * pesan konteks) dari "Rp 0 karena semua nilainya kebetulan nol" — supaya
 * saldo bulan lalu yang tidak ikut terhitung di getMonthlyTotal tidak
 * terlihat seperti data hilang/bug.
 */
export function hasTransactionsThisMonth(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): boolean {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  return transactions.some(
    (tx) =>
      tx.type !== "transfer" && tx.date.toDate() >= monthStart && tx.date.toDate() < monthEnd
  );
}

export interface SparklinePoint {
  date: string; // ISO date, untuk key React
  net: number; // net harian (income - expense), transfer dikecualikan
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
      .filter((tx) => tx.type !== "transfer" && isSameDay(tx.date.toDate(), day))
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
  const monthEnd = endOfMonth(referenceDate);
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    const txDate = tx.date.toDate();
    if (txDate < monthStart || txDate >= monthEnd) continue;
    const key = tx.category || "Tanpa kategori";
    totals.set(key, (totals.get(key) ?? 0) + tx.amount);
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface OwnerBreakdown {
  owner: Owner;
  label: string;
  income: number;
  expense: number;
  net: number;
}

/**
 * Poin 9: breakdown pemasukan/pengeluaran per pemilik (suami/istri) untuk
 * bulan berjalan — supaya kelihatan kontribusi masing-masing meski tetap
 * satu rangkaian catatan sinkron. Transfer dikecualikan (sama seperti
 * getMonthlyTotal).
 */
export function getBreakdownByOwner(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): OwnerBreakdown[] {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);
  const totals: Record<Owner, { income: number; expense: number }> = {
    suami: { income: 0, expense: 0 },
    istri: { income: 0, expense: 0 },
  };

  for (const tx of transactions) {
    if (tx.type === "transfer") continue;
    const txDate = tx.date.toDate();
    if (txDate < monthStart || txDate >= monthEnd) continue;
    if (tx.type === "income") {
      totals[tx.owner].income += tx.amount;
    } else {
      totals[tx.owner].expense += tx.amount;
    }
  }

  return (Object.keys(totals) as Owner[]).map((owner) => ({
    owner,
    label: OWNER_LABELS[owner],
    income: totals[owner].income,
    expense: totals[owner].expense,
    net: totals[owner].income - totals[owner].expense,
  }));
}

export interface AccountBalance {
  accountType: "cash" | "bank";
  label: string;
  balance: number;
}

/**
 * Poin 9: saldo berjalan per jenis akun (tunai/bank), dihitung dari SELURUH
 * histori transaksi (bukan cuma bulan ini) — income menambah, expense
 * mengurangi, transfer memindah antar akun sesuai arahnya.
 */
export function getBalanceByAccount(transactions: Transaction[]): AccountBalance[] {
  let cash = 0;
  let bank = 0;

  for (const tx of transactions) {
    if (tx.type === "income") {
      if (tx.accountType === "cash") cash += tx.amount;
      else bank += tx.amount;
    } else if (tx.type === "expense") {
      if (tx.accountType === "cash") cash -= tx.amount;
      else bank -= tx.amount;
    } else if (tx.type === "transfer") {
      // accountType di dokumen ini adalah akun ASAL — selalu dikurangi.
      if (tx.accountType === "cash") cash -= tx.amount;
      else bank -= tx.amount;
    }
  }

  return [
    { accountType: "cash", label: "Tunai", balance: cash },
    { accountType: "bank", label: "Bank", balance: bank },
  ];
}

export interface MonthOption {
  /** Key stabil "YYYY-MM" untuk value <select> dan perbandingan filter. */
  key: string;
  year: number;
  /** 0-indexed, sama seperti Date.getMonth() — bulan Januari = 0. */
  month: number;
  /** Label tampilan Indonesia, mis. "September 2026". */
  label: string;
}

/**
 * Daftar bulan yang bisa dipilih di selector /finance: setiap bulan yang
 * benar-benar punya transaksi, DITAMBAH bulan kalender saat ini walau belum
 * ada datanya (supaya user selalu bisa balik ke "bulan berjalan" walau
 * kosong) — diurut dari terbaru ke terlama.
 */
export function getAvailableMonths(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): MonthOption[] {
  const seen = new Map<string, MonthOption>();

  const addMonth = (date: Date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (seen.has(key)) return;
    seen.set(key, {
      key,
      year: date.getFullYear(),
      month: date.getMonth(),
      label: new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date),
    });
  };

  addMonth(referenceDate);
  for (const tx of transactions) {
    addMonth(tx.date.toDate());
  }

  return Array.from(seen.values()).sort((a, b) =>
    b.key.localeCompare(a.key)
  );
}

/** Filter transaksi ke satu bulan (dari MonthOption) — untuk daftar
 * transaksi di /finance supaya konsisten dengan card ringkasan di atasnya. */
export function filterByMonth(
  transactions: Transaction[],
  monthOption: MonthOption | null
): Transaction[] {
  if (!monthOption) return transactions;
  const monthStart = new Date(monthOption.year, monthOption.month, 1);
  const monthEnd = new Date(monthOption.year, monthOption.month + 1, 1);
  return transactions.filter((tx) => {
    const txDate = tx.date.toDate();
    return txDate >= monthStart && txDate < monthEnd;
  });
}

/** Filter transaksi berdasarkan kategori (untuk halaman /finance). */
export function filterByCategory(
  transactions: Transaction[],
  category: string | null
): Transaction[] {
  if (!category) return transactions;
  return transactions.filter((tx) => tx.category === category);
}

/** Filter transaksi berdasarkan tipe (income/expense/transfer/semua). */
export function filterByType(
  transactions: Transaction[],
  type: Transaction["type"] | null
): Transaction[] {
  if (!type) return transactions;
  return transactions.filter((tx) => tx.type === type);
}

/** Filter transaksi berdasarkan pemilik (suami/istri/semua). */
export function filterByOwner(
  transactions: Transaction[],
  owner: Owner | null
): Transaction[] {
  if (!owner) return transactions;
  return transactions.filter((tx) => tx.owner === owner);
}

/** Filter transaksi berdasarkan jenis akun (tunai/bank/semua). */
export function filterByAccountType(
  transactions: Transaction[],
  accountType: Transaction["accountType"] | null
): Transaction[] {
  if (!accountType) return transactions;
  return transactions.filter((tx) => tx.accountType === accountType);
}
