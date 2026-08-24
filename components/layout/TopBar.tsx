"use client";

import { usePathname } from "next/navigation";
import { MenuIcon } from "@/components/ui/icons";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/finance": "Finance",
  "/investments": "Investasi",
  "/subscriptions": "Langganan",
  "/watchlist": "Watchlist",
  "/contacts": "Kontak",
  "/settings": "Pengaturan",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const base = "/" + pathname.split("/")[1];
  return PAGE_TITLES[base] ?? "Long Ledger";
}

interface TopBarProps {
  onOpenMobile: () => void;
}

export function TopBar({ onOpenMobile }: TopBarProps) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-hairline bg-bg-base/95 px-4 py-4 backdrop-blur md:hidden">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Buka menu"
        className="rounded-control p-1.5 text-text-primary hover:bg-bg-surface-hover"
      >
        <MenuIcon width={22} height={22} />
      </button>
      <h1 className="text-lg font-medium">{title}</h1>
    </header>
  );
}
