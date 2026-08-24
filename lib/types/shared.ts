import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  displayName: string;
  email: string;
  createdAt: Timestamp;
}

/**
 * users/{userId}/meta/app — satu dokumen berisi daftar kategori/tag yang
 * pernah dipakai, untuk autocomplete (Bagian 6.1). BUKAN enum kaku — hanya
 * bantuan input, user tetap bisa ketik custom value baru kapan saja.
 */
export interface AppMeta {
  categories: {
    finance: string[];
    subscription: string[];
  };
  tags: string[]; // tag kontak yang pernah dipakai
}
