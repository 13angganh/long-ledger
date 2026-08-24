import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty state sebagai "invitation to act" (Bagian 3.6), bukan sekadar
 * pesan kosong. Selalu sertakan CTA jelas kalau ada aksi yang relevan.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border-hairline px-6 py-14 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-surface text-text-tertiary">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-text-primary">{title}</p>
        <p className="max-w-xs text-sm text-text-secondary">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-control bg-accent-emerald px-4 py-2 text-sm font-medium text-bg-base transition-opacity hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
