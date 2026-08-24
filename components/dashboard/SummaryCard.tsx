import type { ReactNode } from "react";
import Link from "next/link";

interface SummaryCardProps {
  href: string;
  title: string;
  icon: ReactNode;
  urgent?: boolean;
  children: ReactNode;
}

/**
 * Card generik dasar untuk dashboard (Bagian 5: SummaryCard.tsx, dipakai
 * oleh 5 card turunan). Seluruh card adalah target klik ke modul terkait
 * (Bagian 3.6) — bukan CTA teks kecil terpisah.
 */
export function SummaryCard({ href, title, icon, urgent, children }: SummaryCardProps) {
  return (
    <Link
      href={href}
      className={`card-interactive flex flex-col gap-4 rounded-card border border-border-hairline bg-bg-surface p-6 ${
        urgent ? "halo-amber" : ""
      }`}
    >
      <div className="flex items-center gap-2.5 text-text-secondary">
        <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      {children}
    </Link>
  );
}
