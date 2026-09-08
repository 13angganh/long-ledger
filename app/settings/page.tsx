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
import { AppVersion } from "@/components/shared/AppVersion";
import {
  UserIcon,
  DatabaseIcon,
  PaletteIcon,
  InfoIcon,
  LogOutIcon,
} from "@/components/ui/icons";

type PendingRemoval = {
  kind: "finance" | "subscription" | "tag";
  value: string;
} | null;

/**
 * Poin 13: Settings terstruktur 4 section — Akun, Data, Tampilan, Tentang.
 * Kelola kategori/tag (fitur asli Bagian 8) sekarang jadi sub-bagian di
 * dalam "Data", bukan satu-satunya isi halaman.
 */
export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { meta, loading } = useAppMeta();
  const [pending, setPending] = useState<PendingRemoval>(null);
  const [removing, setRemoving] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

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
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
        Pengaturan
      </h1>

      {/* Akun */}
      <SettingsSection icon={<UserIcon />} title="Akun">
        <div className="flex items-center gap-3 rounded-card border border-border-hairline bg-bg-surface p-4">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-emerald-soft text-sm font-medium text-accent-emerald">
              {(user?.displayName || user?.email || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {user?.displayName || "Tanpa nama"}
            </p>
            <p className="truncate text-xs text-text-tertiary">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          className="flex items-center gap-2.5 rounded-control border border-border-hairline px-4 py-2.5 text-sm text-text-secondary hover:border-danger/40 hover:text-danger"
        >
          <LogOutIcon width={16} height={16} />
          Keluar dari akun
        </button>
      </SettingsSection>

      {/* Data */}
      <SettingsSection icon={<DatabaseIcon />} title="Data">
        <p className="text-xs text-text-tertiary">
          Kategori dan tag autocomplete — hapus di sini hanya membersihkan
          daftar saran, tidak mengubah data yang sudah memakainya.
        </p>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-control border border-border-hairline bg-bg-surface"
              />
            ))}
          </div>
        ) : !hasAnyMeta ? (
          <p className="rounded-control border border-dashed border-border-hairline px-4 py-4 text-center text-xs text-text-tertiary">
            Belum ada kategori atau tag tersimpan.
          </p>
        ) : (
          <>
            <CategorySection
              title="Kategori Finance"
              items={meta.categories.finance}
              onRemove={(value) => setPending({ kind: "finance", value })}
            />
            <CategorySection
              title="Kategori Langganan"
              items={meta.categories.subscription}
              onRemove={(value) => setPending({ kind: "subscription", value })}
            />
            <CategorySection
              title="Tag Kontak"
              items={meta.tags}
              onRemove={(value) => setPending({ kind: "tag", value })}
            />
          </>
        )}
      </SettingsSection>

      {/* Tampilan */}
      <SettingsSection icon={<PaletteIcon />} title="Tampilan">
        <div className="rounded-control border border-dashed border-border-hairline px-4 py-4">
          <p className="text-sm text-text-secondary">Tema gelap (default)</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Long Ledger saat ini hanya tersedia dalam tema gelap. Preferensi
            tampilan lain (tema terang, ukuran teks) belum tersedia — akan
            ditambah di update berikutnya kalau dibutuhkan.
          </p>
        </div>
      </SettingsSection>

      {/* Tentang */}
      <SettingsSection icon={<InfoIcon />} title="Tentang">
        <div className="rounded-control border border-border-hairline bg-bg-surface px-4 py-4 text-center">
          <AppVersion />
          <p className="mt-1 text-xs text-text-tertiary">
            Dibuat untuk pencatatan berdua — finance, investasi, langganan,
            watchlist, dan kontak dalam satu tempat.
          </p>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={pending !== null}
        title="Hapus dari daftar saran?"
        description="Ini hanya menghapus dari daftar autocomplete. Data yang sudah memakai nilai ini tidak berubah."
        confirmLabel={removing ? "Menghapus…" : "Hapus"}
        onConfirm={handleConfirmRemove}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        open={confirmSignOut}
        title="Keluar dari akun?"
        description="Kamu perlu masuk lagi dengan akun Google untuk mengakses Long Ledger."
        confirmLabel="Keluar"
        destructive={false}
        onConfirm={() => {
          setConfirmSignOut(false);
          signOut();
        }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-text-secondary">
        <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function CategorySection({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: string[];
  onRemove: (value: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-control border border-border-hairline bg-bg-surface p-4">
      <p className="text-xs font-medium text-text-primary">{title}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
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
