"use client";

import { useMemo, useState } from "react";
import { useActivityLog } from "@/lib/hooks/useActivityLog";
import {
  ACTIVITY_MODULE_LABELS,
  ACTIVITY_ACTION_LABELS,
  type ActivityModule,
} from "@/lib/types/activityLog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ActivityIcon } from "@/components/ui/icons";
import { formatDateID } from "@/lib/format";

const ACTION_TONE: Record<string, string> = {
  create: "text-accent-emerald",
  update: "text-text-secondary",
  delete: "text-danger",
  restore: "text-accent-amber",
};

export default function ActivityLogPage() {
  const { entries, loading, error } = useActivityLog();
  const [moduleFilter, setModuleFilter] = useState<ActivityModule | null>(null);

  const filtered = useMemo(() => {
    if (!moduleFilter) return entries;
    return entries.filter((e) => e.module === moduleFilter);
  }, [entries, moduleFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Log Aktivitas
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          100 aktivitas terakhir dari semua modul — siapa membuat, mengubah,
          menghapus, atau memulihkan data.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label="Semua"
          active={moduleFilter === null}
          onClick={() => setModuleFilter(null)}
        />
        {(Object.entries(ACTIVITY_MODULE_LABELS) as [ActivityModule, string][]).map(
          ([value, label]) => (
            <FilterChip
              key={value}
              label={label}
              active={moduleFilter === value}
              onClick={() => setModuleFilter(value)}
            />
          )
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-control border border-border-hairline bg-bg-surface"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">Gagal memuat log: {error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon width={22} height={22} />}
          title="Belum ada aktivitas"
          description="Setiap kali data dibuat, diubah, dihapus, atau dipulihkan, catatannya akan muncul di sini."
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-control border border-border-hairline bg-bg-surface px-4 py-3"
            >
              <p className="min-w-0 flex-1 text-sm text-text-primary">
                <span className="font-medium">{entry.actorName}</span>{" "}
                <span className={ACTION_TONE[entry.action]}>
                  {ACTIVITY_ACTION_LABELS[entry.action]}
                </span>{" "}
                <span className="text-text-secondary">
                  {ACTIVITY_MODULE_LABELS[entry.module].toLowerCase()}
                </span>{" "}
                <span className="truncate font-medium">&ldquo;{entry.targetLabel}&rdquo;</span>
              </p>
              <span className="shrink-0 text-xs text-text-tertiary">
                {formatDateID(entry.createdAt.toDate())}
              </span>
            </div>
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
