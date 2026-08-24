"use client";

import type { ContactPhone } from "@/lib/types/contact";

interface PhoneListInputProps {
  phones: ContactPhone[];
  onChange: (phones: ContactPhone[]) => void;
}

/** Input array {label, number} — kontak bisa punya beberapa nomor (Bagian 6.1). */
export function PhoneListInput({ phones, onChange }: PhoneListInputProps) {
  function updatePhone(index: number, field: keyof ContactPhone, value: string) {
    const next = [...phones];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function removePhone(index: number) {
    onChange(phones.filter((_, i) => i !== index));
  }

  function addPhone() {
    onChange([...phones, { label: "", number: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {phones.map((phone, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={phone.label}
            onChange={(e) => updatePhone(i, "label", e.target.value)}
            placeholder="Label (mis. WA, Rumah)"
            className="w-28 shrink-0 rounded-control border border-border-hairline bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-emerald"
          />
          <input
            type="tel"
            value={phone.number}
            onChange={(e) => updatePhone(i, "number", e.target.value)}
            placeholder="Nomor telepon"
            className="flex-1 rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-accent-emerald"
          />
          <button
            type="button"
            onClick={() => removePhone(i)}
            aria-label="Hapus nomor"
            className="shrink-0 rounded-control px-2.5 text-text-tertiary hover:bg-bg-surface-hover hover:text-danger"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addPhone}
        className="self-start rounded-control border border-dashed border-border-hairline px-3.5 py-2 text-sm text-text-secondary hover:border-accent-emerald hover:text-text-primary"
      >
        + Tambah nomor
      </button>
    </div>
  );
}
