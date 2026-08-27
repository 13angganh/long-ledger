"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { softDeleteContact } from "@/lib/repositories/contactRepo";
import type { Contact } from "@/lib/types/contact";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { QuickActions } from "@/components/shared/QuickActions";
import { QuickViewModal, QuickViewRow } from "@/components/shared/QuickViewModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { formatDateShortID, formatDateID } from "@/lib/format";

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

export function ContactListItem({ contact }: { contact: Contact }) {
  const { user } = useAuth();
  const reminderDays = contact.reminderDate ? daysUntil(contact.reminderDate.toDate()) : null;
  const isOverdue = reminderDays !== null && reminderDays < 0;
  const isUpcoming = reminderDays !== null && reminderDays >= 0 && reminderDays <= 7;
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await softDeleteContact(user.uid, contact.id, editorName, contact.name);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Link
        href={`/contacts/${contact.id}`}
        className={`card-interactive flex flex-col gap-2 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5 ${
          isOverdue || isUpcoming ? "halo-amber" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium text-text-primary">{contact.name}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {contact.relationship && (
                <span className="text-xs text-text-tertiary">{contact.relationship}</span>
              )}
              {contact.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {contact.reminderDate && (
            <span className={`shrink-0 text-xs ${isOverdue ? "text-danger" : "text-accent-amber"}`}>
              {isOverdue ? "Lewat · " : "Ingat · "}
              {formatDateShortID(contact.reminderDate.toDate())}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border-hairline pt-2">
          <LastEditedBy name={contact.lastEditedBy} />
          <QuickActions
            onView={() => setViewOpen(true)}
            editHref={`/contacts/${contact.id}`}
            onDelete={() => setConfirmOpen(true)}
          />
        </div>
      </Link>

      <QuickViewModal
        open={viewOpen}
        title={contact.name}
        editHref={`/contacts/${contact.id}`}
        onClose={() => setViewOpen(false)}
      >
        {contact.relationship && <QuickViewRow label="Hubungan" value={contact.relationship} />}
        {contact.phones.length > 0 && (
          <QuickViewRow
            label="Nomor telepon"
            value={
              <div className="flex flex-col gap-1">
                {contact.phones.map((p, i) => (
                  <span key={i}>
                    {p.label ? `${p.label}: ` : ""}
                    {p.number}
                  </span>
                ))}
              </div>
            }
          />
        )}
        {contact.tags.length > 0 && (
          <QuickViewRow
            label="Tag"
            value={
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            }
          />
        )}
        {contact.lastContacted && (
          <QuickViewRow label="Terakhir dihubungi" value={formatDateID(contact.lastContacted.toDate())} />
        )}
        {contact.reminderDate && (
          <QuickViewRow label="Pengingat follow-up" value={formatDateID(contact.reminderDate.toDate())} />
        )}
        {contact.note && <QuickViewRow label="Catatan" value={contact.note} />}
        <QuickViewRow label="Terakhir diubah" value={<LastEditedBy name={contact.lastEditedBy} />} />
      </QuickViewModal>

      <ConfirmDialog
        open={confirmOpen}
        title="Pindahkan ke Recycle Bin?"
        description="Kontak akan dipindah ke Recycle Bin dan bisa dipulihkan kapan saja dalam 30 hari sebelum terhapus permanen."
        confirmLabel={deleting ? "Memindahkan…" : "Pindahkan"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
