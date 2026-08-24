import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
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

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk contacts
 * (Bagian 4.2). Ikuti pola transactionRepo.ts persis.
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as ContactInput);
  return ref.id;
}

export async function updateContact(
  userId: string,
  contactId: string,
  input: Partial<ContactInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "contacts", contactId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
}

export async function deleteContact(
  userId: string,
  contactId: string
): Promise<void> {
  const ref = doc(db, "users", userId, "contacts", contactId);
  await deleteDoc(ref);
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
