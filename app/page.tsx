"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { getGreeting, getFirstName } from "@/lib/greeting";
import { FinanceSummaryCard } from "@/components/dashboard/FinanceSummaryCard";
import { InvestmentSummaryCard } from "@/components/dashboard/InvestmentSummaryCard";
import { SubscriptionSummaryCard } from "@/components/dashboard/SubscriptionSummaryCard";
import { WatchlistProgressCard } from "@/components/dashboard/WatchlistProgressCard";
import { ContactReminderCard } from "@/components/dashboard/ContactReminderCard";

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = getFirstName(user?.displayName ?? null);
  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
        {greeting}
        {firstName ? `, ${firstName}` : ""}
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FinanceSummaryCard />
        <InvestmentSummaryCard />
        <SubscriptionSummaryCard />
        <WatchlistProgressCard />
        <ContactReminderCard />
      </div>
    </div>
  );
}
