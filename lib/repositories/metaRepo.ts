import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { AppMeta } from "@/lib/types/shared";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk users/{userId}/meta/app
 * (Bagian 4.2). Dipakai lintas modul finance/subscription/contact untuk
 * autocomplete kategori & tag (Bagian 6.1) — bukan enum kaku, user tetap
 * bebas ketik value baru.
 *
 * PENTING: field categories.finance / categories.subscription ditulis lewat
 * dot-notation path ("categories.finance"), BUKAN nested object literal
 * ({ categories: { finance: ... } }) — setDoc merge:true mengganti seluruh
 * nested object sebagai satu unit kalau ditulis sebagai literal, yang akan
 * menghapus categories.subscription setiap kali categories.finance diupdate
 * (atau sebaliknya). Dot-notation menargetkan field spesifik dengan aman.
 */

const EMPTY_META: AppMeta = {
  categories: { finance: [], subscription: [] },
  tags: [],
};

function metaDoc(userId: string) {
  return doc(db, "users", userId, "meta", "app");
}

export async function getAppMeta(userId: string): Promise<AppMeta> {
  const snap = await getDoc(metaDoc(userId));
  if (!snap.exists()) return EMPTY_META;
  const data = snap.data() as Partial<AppMeta>;
  return {
    categories: {
      finance: data.categories?.finance ?? [],
      subscription: data.categories?.subscription ?? [],
    },
    tags: data.tags ?? [],
  };
}

export async function addFinanceCategory(
  userId: string,
  category: string
): Promise<void> {
  if (!category.trim()) return;
  await setDoc(
    metaDoc(userId),
    { "categories.finance": arrayUnion(category.trim()) },
    { merge: true }
  );
}

export async function addSubscriptionCategory(
  userId: string,
  category: string
): Promise<void> {
  if (!category.trim()) return;
  await setDoc(
    metaDoc(userId),
    { "categories.subscription": arrayUnion(category.trim()) },
    { merge: true }
  );
}

export async function addContactTags(
  userId: string,
  tags: string[]
): Promise<void> {
  const cleaned = tags.map((t) => t.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  await setDoc(
    metaDoc(userId),
    { tags: arrayUnion(...cleaned) },
    { merge: true }
  );
}

/** Hapus satu kategori finance dari daftar autocomplete (Settings page). */
export async function removeFinanceCategory(
  userId: string,
  category: string
): Promise<void> {
  await setDoc(
    metaDoc(userId),
    { "categories.finance": arrayRemove(category) },
    { merge: true }
  );
}

/** Hapus satu kategori subscription dari daftar autocomplete (Settings page). */
export async function removeSubscriptionCategory(
  userId: string,
  category: string
): Promise<void> {
  await setDoc(
    metaDoc(userId),
    { "categories.subscription": arrayRemove(category) },
    { merge: true }
  );
}

/** Hapus satu tag kontak dari daftar autocomplete (Settings page). */
export async function removeContactTag(
  userId: string,
  tag: string
): Promise<void> {
  await setDoc(metaDoc(userId), { tags: arrayRemove(tag) }, { merge: true });
}
