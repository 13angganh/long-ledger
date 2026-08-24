"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNavItem({
  href,
  label,
  icon,
  collapsed,
  onNavigate,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors duration-200 ${
        isActive
          ? "bg-accent-emerald-soft text-text-primary"
          : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center ${
          isActive ? "text-accent-emerald" : "text-text-tertiary"
        }`}
      >
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
