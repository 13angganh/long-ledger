"use client";

import { useState, useMemo, type KeyboardEvent } from "react";

interface TagInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
}

/**
 * Input free-text dengan autocomplete dari `suggestions` (Bagian 6.1:
 * kategori BUKAN enum kaku — user selalu bisa ketik value baru).
 * Dipakai untuk single-value field seperti `category`.
 */
export function TagInput({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder,
}: TagInputProps) {
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    if (!value.trim()) return suggestions.slice(0, 6);
    return suggestions
      .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 6);
  }, [value, suggestions]);

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        placeholder={placeholder}
        className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
      />
      {focused && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-control border border-border-hairline bg-bg-surface shadow-lg">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange(s)}
              className="block w-full px-3.5 py-2 text-left text-sm text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MultiTagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

/** Varian multi-value untuk field seperti `tags` di Contact. */
export function MultiTagInput({
  values,
  onChange,
  suggestions = [],
  placeholder,
}: MultiTagInputProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && !draft && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  const filtered = suggestions.filter(
    (s) =>
      !values.includes(s) &&
      (draft ? s.toLowerCase().includes(draft.toLowerCase()) : true)
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-control border border-border-hairline bg-bg-base px-2.5 py-2 focus-within:border-accent-emerald">
        {values.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-accent-emerald-soft px-2.5 py-1 text-xs text-text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== tag))}
              aria-label={`Hapus tag ${tag}`}
              className="text-text-secondary hover:text-text-primary"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={values.length === 0 ? placeholder : undefined}
          className="min-w-[80px] flex-1 bg-transparent py-1 text-sm text-text-primary outline-none"
        />
      </div>
      {draft && filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filtered.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange([...values, s]);
                setDraft("");
              }}
              className="rounded-full border border-border-hairline px-2.5 py-1 text-xs text-text-secondary hover:border-accent-emerald hover:text-text-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
