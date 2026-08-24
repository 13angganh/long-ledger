"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { updateWatchlistItem, deleteWatchlistItem } from "@/lib/repositories/watchlistRepo";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { RatingStars } from "@/components/shared/RatingStars";
import { WATCHLIST_TYPE_LABELS, type WatchlistType, type WatchlistStatus } from "@/lib/types/watchlist";
import { formatDateID } from "@/lib/format";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

export default function WatchlistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { items, loading } = useWatchlist();
  const router = useRouter();

  const item = items.find((i) => i.id === id);

  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<WatchlistType>("book");
  const [status, setStatus] = useState<WatchlistStatus>("planned");
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (item && item.id !== hydratedId) {
    setHydratedId(item.id);
    setTitle(item.title);
    setType(item.type);
    setStatus(item.status);
    setRating(item.rating);
    setNote(item.note);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !item) return;

    setSubmitting(true);
    setError(null);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);

      // Transisi status otomatis mengisi startedAt/completedAt (Bagian 6.1c
      // implisit — progress tracking butuh timestamp transisi, bukan cuma
      // status akhir).
      let startedAt = item.startedAt;
      let completedAt = item.completedAt;
      if (status === "in_progress" && item.status !== "in_progress") {
        startedAt = Timestamp.now();
      }
      if (status === "completed" && item.status !== "completed") {
        completedAt = Timestamp.now();
        if (!startedAt) startedAt = Timestamp.now();
      }

      await updateWatchlistItem(user.uid, item.id, {
        title: title.trim(),
        type,
        status,
        rating,
        note: note.trim(),
        startedAt,
        completedAt,
        lastEditedBy: editorName,
      });
      router.push("/watchlist");
    } catch {
      setError("Gagal menyimpan perubahan. Coba lagi.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user || !item) return;
    await deleteWatchlistItem(user.uid, item.id);
    router.push("/watchlist");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="h-64 animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-text-secondary">Item tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          {item.title}
        </h1>
        <LastEditedBy name={item.lastEditedBy} size="md" />
      </div>

      {(item.startedAt || item.completedAt) && (
        <div className="flex gap-4 text-xs text-text-tertiary">
          {item.startedAt && <span>Dimulai {formatDateID(item.startedAt.toDate())}</span>}
          {item.completedAt && <span>Selesai {formatDateID(item.completedAt.toDate())}</span>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Judul" htmlFor="title">
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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

        <Field label="Status" htmlFor="status">
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as WatchlistStatus)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          >
            <option value="planned">Direncanakan</option>
            <option value="in_progress">Sedang dijalani</option>
            <option value="completed">Selesai</option>
          </select>
        </Field>

        {status === "completed" && (
          <Field label="Rating" htmlFor="rating">
            <RatingStars value={rating} onChange={setRating} size={22} />
          </Field>
        )}

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
            onClick={() => setConfirmOpen(true)}
            className="rounded-control border border-danger/40 px-4 py-2.5 text-sm text-danger hover:bg-danger-soft"
          >
            Hapus
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-control bg-accent-emerald px-4 py-2.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus item ini?"
        description="Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
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
