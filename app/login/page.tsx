"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.64v3.02h3.88c2.27-2.09 3.56-5.17 3.56-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.05 1.15-3.12 0-5.76-2.1-6.7-4.93H1.3v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.3 6.6l4 3.1c.94-2.83 3.58-4.95 6.7-4.95z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { signInWithGoogle, error } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-surface">
            <div className="flex flex-col gap-1">
              <span className="h-[3px] w-6 rounded-full bg-text-tertiary/70" />
              <span className="h-[3px] w-7 rounded-full bg-accent-emerald" />
              <span className="h-[3px] w-5 rounded-full bg-text-secondary/80" />
            </div>
          </div>
          <h1
            className="text-2xl leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Long Ledger
          </h1>
          <p className="text-sm text-text-secondary">
            Masuk untuk melanjutkan pencatatan
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-bg-surface p-6">
          <button
            type="button"
            onClick={handleClick}
            disabled={submitting}
            className="flex items-center justify-center gap-3 rounded-control bg-text-primary px-4 py-3 text-sm font-medium text-bg-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <GoogleIcon />
            {submitting ? "Membuka Google…" : "Masuk dengan Google"}
          </button>

          {error && (
            <p role="alert" className="text-center text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
