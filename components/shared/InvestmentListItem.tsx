import Link from "next/link";
import type { Investment } from "@/lib/types/investment";
import { INVESTMENT_TYPE_LABELS } from "@/lib/types/investment";
import { getInvestmentCurrentValue, getInvestmentGainLoss } from "@/lib/selectors/investmentSelectors";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import { Badge } from "@/components/ui/Badge";
import { formatIDR } from "@/lib/format";

export function InvestmentListItem({ investment }: { investment: Investment }) {
  const currentValue = getInvestmentCurrentValue(investment);
  const gainLoss = getInvestmentGainLoss(investment);
  const isGain = gainLoss.nominal >= 0;

  return (
    <Link
      href={`/investments/${investment.id}`}
      className="card-interactive flex items-center justify-between gap-3 rounded-control border border-border-hairline bg-bg-surface px-4 py-3.5"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-text-primary">
            {investment.name}
          </span>
          {investment.status !== "active" && (
            <Badge tone="neutral">
              {investment.status === "sold" ? "Terjual" : "Jatuh tempo"}
            </Badge>
          )}
        </div>
        <span className="text-xs text-text-tertiary">
          {INVESTMENT_TYPE_LABELS[investment.type]}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-medium text-text-primary">
          {formatIDR(currentValue)}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${isGain ? "text-accent-emerald" : "text-danger"}`}>
            {isGain ? "+" : ""}
            {gainLoss.percent.toFixed(1)}%
          </span>
          <LastEditedBy name={investment.lastEditedBy} />
        </div>
      </div>
    </Link>
  );
}
