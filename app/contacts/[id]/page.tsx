"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppMeta } from "@/lib/hooks/useAppMeta";
import { useContacts } from "@/lib/hooks/useContacts";
import {
  updateContact,
  softDeleteContact,
  markContactedNow,
} from "@/lib/repositories/contactRepo";
import { addContactTags } from "@/lib/repositories/metaRepo";
import { PhoneListInput } from "@/components/shared/PhoneListInput";
import { MultiTagInput } from "@/components/shared/TagInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { formatDateID } from "@/lib/format";
import type { ContactPhone } from "@/lib/types/contact";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { meta } = useAppMeta();
  const { contacts, loading } = useContacts();
  const router = useRouter();

  const contact = contacts.find((c) => c.id === id);

  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phones, setPhones] = useState<ContactPhone[]>([]);
  const [relationship, setRelationship] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [markingContacted, setMarkingContacted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (contact && contact.id !== hydratedId) {
    setHydratedId(contact.id);
    setName(contact.name);
    setPhones(contact.phones.length > 0 ? contact.phones : [{ label: "", number: "" }]);
    setRelationship(contact.relationship);
    setTags(contact.tags);
    setNote(contact.note);
    setReminderDate(contact.reminderDate ? toDateInputValue(contact.reminderDate.toDate()) : "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !contact) return;
    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      const cleanPhones = phones.filter((p) => p.number.trim());

      await updateContact(user.uid, contact.id, {
        name: name.trim(),
        phones: cleanPhones,
        relationship: relationship.trim(),
        tags,
        note: note.trim(),
        reminderDate: reminderDate ? Timestamp.fromDate(new Date(reminderDate)) : null,
        lastEditedBy: editorName,
      });
      if (tags.length > 0) {
        await addContactTags(user.uid, tags);
      }
      router.push("/contacts");
    } catch {
      setError("Gagal menyimpan perubahan. Coba lagi.");
      setSubmitting(false);
    }
  }

  async function handleMarkContacted() {
    if (!user || !contact) return;
    setMarkingContacted(true);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await markContactedNow(user.uid, contact.id, editorName);
    } finally {
      setMarkingContacted(false);
    }
  }

  async function handleDelete() {
    if (!user || !contact) return;
    const editorName = resolveEditorName(user.displayName, user.email);
    await softDeleteContact(user.uid, contact.id, editorName, contact.name);
    router.push("/contacts");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="h-64 animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-text-secondary">Kontak tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          {contact.name}
        </h1>
        <LastEditedBy name={contact.lastEditedBy} size="md" />
      </div>

      {/* Aksi cepat: tandai baru saja dihubungi (Bagian 6.1 — manual, bukan
          auto-detect). Ditaruh menonjol di atas form supaya cepat diakses. */}
      <div className="flex items-center justify-between rounded-card border border-border-hairline bg-bg-surface p-4">
        <div>
          <p className="text-xs text-text-tertiary">Terakhir dihubungi</p>
          <p className="mt-0.5 text-sm text-text-primary">
            {contact.lastContacted ? formatDateID(contact.lastContacted.toDate()) : "Belum pernah dicatat"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkContacted}
          disabled={markingContacted}
          className="rounded-control bg-accent-emerald-soft px-3.5 py-2 text-sm font-medium text-accent-emerald transition-opacity hover:opacity-80 disabled:opacity-60"
        >
          {markingContacted ? "Menyimpan…" : "Tandai baru saja dihubungi"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nama" htmlFor="name">
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <Field label="Nomor telepon" htmlFor="phones">
          <PhoneListInput phones={phones} onChange={setPhones} />
        </Field>

        <Field label="Hubungan" htmlFor="relationship">
          <input
            id="relationship"
            type="text"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <Field label="Tag" htmlFor="tags">
          <MultiTagInput values={tags} onChange={setTags} suggestions={meta.tags} />
        </Field>

        <Field label="Pengingat follow-up" htmlFor="reminderDate">
          <input
            id="reminderDate"
            type="date"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <Field label="Catatan" htmlFor="note">
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
            Pindahkan ke Recycle Bin
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
        title="Pindahkan ke Recycle Bin?"
        description="Kontak akan dipindah ke Recycle Bin dan bisa dipulihkan kapan saja dalam 30 hari sebelum terhapus permanen."
        confirmLabel="Pindahkan"
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
