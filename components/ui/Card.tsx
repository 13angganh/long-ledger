import type { ReactNode } from "react";
import Link from "next/link";

interface CardProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  urgent?: boolean;
  className?: string;
}

/**
 * Card primitif — dipakai sebagai basis semua card di app (dashboard,
 * list item finance/investasi/dll). Seluruh card adalah target klik
 * kalau `href`/`onClick` diberikan (Bagian 3.6), bukan cuma link teks kecil.
 */
export function Card({ children, href, onClick, urgent, className = "" }: CardProps) {
  const classes = `card-interactive rounded-card border border-border-hairline bg-bg-surface p-6 ${
    urgent ? "halo-amber" : ""
  } ${href || onClick ? "cursor-pointer" : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={`block ${classes}`}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`block w-full text-left ${classes}`}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}
