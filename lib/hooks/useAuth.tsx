"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

/**
 * Whitelist email yang boleh login (Bagian 1: akun shared, dipakai berdua
 * — bukan siapa saja dengan akun Google). Diisi lewat
 * NEXT_PUBLIC_ALLOWED_EMAILS, dipisah koma, mis:
 * "kamu@gmail.com,pasangan@gmail.com". Kalau env var ini kosong/tidak
 * diisi, SEMUA akun Google diterima — isi env var ini di Vercel supaya
 * login tetap terbatas cuma untuk kalian berdua.
 */
const ALLOWED_EMAILS = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Provider auth tunggal untuk seluruh app. Akun shared — tidak ada konsep
 * "user A" vs "user B" di level auth, hanya `lastEditedBy` yang membedakan
 * siapa terakhir mengedit (lihat components/shared/LastEditedBy.tsx).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && ALLOWED_EMAILS.length > 0) {
        const email = (firebaseUser.email ?? "").toLowerCase();
        if (!ALLOWED_EMAILS.includes(email)) {
          firebaseSignOut(auth);
          setUser(null);
          setError("Akun Google ini tidak diizinkan mengakses Long Ledger.");
          setLoading(false);
          return;
        }
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError("Gagal masuk dengan Google. Coba lagi.");
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  }
  return ctx;
}
