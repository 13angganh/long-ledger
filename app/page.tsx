import { FinanceSummaryCard } from "@/components/dashboard/FinanceSummaryCard";
import { InvestmentSummaryCard } from "@/components/dashboard/InvestmentSummaryCard";
import { SubscriptionSummaryCard } from "@/components/dashboard/SubscriptionSummaryCard";
import { WatchlistProgressCard } from "@/components/dashboard/WatchlistProgressCard";
import { ContactReminderCard } from "@/components/dashboard/ContactReminderCard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
        {getGreeting()}
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
