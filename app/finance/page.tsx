"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTransactions } from "@/lib/hooks/useTransactions";
import {
  getMonthlyTotal,
  getBalanceByAccount,
  getAvailableMonths,
  filterByMonth,
  filterByCategory,
  filterByType,
  filterByOwner,
  type MonthOption,
} from "@/lib/selectors/financeSelectors";
import { TransactionListItem } from "@/components/shared/TransactionListItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { LedgerLinesIcon } from "@/components/ui/icons";
import { formatIDR } from "@/lib/format";
import { OWNER_LABELS, type Owner } from "@/lib/types/transaction";
import type { Transaction } from "@/lib/types/transaction";

type TypeFilter = Transaction["type"] | null;

export default function FinancePage() {
  const { transactions, loading, error } = useTransactions();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<Owner | null>(null);

  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);
  // Default: bulan kalender saat ini — availableMonths selalu memuat ini
  // sebagai entri pertama (lihat getAvailableMonths), jadi aman diambil
  // langsung tanpa perlu useEffect terpisah.
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => availableMonths[0].key);
  const selectedMonth: MonthOption =
    availableMonths.find((m) => m.key === selectedMonthKey) ?? availableMonths[0];
  const monthReferenceDate = useMemo(
    () => new Date(selectedMonth.year, selectedMonth.month, 1),
    [selectedMonth]
  );

  const monthlyTotal = useMemo(
    () => getMonthlyTotal(transactions, monthReferenceDate),
    [transactions, monthReferenceDate]
  );
  const balances = useMemo(() => getBalanceByAccount(transactions), [transactions]);

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(set);
  }, [transactions]);

  const filtered = useMemo(() => {
    let result = filterByMonth(transactions, selectedMonth);
    result = filterByType(result, typeFilter);
    result = filterByCategory(result, categoryFilter);
    result = filterByOwner(result, ownerFilter);
    return result;
  }, [transactions, selectedMonth, typeFilter, categoryFilter, ownerFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1
          className="text-xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Finance
        </h1>
        <Link
          href="/finance/new"
          className="rounded-control bg-accent-emerald px-4 py-2 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
        >
          + Transaksi
        </Link>
      </div>

      {/* Saldo per akun (Poin 9) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {balances.map((b) => (
          <div key={b.accountType} className="rounded-card border border-border-hairline bg-bg-surface p-3 sm:p-4">
            <p className="text-xs text-text-tertiary">Saldo {b.label}</p>
            <p
              className="mt-1 text-sm sm:text-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatIDR(b.balance)}
            </p>
          </div>
        ))}
      </div>

      {/* Selector bulan + Summary */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-tertiary">Ringkasan untuk</p>
        <select
          value={selectedMonth.key}
          onChange={(e) => setSelectedMonthKey(e.target.value)}
          className="rounded-control border border-border-hairline bg-bg-surface px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-accent-emerald"
        >
          {availableMonths.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-card border border-border-hairline bg-bg-surface p-3 sm:p-4">
          <p className="text-xs text-text-tertiary">Pemasukan</p>
          <p
            className="mt-1 text-sm text-accent-emerald sm:text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {formatIDR(monthlyTotal.income)}
          </p>
        </div>
        <div className="rounded-card border border-border-hairline bg-bg-surface p-3 sm:p-4">
          <p className="text-xs text-text-tertiary">Pengeluaran</p>
          <p
            className="mt-1 text-sm text-text-primary sm:text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {formatIDR(monthlyTotal.expense)}
          </p>
        </div>
        <div className="rounded-card border border-border-hairline bg-bg-surface p-3 sm:p-4">
          <p className="text-xs text-text-tertiary">Net</p>
          <p
            className={`mt-1 text-sm sm:text-lg ${monthlyTotal.net >= 0 ? "text-accent-emerald" : "text-danger"}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {formatIDR(monthlyTotal.net)}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label="Semua"
          active={typeFilter === null}
          onClick={() => setTypeFilter(null)}
        />
        <FilterChip
          label="Pemasukan"
          active={typeFilter === "income"}
          onClick={() => setTypeFilter("income")}
        />
        <FilterChip
          label="Pengeluaran"
          active={typeFilter === "expense"}
          onClick={() => setTypeFilter("expense")}
        />
        <FilterChip
          label="Transfer"
          active={typeFilter === "transfer"}
          onClick={() => setTypeFilter("transfer")}
        />
        <select
          value={ownerFilter ?? ""}
          onChange={(e) => setOwnerFilter((e.target.value || null) as Owner | null)}
          className="rounded-control border border-border-hairline bg-bg-surface px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-accent-emerald"
        >
          <option value="">Semua pemilik</option>
          {(Object.entries(OWNER_LABELS) as [Owner, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {categories.length > 0 && (
          <select
            value={categoryFilter ?? ""}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            className="rounded-control border border-border-hairline bg-bg-surface px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-accent-emerald"
          >
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[62px] animate-pulse rounded-control border border-border-hairline bg-bg-surface"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">Gagal memuat transaksi: {error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<LedgerLinesIcon width={22} height={22} />}
          title={
            transactions.length === 0
              ? "Belum ada transaksi"
              : "Tidak ada transaksi yang cocok"
          }
          description={
            transactions.length === 0
              ? "Mulai catat pemasukan atau pengeluaran pertama supaya ringkasan bulanan mulai terisi."
              : !typeFilter && !categoryFilter && !ownerFilter
                ? `Belum ada transaksi di ${selectedMonth.label}. Coba pilih bulan lain di atas.`
                : "Coba ubah filter untuk melihat transaksi lain."
          }
          actionLabel={transactions.length === 0 ? "Tambah transaksi" : undefined}
          onAction={
            transactions.length === 0
              ? () => (window.location.href = "/finance/new")
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((tx) => (
            <TransactionListItem key={tx.id} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${
        active
          ? "border-accent-emerald bg-accent-emerald-soft text-text-primary"
          : "border-border-hairline text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}
