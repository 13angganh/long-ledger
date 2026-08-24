"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

const PUBLIC_PATHS = new Set(["/login"]);

/**
 * Guard sederhana: kalau belum login dan sedang di halaman non-publik,
 * redirect ke /login. Kalau sudah login dan buka /login, redirect ke home.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicPath) {
      router.replace("/login");
    }
    if (user && isPublicPath) {
      router.replace("/");
    }
  }, [user, loading, isPublicPath, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div
          aria-hidden
          className="h-8 w-8 animate-pulse rounded-full bg-bg-surface-hover"
        />
      </div>
    );
  }

  // Belum login & bukan halaman publik: tahan render sampai redirect jalan.
  if (!user && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
