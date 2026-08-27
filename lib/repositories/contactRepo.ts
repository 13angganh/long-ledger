import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { contactConverter } from "@/lib/firebase/converters";
import type { Contact, ContactInput } from "@/lib/types/contact";
import { logActivity } from "@/lib/repositories/activityLogRepo";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk contacts
 * (Bagian 4.2). Hapus bersifat SOFT-DELETE (Poin 7) — lihat catatan
 * lengkap di transactionRepo.ts. Hapus permanen ada di trashRepo.ts.
 */

function contactsCollection(userId: string) {
  return collection(db, "users", userId, "contacts").withConverter(
    contactConverter
  );
}

export function subscribeToContacts(
  userId: string,
  onChange: (contacts: Contact[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(contactsCollection(userId), orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data())),
    (error) => onError?.(error)
  );
}

export async function createContact(
  userId: string,
  input: ContactInput
): Promise<string> {
  const ref = await addDoc(contactsCollection(userId), {
    ...input,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as ContactInput);
  await logActivity(userId, {
    module: "contact",
    action: "create",
    targetId: ref.id,
    targetLabel: input.name,
    actorName: input.lastEditedBy,
  });
  return ref.id;
}

export async function updateContact(
  userId: string,
  contactId: string,
  input: Partial<ContactInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "contacts", contactId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  await logActivity(userId, {
    module: "contact",
    action: "update",
    targetId: contactId,
    targetLabel: input.name ?? "Kontak",
    actorName: input.lastEditedBy ?? "Pengguna",
  });
}

export async function softDeleteContact(
  userId: string,
  contactId: string,
  actorName: string,
  targetLabel: string
): Promise<void> {
  const ref = doc(db, "users", userId, "contacts", contactId);
  await updateDoc(ref, {
    deletedAt: Timestamp.now(),
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, {
    module: "contact",
    action: "delete",
    targetId: contactId,
    targetLabel,
    actorName,
  });
}

export async function restoreContact(
  userId: string,
  contactId: string,
  actorName: string,
  targetLabel: string
): Promise<void> {
  const ref = doc(db, "users", userId, "contacts", contactId);
  await updateDoc(ref, {
    deletedAt: null,
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userId, {
    module: "contact",
    action: "restore",
    targetId: contactId,
    targetLabel,
    actorName,
  });
}

/**
 * Tandai kontak baru saja dihubungi (Bagian 6.1: update MANUAL lewat
 * tombol aksi cepat, BUKAN auto-detect dari log panggilan/WhatsApp).
 */
export async function markContactedNow(
  userId: string,
  contactId: string,
  editorName: string
): Promise<void> {
  const ref = doc(db, "users", userId, "contacts", contactId);
  await updateDoc(ref, {
    lastContacted: Timestamp.now(),
    lastEditedBy: editorName,
    updatedAt: serverTimestamp(),
  });
}
