import type { Timestamp } from "firebase/firestore";
import type { Owner } from "@/lib/types/transaction";

export type BillingCycle = "monthly" | "yearly" | "weekly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextRenewalDate: Timestamp;
  category: string;
  status: SubscriptionStatus;
  reminderDaysBefore: number;
  lastEditedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Soft-delete (Poin 7): null = aktif, terisi = ada di Recycle Bin. */
  deletedAt: Timestamp | null;
  /** Poin 11: langganan milik suami atau istri, tetap satu daftar sinkron. */
  owner: Owner;
}

export type SubscriptionInput = Omit<
  Subscription,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export const DEFAULT_REMINDER_DAYS_BEFORE = 3;
