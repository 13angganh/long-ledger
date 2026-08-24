import type { Timestamp } from "firebase/firestore";

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
}

export type SubscriptionInput = Omit<
  Subscription,
  "id" | "createdAt" | "updatedAt"
>;

export const DEFAULT_REMINDER_DAYS_BEFORE = 3;
