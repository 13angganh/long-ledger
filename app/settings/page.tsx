"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppMeta } from "@/lib/hooks/useAppMeta";
import {
  removeFinanceCategory,
  removeSubscriptionCategory,
  removeContactTag,
} from "@/lib/repositories/metaRepo";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SettingsIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/shared/EmptyState";

type PendingRemoval = {
  kind: "finance" | "subscription" | "tag";
  value: string;
} | null;

/**
 * Kelola kategori/tag autocomplete (Bagian 8 langkah 10). Hapus di sini
 * hanya menghapus dari daftar SARAN — tidak mengubah data transaksi/
 * subscription/kontak yang sudah memakai value tersebut (Bagian 6.1:
 * category/tags bersifat free-text, bukan enum kaku yang mengikat).
 */
export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { meta, loading } = useAppMeta();
  const [pending, setPending] = useState<PendingRemoval>(null);
  const [removing, setRemoving] = useState(false);

  async function handleConfirmRemove() {
    if (!user || !pending) return;
    setRemoving(true);
    try {
      if (pending.kind === "finance") {
        await removeFinanceCategory(user.uid, pending.value);
      } else if (pending.kind === "subscription") {
        await removeSubscriptionCategory(user.uid, pending.value);
      } else {
        await removeContactTag(user.uid, pending.value);
      }
    } finally {
      setRemoving(false);
      setPending(null);
    }
  }

  const hasAnyMeta =
    meta.categories.finance.length > 0 ||
    meta.categories.subscription.length > 0 ||
    meta.tags.length > 0;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
        Pengaturan
      </h1>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-card border border-border-hairline bg-bg-surface"
            />
          ))}
        </div>
      ) : !hasAnyMeta ? (
        <EmptyState
          icon={<SettingsIcon width={22} height={22} />}
          title="Belum ada kategori atau tag tersimpan"
          description="Daftar kategori dan tag akan muncul di sini begitu kamu mulai memakainya di Finance, Langganan, atau Kontak."
        />
      ) : (
        <>
          <CategorySection
            title="Kategori Finance"
            description="Dipakai untuk autocomplete saat mencatat transaksi."
            items={meta.categories.finance}
            onRemove={(value) => setPending({ kind: "finance", value })}
          />
          <CategorySection
            title="Kategori Langganan"
            description="Dipakai untuk autocomplete saat mencatat langganan."
            items={meta.categories.subscription}
            onRemove={(value) => setPending({ kind: "subscription", value })}
          />
          <CategorySection
            title="Tag Kontak"
            description="Dipakai untuk autocomplete saat menambah tag kontak."
            items={meta.tags}
            onRemove={(value) => setPending({ kind: "tag", value })}
          />
        </>
      )}

      <div className="border-t border-border-hairline pt-6">
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-control border border-border-hairline px-4 py-2.5 text-sm text-text-secondary hover:border-danger/40 hover:text-danger"
        >
          Keluar dari akun
        </button>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title="Hapus dari daftar saran?"
        description="Ini hanya menghapus dari daftar autocomplete. Data yang sudah memakai nilai ini tidak berubah."
        confirmLabel={removing ? "Menghapus…" : "Hapus"}
        onConfirm={handleConfirmRemove}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function CategorySection({
  title,
  description,
  items,
  onRemove,
}: {
  title: string;
  description: string;
  items: string[];
  onRemove: (value: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-card border border-border-hairline bg-bg-surface p-5">
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1.5 rounded-full bg-bg-surface-hover px-3 py-1.5 text-xs text-text-secondary"
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(item)}
              aria-label={`Hapus ${item}`}
              className="text-text-tertiary hover:text-danger"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
