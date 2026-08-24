import type { Timestamp } from "firebase/firestore";

export type InvestmentType =
  | "deposito"
  | "saham_id"
  | "saham_global"
  | "emas"
  | "crypto"
  | "reksadana"
  | "obligasi"
  | "sun"
  | "properti";

export type InvestmentStatus = "active" | "sold" | "matured";

export interface DepositoDetail {
  bank: string;
  interestRate: number;
  maturityDate: Timestamp;
  tenor: string;
  autoRollover: boolean;
}

export interface SahamDetail {
  exchange: string;
  ticker: string;
  lot: number;
  broker: string;
}

export type EmasForm = "batangan" | "perhiasan" | "koin";

export interface EmasDetail {
  form: EmasForm;
  purity: string;
  weightGram: number;
  storageLocation: string;
}

export type WalletType = "exchange" | "self_custody";

export interface CryptoDetail {
  network: string;
  wallet: string;
  walletType: WalletType;
}

export type FundType = "pasar_uang" | "pendapatan_tetap" | "saham" | "campuran";

export interface ReksadanaDetail {
  manager: string;
  fundType: FundType;
  nav: number;
}

export type PaymentFrequency =
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual";

export interface ObligasiDetail {
  issuer: string;
  couponRate: number;
  maturityDate: Timestamp;
  paymentFrequency: PaymentFrequency;
}

export interface SunDetail {
  series: string;
  couponRate: number;
  maturityDate: Timestamp;
  isSyariah: boolean;
}

export type CertificateType = "SHM" | "HGB" | "lainnya";

export interface PropertiDetail {
  location: string;
  landAreaM2: number | null;
  buildingAreaM2: number | null;
  certificateType: CertificateType;
  certificateStatus: string;
  monthlyIncome: number | null;
}

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  status: InvestmentStatus;
  purchaseDate: Timestamp;
  purchasePrice: number;
  purchaseQty: number;
  purchaseTotal: number;
  currentPrice: number | null;
  currentPriceUpdatedAt: Timestamp | null;
  targetSellPrice: number | null;
  targetBuybackPrice: number | null;
  note: string;
  lastEditedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Hanya SATU dari field berikut yang diisi, sesuai `type` (Bagian 6.1a).
  depositoDetail?: DepositoDetail;
  sahamDetail?: SahamDetail;
  emasDetail?: EmasDetail;
  cryptoDetail?: CryptoDetail;
  reksadanaDetail?: ReksadanaDetail;
  obligasiDetail?: ObligasiDetail;
  sunDetail?: SunDetail;
  propertiDetail?: PropertiDetail;
}

export type InvestmentInput = Omit<
  Investment,
  "id" | "createdAt" | "updatedAt"
>;

/** Map type instrumen -> label Bahasa Indonesia yang dipakai di UI. */
export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  deposito: "Deposito",
  saham_id: "Saham Indonesia",
  saham_global: "Saham Global",
  emas: "Emas / Logam Mulia",
  crypto: "Crypto",
  reksadana: "Reksadana",
  obligasi: "Obligasi",
  sun: "Surat Utang Negara",
  properti: "Properti",
};
