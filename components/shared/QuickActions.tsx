"use client";

import Link from "next/link";
import { EyeIcon, EditIcon, TrashIcon } from "@/components/ui/icons";

interface QuickActionsProps {
  onView: () => void;
  editHref: string;
  onDelete: () => void;
}

/**
 * 3 tombol aksi cepat (Poin 6): Lihat, Edit, Hapus — tidak perlu klik
 * masuk ke halaman detail dulu untuk lakukan salah satu dari ketiganya.
 * `stopPropagation` di semua tombol karena parent card-nya sendiri juga
 * `<Link>` (klik area card = ke halaman detail); tombol-tombol ini harus
 * override itu.
 */
export function QuickActions({ onView, editHref, onDelete }: QuickActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onView();
        }}
        aria-label="Lihat"
        className="rounded-control p-1.5 text-text-tertiary hover:bg-bg-surface-hover hover:text-text-primary"
      >
        <EyeIcon width={16} height={16} />
      </button>
      <Link
        href={editHref}
        onClick={(e) => e.stopPropagation()}
        aria-label="Edit"
        className="rounded-control p-1.5 text-text-tertiary hover:bg-bg-surface-hover hover:text-text-primary"
      >
        <EditIcon width={16} height={16} />
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Hapus"
        className="rounded-control p-1.5 text-text-tertiary hover:bg-danger-soft hover:text-danger"
      >
        <TrashIcon width={16} height={16} />
      </button>
    </div>
  );
}
