"use client";

import { useEffect } from "react";
import Link from "next/link";
import { XIcon, EditIcon } from "@/components/ui/icons";

interface QuickViewModalProps {
  open: boolean;
  title: string;
  editHref: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Modal read-only generik (Poin 6): tampilkan ringkasan data tanpa harus
 * pindah ke halaman detail/edit dulu. Isi konten spesifik per modul lewat
 * `children` (setiap modul punya field berbeda) — shell (overlay, header,
 * tombol close/edit) sama untuk semua 5 modul, satu-satunya tempat definisi
 * perilaku modal ini.
 */
export function QuickViewModal({ open, title, editHref, onClose, children }: QuickViewModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-card border border-border-hairline bg-bg-surface sm:max-w-md sm:rounded-card"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border-hairline bg-bg-surface px-5 py-4">
          <h2
            id="quick-view-title"
            className="truncate text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="shrink-0 rounded-control p-1.5 text-text-secondary hover:bg-bg-surface-hover"
          >
            <XIcon width={20} height={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5">{children}</div>

        <div className="sticky bottom-0 border-t border-border-hairline bg-bg-surface px-5 py-4">
          <Link
            href={editHref}
            className="flex items-center justify-center gap-2 rounded-control bg-accent-emerald px-4 py-2.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
          >
            <EditIcon width={16} height={16} />
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Baris label-value konsisten untuk isi QuickViewModal. */
export function QuickViewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}
