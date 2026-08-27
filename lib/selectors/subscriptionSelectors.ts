import type { Subscription } from "@/lib/types/subscription";
import type { Owner } from "@/lib/types/transaction";
import { OWNER_LABELS } from "@/lib/types/transaction";

/**
 * SATU-SATUNYA lapisan yang menghitung logic agregasi/turunan untuk data
 * subscription (Bagian 4.2). Dashboard DAN /subscriptions sama-sama panggil
 * fungsi di sini.
 */

function onlyActive(subscriptions: Subscription[]): Subscription[] {
  return subscriptions.filter((s) => s.status === "active");
}

/** Konversi billing cycle apapun ke setara nilai bulanan, untuk total spend. */
function toMonthlyEquivalent(sub: Subscription): number {
  switch (sub.billingCycle) {
    case "yearly":
      return sub.amount / 12;
    case "weekly":
      return sub.amount * (52 / 12);
    case "monthly":
    default:
      return sub.amount;
  }
}

/** Total spend bulanan dari seluruh subscription aktif (dinormalisasi). */
export function getMonthlySpend(subscriptions: Subscription[]): number {
  return onlyActive(subscriptions).reduce(
    (sum, sub) => sum + toMonthlyEquivalent(sub),
    0
  );
}

const URGENT_RENEWAL_DAYS = 7;

function daysUntil(date: Date, from: Date = new Date()): number {
  const diffMs = date.getTime() - from.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** Subscription aktif dengan renewal ≤7 hari (Bagian 7: halo amber trigger). */
export function getUrgentRenewals(
  subscriptions: Subscription[],
  referenceDate: Date = new Date()
): Subscription[] {
  return onlyActive(subscriptions).filter((sub) => {
    const days = daysUntil(sub.nextRenewalDate.toDate(), referenceDate);
    return days >= 0 && days <= URGENT_RENEWAL_DAYS;
  });
}

/** Subscription aktif terdekat renewal-nya, diurut ascending, dibatasi `limit`. */
export function getUpcomingRenewals(
  subscriptions: Subscription[],
  limit = 3
): Subscription[] {
  return [...onlyActive(subscriptions)]
    .sort((a, b) => a.nextRenewalDate.toMillis() - b.nextRenewalDate.toMillis())
    .slice(0, limit);
}

/** Filter subscription berdasarkan status. */
export function filterBySubscriptionStatus(
  subscriptions: Subscription[],
  status: Subscription["status"] | null
): Subscription[] {
  if (!status) return subscriptions;
  return subscriptions.filter((s) => s.status === status);
}

/** Filter subscription berdasarkan kategori. */
export function filterBySubscriptionCategory(
  subscriptions: Subscription[],
  category: string | null
): Subscription[] {
  if (!category) return subscriptions;
  return subscriptions.filter((s) => s.category === category);
}

/** Filter subscription berdasarkan pemilik (suami/istri). */
export function filterBySubscriptionOwner(
  subscriptions: Subscription[],
  owner: Owner | null
): Subscription[] {
  if (!owner) return subscriptions;
  return subscriptions.filter((s) => s.owner === owner);
}

export interface OwnerSpend {
  owner: Owner;
  label: string;
  monthlySpend: number;
}

/** Poin 11: total spend bulanan (dinormalisasi) per pemilik. */
export function getMonthlySpendByOwner(subscriptions: Subscription[]): OwnerSpend[] {
  const active = onlyActive(subscriptions);
  const totals: Record<Owner, number> = { suami: 0, istri: 0 };

  for (const sub of active) {
    totals[sub.owner] += toMonthlyEquivalent(sub);
  }

  return (Object.keys(totals) as Owner[]).map((owner) => ({
    owner,
    label: OWNER_LABELS[owner],
    monthlySpend: totals[owner],
  }));
}
