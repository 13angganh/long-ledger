import type { InvestmentType } from "@/lib/types/investment";
import { INVESTMENT_TYPE_LABELS } from "@/lib/types/investment";

export type FieldKind = "text" | "number" | "date" | "select" | "boolean";

export interface DetailFieldConfig {
  key: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

/**
 * SATU-SATUNYA definisi field detail per jenis instrumen (Bagian 6.1a).
 * Dipakai oleh form (app/investments/new) untuk render conditional fields,
 * DAN oleh halaman detail untuk menampilkan nilai — supaya field baru
 * cukup didaftarkan sekali di sini.
 */
export const INVESTMENT_DETAIL_FIELDS: Record<InvestmentType, DetailFieldConfig[]> = {
  deposito: [
    { key: "bank", label: "Bank", kind: "text", placeholder: "mis. BCA" },
    { key: "interestRate", label: "Suku bunga (% per tahun)", kind: "number" },
    { key: "maturityDate", label: "Tanggal jatuh tempo", kind: "date" },
    { key: "tenor", label: "Tenor", kind: "text", placeholder: "mis. 3 bulan" },
    { key: "autoRollover", label: "Otomatis diperpanjang", kind: "boolean" },
  ],
  saham_id: [
    {
      key: "exchange",
      label: "Bursa",
      kind: "text",
      placeholder: "IDX",
    },
    { key: "ticker", label: "Kode saham", kind: "text", placeholder: "mis. BBCA" },
    { key: "lot", label: "Jumlah lot", kind: "number" },
    { key: "broker", label: "Sekuritas", kind: "text" },
  ],
  saham_global: [
    {
      key: "exchange",
      label: "Bursa",
      kind: "text",
      placeholder: "mis. NASDAQ, NYSE",
    },
    { key: "ticker", label: "Kode saham", kind: "text", placeholder: "mis. AAPL" },
    { key: "lot", label: "Jumlah lembar", kind: "number" },
    { key: "broker", label: "Broker", kind: "text" },
  ],
  emas: [
    {
      key: "form",
      label: "Bentuk",
      kind: "select",
      options: [
        { value: "batangan", label: "Batangan" },
        { value: "perhiasan", label: "Perhiasan" },
        { value: "koin", label: "Koin" },
      ],
    },
    { key: "purity", label: "Kadar", kind: "text", placeholder: "mis. 24k, 99.99%" },
    { key: "weightGram", label: "Berat (gram)", kind: "number" },
    { key: "storageLocation", label: "Lokasi penyimpanan", kind: "text" },
  ],
  crypto: [
    { key: "network", label: "Network", kind: "text", placeholder: "mis. BTC, ERC-20, SOL" },
    { key: "wallet", label: "Wallet/Exchange", kind: "text" },
    {
      key: "walletType",
      label: "Jenis wallet",
      kind: "select",
      options: [
        { value: "exchange", label: "Exchange" },
        { value: "self_custody", label: "Self-custody" },
      ],
    },
  ],
  reksadana: [
    { key: "manager", label: "Manajer investasi", kind: "text" },
    {
      key: "fundType",
      label: "Jenis reksadana",
      kind: "select",
      options: [
        { value: "pasar_uang", label: "Pasar Uang" },
        { value: "pendapatan_tetap", label: "Pendapatan Tetap" },
        { value: "saham", label: "Saham" },
        { value: "campuran", label: "Campuran" },
      ],
    },
    { key: "nav", label: "NAV per unit saat beli", kind: "number" },
  ],
  obligasi: [
    { key: "issuer", label: "Penerbit", kind: "text" },
    { key: "couponRate", label: "Kupon (% per tahun)", kind: "number" },
    { key: "maturityDate", label: "Tanggal jatuh tempo", kind: "date" },
    {
      key: "paymentFrequency",
      label: "Frekuensi pembayaran",
      kind: "select",
      options: [
        { value: "monthly", label: "Bulanan" },
        { value: "quarterly", label: "Kuartalan" },
        { value: "semi_annual", label: "Semi-tahunan" },
        { value: "annual", label: "Tahunan" },
      ],
    },
  ],
  sun: [
    { key: "series", label: "Seri", kind: "text", placeholder: "mis. ORI025, SR018" },
    { key: "couponRate", label: "Kupon (% per tahun)", kind: "number" },
    { key: "maturityDate", label: "Tanggal jatuh tempo", kind: "date" },
    { key: "isSyariah", label: "Syariah", kind: "boolean" },
  ],
  properti: [
    { key: "location", label: "Lokasi", kind: "text" },
    { key: "landAreaM2", label: "Luas tanah (m²)", kind: "number" },
    { key: "buildingAreaM2", label: "Luas bangunan (m²)", kind: "number" },
    {
      key: "certificateType",
      label: "Jenis sertifikat",
      kind: "select",
      options: [
        { value: "SHM", label: "SHM" },
        { value: "HGB", label: "HGB" },
        { value: "lainnya", label: "Lainnya" },
      ],
    },
    { key: "certificateStatus", label: "Status legal", kind: "text" },
    { key: "monthlyIncome", label: "Pendapatan sewa/bulan", kind: "number" },
  ],
};

/** Nama field nested object di dokumen Investment, sesuai `type`. */
export const DETAIL_FIELD_NAME: Record<InvestmentType, string> = {
  deposito: "depositoDetail",
  saham_id: "sahamDetail",
  saham_global: "sahamDetail",
  emas: "emasDetail",
  crypto: "cryptoDetail",
  reksadana: "reksadanaDetail",
  obligasi: "obligasiDetail",
  sun: "sunDetail",
  properti: "propertiDetail",
};

export const INVESTMENT_TYPE_ORDER: InvestmentType[] = [
  "deposito",
  "saham_id",
  "saham_global",
  "emas",
  "crypto",
  "reksadana",
  "obligasi",
  "sun",
  "properti",
];

export { INVESTMENT_TYPE_LABELS };
