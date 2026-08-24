"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppMeta } from "@/lib/hooks/useAppMeta";
import { createContact } from "@/lib/repositories/contactRepo";
import { addContactTags } from "@/lib/repositories/metaRepo";
import { PhoneListInput } from "@/components/shared/PhoneListInput";
import { MultiTagInput } from "@/components/shared/TagInput";
import type { ContactPhone } from "@/lib/types/contact";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

export default function NewContactPage() {
  const { user } = useAuth();
  const { meta } = useAppMeta();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phones, setPhones] = useState<ContactPhone[]>([{ label: "", number: "" }]);
  const [relationship, setRelationship] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      const cleanPhones = phones.filter((p) => p.number.trim());

      await createContact(user.uid, {
        name: name.trim(),
        phones: cleanPhones,
        relationship: relationship.trim(),
        tags,
        note: note.trim(),
        lastContacted: null,
        reminderDate: reminderDate ? Timestamp.fromDate(new Date(reminderDate)) : null,
        lastEditedBy: editorName,
      });
      if (tags.length > 0) {
        await addContactTags(user.uid, tags);
      }
      router.push("/contacts");
    } catch {
      setError("Gagal menyimpan kontak. Coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
        Tambah kontak
      </h1>

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
            placeholder='mis. "kakak", "klien", "teman kuliah"'
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <Field label="Tag" htmlFor="tags">
          <MultiTagInput
            values={tags}
            onChange={setTags}
            suggestions={meta.tags}
            placeholder="mis. keluarga, kerja, komunitas"
          />
        </Field>

        <Field label="Pengingat follow-up (opsional)" htmlFor="reminderDate">
          <input
            id="reminderDate"
            type="date"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
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
            {submitting ? "Menyimpan…" : "Simpan kontak"}
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
