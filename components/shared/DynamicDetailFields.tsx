"use client";

import { Timestamp } from "firebase/firestore";
import type { DetailFieldConfig } from "@/lib/investmentFieldConfig";

export type DetailFormValues = Record<string, string | number | boolean>;

interface DynamicDetailFieldsProps {
  fields: DetailFieldConfig[];
  values: DetailFormValues;
  onChange: (key: string, value: string | number | boolean) => void;
}

/**
 * Render field detail conditional sesuai jenis instrumen terpilih
 * (Bagian 6.1a: form WAJIB step-based, bukan render 9 set field sekaligus).
 */
export function DynamicDetailFields({ fields, values, onChange }: DynamicDetailFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label htmlFor={field.key} className="text-sm text-text-secondary">
            {field.label}
          </label>
          {renderField(field, values[field.key], (v) => onChange(field.key, v))}
        </div>
      ))}
    </div>
  );
}

function renderField(
  field: DetailFieldConfig,
  value: string | number | boolean | undefined,
  onChange: (value: string | number | boolean) => void
) {
  const baseClass =
    "w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald";

  switch (field.kind) {
    case "text":
      return (
        <input
          id={field.key}
          type="text"
          value={(value as string) ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
    case "number":
      return (
        <input
          id={field.key}
          type="number"
          inputMode="decimal"
          value={value === undefined ? "" : (value as number)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className={baseClass}
        />
      );
    case "date":
      return (
        <input
          id={field.key}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
    case "select":
      return (
        <select
          id={field.key}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        >
          <option value="" disabled>
            Pilih {field.label.toLowerCase()}
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2.5 text-sm text-text-primary">
          <input
            id={field.key}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded accent-[#4a7861]"
          />
          {value ? "Ya" : "Tidak"}
        </label>
      );
  }
}

/**
 * Konversi form values (string/number/boolean mentah) jadi nested detail
 * object siap simpan ke Firestore — date fields dikonversi ke Timestamp.
 */
export function buildDetailObject(
  fields: DetailFieldConfig[],
  values: DetailFormValues
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = values[field.key];
    if (field.kind === "date" && typeof raw === "string" && raw) {
      result[field.key] = Timestamp.fromDate(new Date(raw));
    } else {
      result[field.key] = raw ?? (field.kind === "boolean" ? false : "");
    }
  }
  return result;
}

/** Konversi nested detail object (dari Firestore) jadi form values untuk edit. */
export function detailObjectToFormValues(
  fields: DetailFieldConfig[],
  detail: Record<string, unknown> | undefined
): DetailFormValues {
  const result: DetailFormValues = {};
  if (!detail) return result;
  for (const field of fields) {
    const raw = detail[field.key];
    if (field.kind === "date" && raw && typeof raw === "object" && "toDate" in raw) {
      result[field.key] = (raw as Timestamp).toDate().toISOString().slice(0, 10);
    } else if (typeof raw === "boolean" || typeof raw === "number" || typeof raw === "string") {
      result[field.key] = raw;
    }
  }
  return result;
}
