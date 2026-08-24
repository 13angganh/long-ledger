"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useContacts } from "@/lib/hooks/useContacts";
import { searchContacts, filterByTags } from "@/lib/selectors/contactSelectors";
import { ContactListItem } from "@/components/shared/ContactListItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContactsIcon } from "@/components/ui/icons";

export default function ContactsPage() {
  const { contacts, loading, error } = useContacts();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const set = new Set(contacts.flatMap((c) => c.tags));
    return Array.from(set);
  }, [contacts]);

  const filtered = useMemo(() => {
    let result = searchContacts(contacts, searchQuery);
    result = filterByTags(result, activeTags);
    return result;
  }, [contacts, searchQuery, activeTags]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Kontak
        </h1>
        <Link
          href="/contacts/new"
          className="rounded-control bg-accent-emerald px-4 py-2 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
        >
          + Kontak
        </Link>
      </div>

      {/* Search — PALING prominent di halaman ini (Bagian 5), bukan search
          kecil di pojok. Besar, langsung terlihat, jadi titik masuk utama. */}
      <div className="relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-tertiary"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, hubungan, tag, catatan, atau nomor…"
          className="w-full rounded-card border border-border-hairline bg-bg-surface py-4 pr-4 pl-12 text-base text-text-primary outline-none focus:border-accent-emerald"
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${
                activeTags.includes(tag)
                  ? "border-accent-emerald bg-accent-emerald-soft text-text-primary"
                  : "border-border-hairline text-text-secondary hover:text-text-primary"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[64px] animate-pulse rounded-control border border-border-hairline bg-bg-surface"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">Gagal memuat kontak: {error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ContactsIcon width={22} height={22} />}
          title={contacts.length === 0 ? "Belum ada kontak" : "Tidak ditemukan"}
          description={
            contacts.length === 0
              ? "Simpan kontak penting supaya nomor dan catatan relasi tidak hilang."
              : "Coba kata kunci lain atau hapus filter tag."
          }
          actionLabel={contacts.length === 0 ? "Tambah kontak" : undefined}
          onAction={
            contacts.length === 0
              ? () => (window.location.href = "/contacts/new")
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((contact) => (
            <ContactListItem key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
