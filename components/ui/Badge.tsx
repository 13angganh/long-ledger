import type { ReactNode } from "react";

type BadgeTone = "neutral" | "emerald" | "amber" | "danger";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-bg-surface-hover text-text-secondary",
  emerald: "bg-accent-emerald-soft text-accent-emerald",
  amber: "bg-accent-amber-soft text-accent-amber",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
