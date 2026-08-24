"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useInvestments } from "@/lib/hooks/useInvestments";
import {
  getTotalPortfolioValue,
  getTotalGainLoss,
  filterByInvestmentType,
  filterByInvestmentStatus,
} from "@/lib/selectors/investmentSelectors";
import { InvestmentListItem } from "@/components/shared/InvestmentListItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUpIcon } from "@/components/ui/icons";
import { INVESTMENT_TYPE_ORDER, INVESTMENT_TYPE_LABELS } from "@/lib/investmentFieldConfig";
import { formatIDR } from "@/lib/format";
import type { Investment, InvestmentType } from "@/lib/types/investment";

export default function InvestmentsPage() {
  const { investments, loading, error } = useInvestments();
  const [typeFilter, setTypeFilter] = useState<InvestmentType | null>(null);
  const [statusFilter, setStatusFilter] = useState<Investment["status"] | null>(
    "active"
  );

  const totalValue = useMemo(() => getTotalPortfolioValue(investments), [investments]);
  const gainLoss = useMemo(() => getTotalGainLoss(investments), [investments]);

  const filtered = useMemo(() => {
    let result = filterByInvestmentStatus(investments, statusFilter);
    result = filterByInvestmentType(result, typeFilter);
    return result;
  }, [investments, statusFilter, typeFilter]);

  const usedTypes = useMemo(() => {
    const set = new Set(investments.map((inv) => inv.type));
    return INVESTMENT_TYPE_ORDER.filter((t) => set.has(t));
  }, [investments]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Investasi
        </h1>
        <Link
          href="/investments/new"
          className="rounded-control bg-accent-emerald px-4 py-2 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
        >
          + Investasi
        </Link>
      </div>

      {/* Summary portofolio */}
      <div className="rounded-card border border-border-hairline bg-bg-surface p-6">
        <p className="text-xs text-text-tertiary">Total nilai portofolio</p>
        <p className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          {formatIDR(totalValue)}
        </p>
        <p className={`mt-1 text-sm ${gainLoss.nominal >= 0 ? "text-accent-emerald" : "text-danger"}`}>
          {gainLoss.nominal >= 0 ? "+" : ""}
          {formatIDR(gainLoss.nominal)} ({gainLoss.percent >= 0 ? "+" : ""}
          {gainLoss.percent.toFixed(1)}%)
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label="Aktif"
          active={statusFilter === "active"}
          onClick={() => setStatusFilter("active")}
        />
        <FilterChip
          label="Semua status"
          active={statusFilter === null}
          onClick={() => setStatusFilter(null)}
        />
        {usedTypes.length > 0 && (
          <select
            value={typeFilter ?? ""}
            onChange={(e) =>
              setTypeFilter((e.target.value || null) as InvestmentType | null)
            }
            className="rounded-control border border-border-hairline bg-bg-surface px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-accent-emerald"
          >
            <option value="">Semua jenis</option>
            {usedTypes.map((t) => (
              <option key={t} value={t}>
                {INVESTMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[68px] animate-pulse rounded-control border border-border-hairline bg-bg-surface"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">Gagal memuat investasi: {error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<TrendingUpIcon width={22} height={22} />}
          title={investments.length === 0 ? "Belum ada investasi" : "Tidak ada yang cocok"}
          description={
            investments.length === 0
              ? "Catat investasi pertama untuk mulai lacak nilai portofolio dari waktu ke waktu."
              : "Coba ubah filter untuk melihat investasi lain."
          }
          actionLabel={investments.length === 0 ? "Tambah investasi" : undefined}
          onAction={
            investments.length === 0
              ? () => (window.location.href = "/investments/new")
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((inv) => (
            <InvestmentListItem key={inv.id} investment={inv} />
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
