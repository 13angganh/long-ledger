"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSubscriptions } from "@/lib/hooks/useSubscriptions";
import {
  getMonthlySpend,
  getMonthlySpendByOwner,
  filterBySubscriptionStatus,
  filterBySubscriptionCategory,
  filterBySubscriptionOwner,
} from "@/lib/selectors/subscriptionSelectors";
import { SubscriptionListItem } from "@/components/shared/SubscriptionListItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { RepeatIcon } from "@/components/ui/icons";
import { formatIDR } from "@/lib/format";
import type { Subscription } from "@/lib/types/subscription";
import { OWNER_LABELS, type Owner } from "@/lib/types/transaction";

export default function SubscriptionsPage() {
  const { subscriptions, loading, error } = useSubscriptions();
  const [statusFilter, setStatusFilter] = useState<Subscription["status"] | null>(
    "active"
  );
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<Owner | null>(null);

  const monthlySpend = useMemo(() => getMonthlySpend(subscriptions), [subscriptions]);
  const spendByOwner = useMemo(() => getMonthlySpendByOwner(subscriptions), [subscriptions]);

  const categories = useMemo(() => {
    const set = new Set(subscriptions.map((s) => s.category).filter(Boolean));
    return Array.from(set);
  }, [subscriptions]);

  const filtered = useMemo(() => {
    let result = filterBySubscriptionStatus(subscriptions, statusFilter);
    result = filterBySubscriptionCategory(result, categoryFilter);
    result = filterBySubscriptionOwner(result, ownerFilter);
    return [...result].sort(
      (a, b) => a.nextRenewalDate.toMillis() - b.nextRenewalDate.toMillis()
    );
  }, [subscriptions, statusFilter, categoryFilter, ownerFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Langganan
        </h1>
        <Link
          href="/subscriptions/new"
          className="rounded-control bg-accent-emerald px-4 py-2 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
        >
          + Langganan
        </Link>
      </div>

      <div className="rounded-card border border-border-hairline bg-bg-surface p-6">
        <p className="text-xs text-text-tertiary">Total spend bulanan</p>
        <p className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          {formatIDR(monthlySpend)}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          Dinormalisasi dari siklus bulanan/tahunan/mingguan
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-hairline pt-4">
          {spendByOwner.map((o) => (
            <div key={o.owner}>
              <p className="text-xs text-text-tertiary">{o.label}</p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {formatIDR(o.monthlySpend)}
              </p>
            </div>
          ))}
        </div>
      </div>

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

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[66px] animate-pulse rounded-control border border-border-hairline bg-bg-surface"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">Gagal memuat langganan: {error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<RepeatIcon width={22} height={22} />}
          title={subscriptions.length === 0 ? "Belum ada langganan" : "Tidak ada yang cocok"}
          description={
            subscriptions.length === 0
              ? "Catat langganan pertama supaya reminder renewal tidak pernah terlewat."
              : "Coba ubah filter untuk melihat langganan lain."
          }
          actionLabel={subscriptions.length === 0 ? "Tambah langganan" : undefined}
          onAction={
            subscriptions.length === 0
              ? () => (window.location.href = "/subscriptions/new")
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((sub) => (
            <SubscriptionListItem key={sub.id} subscription={sub} />
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
