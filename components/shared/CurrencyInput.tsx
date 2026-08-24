"use client";

import { useState, type ChangeEvent } from "react";

interface CurrencyInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
}

function formatIDR(value: number): string {
  if (Number.isNaN(value) || value === 0) return "";
  return new Intl.NumberFormat("id-ID").format(value);
}

function parseIDR(raw: string): number {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

/**
 * Input angka dengan format ribuan ala Rupiah saat mengetik (Bagian 3.7:
 * UI ramah, tidak menyodorkan angka mentah tanpa format).
 */
export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder,
  required,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(formatIDR(value));

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const parsed = parseIDR(e.target.value);
    setDisplayValue(formatIDR(parsed));
    onChange(parsed);
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-tertiary">
        Rp
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        required={required}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder ?? "0"}
        className="w-full rounded-control border border-border-hairline bg-bg-base py-2.5 pr-3.5 pl-9 text-text-primary outline-none focus:border-accent-emerald"
      />
    </div>
  );
}
