import Link from "next/link";
import type { Subscription } from "@/lib/types/subscription";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { Badge } from "@/components/ui/Badge";
import { formatIDR, formatDateID } from "@/lib/format";

const CYCLE_LABELS: Record<Subscription["billingCycle"], string> = {
  monthly: "/bulan",
  yearly: "/tahun",
  weekly: "/minggu",
};

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function SubscriptionListItem({ subscription }: { subscription: Subscription }) {
  const renewalDate = subscription.nextRenewalDate.toDate();
  const days = daysUntil(renewalDate);
  const isUrgent = subscription.status === "active" && days >= 0 && days <= 7;

  return (
    <Link
      href={`/subscriptions/${subscription.id}`}
      className={`card-interactive flex items-center justify-between gap-3 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5 ${
        isUrgent ? "halo-amber" : ""
      }`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-text-primary">
            {subscription.name}
          </span>
          {subscription.status !== "active" && (
            <Badge tone="neutral">
              {subscription.status === "paused" ? "Dijeda" : "Dibatalkan"}
            </Badge>
          )}
        </div>
        <span className="text-xs text-text-tertiary">
          {subscription.status === "active"
            ? days < 0
              ? `Terlewat ${formatDateID(renewalDate)}`
              : days === 0
                ? "Perpanjang hari ini"
                : `Perpanjang dalam ${days} hari`
            : formatDateID(renewalDate)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-medium text-text-primary">
          {formatIDR(subscription.amount)}
          <span className="text-xs text-text-tertiary">
            {CYCLE_LABELS[subscription.billingCycle]}
          </span>
        </span>
        <LastEditedBy name={subscription.lastEditedBy} />
      </div>
    </Link>
  );
}
