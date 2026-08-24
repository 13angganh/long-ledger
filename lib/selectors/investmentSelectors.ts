import type { Investment, InvestmentType } from "@/lib/types/investment";
import { INVESTMENT_TYPE_LABELS } from "@/lib/types/investment";

/**
 * SATU-SATUNYA lapisan yang menghitung logic agregasi/turunan untuk data
 * investasi (Bagian 4.2, Bagian 6.1b). Dashboard DAN /investments sama-sama
 * panggil fungsi di sini — tidak pernah dihitung ulang di komponen.
 */

/** Nilai investasi terkini: pakai currentPrice, fallback ke purchasePrice. */
function currentValue(inv: Investment): number {
  const priceEach = inv.currentPrice ?? inv.purchasePrice;
  return priceEach * inv.purchaseQty;
}

function onlyActive(investments: Investment[]): Investment[] {
  return investments.filter((inv) => inv.status === "active");
}

/** Total nilai portofolio terkini (hanya investasi status "active"). */
export function getTotalPortfolioValue(investments: Investment[]): number {
  return onlyActive(investments).reduce((sum, inv) => sum + currentValue(inv), 0);
}

export interface GainLoss {
  nominal: number;
  percent: number;
}

/** Selisih nilai current vs modal awal, nominal dan persentase. */
export function getTotalGainLoss(investments: Investment[]): GainLoss {
  const active = onlyActive(investments);
  const totalCurrent = active.reduce((sum, inv) => sum + currentValue(inv), 0);
  const totalCost = active.reduce((sum, inv) => sum + inv.purchaseTotal, 0);

  const nominal = totalCurrent - totalCost;
  const percent = totalCost > 0 ? (nominal / totalCost) * 100 : 0;

  return { nominal, percent };
}

export interface PortfolioAllocation {
  type: InvestmentType;
  label: string;
  value: number;
  percent: number;
}

/** Breakdown alokasi nilai per jenis instrumen (untuk pie/bar chart). */
export function getPortfolioByType(investments: Investment[]): PortfolioAllocation[] {
  const active = onlyActive(investments);
  const totals = new Map<InvestmentType, number>();

  for (const inv of active) {
    totals.set(inv.type, (totals.get(inv.type) ?? 0) + currentValue(inv));
  }

  const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0);

  return Array.from(totals.entries())
    .map(([type, value]) => ({
      type,
      label: INVESTMENT_TYPE_LABELS[type],
      value,
      percent: grandTotal > 0 ? (value / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

const NEAR_TARGET_THRESHOLD_PERCENT = 5;

/**
 * Item yang currentPrice mendekati targetSellPrice atau targetBuybackPrice
 * (dalam radius 5%) — untuk highlight visual, BUKAN notifikasi aktif
 * (Bagian 1 keputusan produk).
 */
export function getItemsNearTarget(investments: Investment[]): Investment[] {
  return onlyActive(investments).filter((inv) => {
    if (inv.currentPrice === null) return false;

    const nearSell =
      inv.targetSellPrice !== null &&
      Math.abs(inv.currentPrice - inv.targetSellPrice) / inv.targetSellPrice <=
        NEAR_TARGET_THRESHOLD_PERCENT / 100;

    const nearBuyback =
      inv.targetBuybackPrice !== null &&
      Math.abs(inv.currentPrice - inv.targetBuybackPrice) /
        inv.targetBuybackPrice <=
        NEAR_TARGET_THRESHOLD_PERCENT / 100;

    return nearSell || nearBuyback;
  });
}

const UPCOMING_MATURITY_DAYS = 30;

/**
 * Deposito/obligasi/SUN dengan maturityDate mendekati (≤30 hari) — reminder
 * pasif, mirip pola subscription renewal.
 */
export function getUpcomingMaturities(investments: Investment[]): Investment[] {
  const now = new Date();
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() + UPCOMING_MATURITY_DAYS);

  return onlyActive(investments).filter((inv) => {
    const maturityDate =
      inv.depositoDetail?.maturityDate ??
      inv.obligasiDetail?.maturityDate ??
      inv.sunDetail?.maturityDate;

    if (!maturityDate) return false;

    const date = maturityDate.toDate();
    return date >= now && date <= threshold;
  });
}

/** Filter investasi berdasarkan jenis instrumen. */
export function filterByInvestmentType(
  investments: Investment[],
  type: InvestmentType | null
): Investment[] {
  if (!type) return investments;
  return investments.filter((inv) => inv.type === type);
}

/** Filter investasi berdasarkan status. */
export function filterByInvestmentStatus(
  investments: Investment[],
  status: Investment["status"] | null
): Investment[] {
  if (!status) return investments;
  return investments.filter((inv) => inv.status === status);
}

/** Nilai terkini untuk satu item (dipakai di list & detail). */
export function getInvestmentCurrentValue(inv: Investment): number {
  return currentValue(inv);
}

/** Gain/loss untuk satu item individual. */
export function getInvestmentGainLoss(inv: Investment): GainLoss {
  const nominal = currentValue(inv) - inv.purchaseTotal;
  const percent = inv.purchaseTotal > 0 ? (nominal / inv.purchaseTotal) * 100 : 0;
  return { nominal, percent };
}
