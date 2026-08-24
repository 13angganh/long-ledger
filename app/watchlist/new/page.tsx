"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { createWatchlistItem } from "@/lib/repositories/watchlistRepo";
import { WATCHLIST_TYPE_LABELS, type WatchlistType } from "@/lib/types/watchlist";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

export default function NewWatchlistItemPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<WatchlistType>("book");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      setError("Judul wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await createWatchlistItem(user.uid, {
        title: title.trim(),
        type,
        status: "planned",
        rating: null,
        note: note.trim(),
        startedAt: null,
        completedAt: null,
        lastEditedBy: editorName,
      });
      router.push("/watchlist");
    } catch {
      setError("Gagal menyimpan item. Coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
        Tambah ke watchlist
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Judul" htmlFor="title">
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="mis. Sapiens, Dune, The Bear"
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <Field label="Jenis" htmlFor="type">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.entries(WATCHLIST_TYPE_LABELS) as [WatchlistType, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`rounded-control border px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    type === value
                      ? "border-accent-emerald bg-accent-emerald-soft text-text-primary"
                      : "border-border-hairline text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </Field>

        <Field label="Catatan (opsional)" htmlFor="note">
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-control border border-border-hairline px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-control bg-accent-emerald px-4 py-2.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}
