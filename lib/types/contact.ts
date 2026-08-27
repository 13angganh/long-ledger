import type { Timestamp } from "firebase/firestore";

export interface ContactPhone {
  label: string;
  number: string;
}

export interface Contact {
  id: string;
  name: string;
  phones: ContactPhone[];
  relationship: string;
  tags: string[];
  note: string;
  lastContacted: Timestamp | null;
  reminderDate: Timestamp | null;
  lastEditedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Soft-delete (Poin 7): null = aktif, terisi = ada di Recycle Bin. */
  deletedAt: Timestamp | null;
}

export type ContactInput = Omit<
  Contact,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;
