"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { SidebarNavItem } from "./SidebarNavItem";
import {
  HomeIcon,
  LedgerLinesIcon,
  TrendingUpIcon,
  RepeatIcon,
  BookmarkIcon,
  ContactsIcon,
  SettingsIcon,
  MenuIcon,
  ChevronLeftIcon,
  XIcon,
  LogOutIcon,
} from "@/components/ui/icons";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: <HomeIcon /> },
  { href: "/finance", label: "Finance", icon: <LedgerLinesIcon /> },
  { href: "/investments", label: "Investasi", icon: <TrendingUpIcon /> },
  { href: "/subscriptions", label: "Langganan", icon: <RepeatIcon /> },
  { href: "/watchlist", label: "Watchlist", icon: <BookmarkIcon /> },
  { href: "/contacts", label: "Kontak", icon: <ContactsIcon /> },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * Sidebar dengan dua mode:
 * - Desktop (md+): auto-collapse ke icon-only via tombol chevron, state
 *   disimpan lokal di komponen (tidak perlu persist ke Firestore).
 * - Mobile (<md): tersembunyi secara default, dibuka lewat hamburger di
 *   TopBar, tampil sebagai overlay penuh dengan tombol close.
 */
export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          aria-hidden
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border-hairline bg-bg-surface transition-transform duration-200 ease-out md:sticky md:top-0 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-[76px]" : "md:w-64"} w-72`}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <div
            className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? "md:w-0 md:opacity-0" : ""}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-base">
              <div className="flex flex-col gap-[3px]">
                <span className="h-[2px] w-3.5 rounded-full bg-text-tertiary/70" />
                <span className="h-[2px] w-4 rounded-full bg-accent-emerald" />
                <span className="h-[2px] w-3 rounded-full bg-text-secondary/80" />
              </div>
            </div>
            <span
              className="whitespace-nowrap text-base"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Long Ledger
            </span>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="rounded-control p-1.5 text-text-secondary hover:bg-bg-surface-hover md:hidden"
          >
            <XIcon width={20} height={20} />
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
            className="hidden rounded-control p-1.5 text-text-secondary hover:bg-bg-surface-hover md:block"
          >
            {collapsed ? (
              <MenuIcon width={18} height={18} />
            ) : (
              <ChevronLeftIcon width={18} height={18} />
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
              onNavigate={onCloseMobile}
            />
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-border-hairline px-3 py-3">
          <SidebarNavItem
            href="/settings"
            label="Pengaturan"
            icon={<SettingsIcon />}
            collapsed={collapsed}
            onNavigate={onCloseMobile}
          />
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-3 rounded-control px-3 py-2.5 text-sm text-text-secondary transition-colors duration-200 hover:bg-bg-surface-hover hover:text-danger"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-text-tertiary">
              <LogOutIcon />
            </span>
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
