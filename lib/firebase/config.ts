import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * SATU-SATUNYA tempat init Firebase SDK (Bagian 4.2 brief).
 * Tidak ada file lain di project ini yang boleh memanggil initializeApp/
 * getFirestore/getAuth/getStorage secara langsung — semua import dari sini.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function createFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export const firebaseApp = createFirebaseApp();

/**
 * Firestore dengan offline persistence (multi-tab) — penting untuk PWA
 * (Bagian 4.1: "offline persistence built-in" adalah salah satu alasan
 * memilih Firestore, bukan RTDB).
 *
 * Di server (SSR/build), fallback ke getFirestore biasa karena
 * persistentLocalCache hanya berjalan di browser.
 */
function createFirestoreInstance(): Firestore {
  if (typeof window === "undefined") {
    return getFirestore(firebaseApp);
  }
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // initializeFirestore sudah dipanggil sebelumnya (mis. Fast Refresh) —
    // pakai instance yang sudah ada.
    return getFirestore(firebaseApp);
  }
}

export const db: Firestore = createFirestoreInstance();
export const auth: Auth = getAuth(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);
