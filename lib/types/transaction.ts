import type { Timestamp } from "firebase/firestore";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: Timestamp;
  lastEditedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Payload untuk create — id, createdAt, updatedAt di-generate oleh repository.
 */
export type TransactionInput = Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt"
>;
