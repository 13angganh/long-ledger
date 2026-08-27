import type { Timestamp } from "firebase/firestore";

/**
 * "transfer" (Poin 9): perpindahan uang tunai↔bank, BUKAN pemasukan/
 * pengeluaran sungguhan — dikecualikan dari perhitungan total income/expense
 * di financeSelectors, supaya tidak mendistorsi laporan bulanan.
 */
export type TransactionType = "income" | "expense" | "transfer";

/** Akun sumber/tujuan uang — free-standing dari siapa pemiliknya. */
export type AccountType = "cash" | "bank";

/** Pemilik akun — keluarga kecil, dua orang (Bagian 1: shared account). */
export type Owner = "suami" | "istri";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: Timestamp;
  lastEditedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Soft-delete (Poin 7): null = aktif, terisi = ada di Recycle Bin. */
  deletedAt: Timestamp | null;

  /** Poin 9: tunai atau bank. */
  accountType: AccountType;
  /** Poin 9: milik suami atau istri — tetap satu rangkaian catatan sinkron. */
  owner: Owner;

  /**
   * Poin 9, khusus type "transfer": akun TUJUAN transfer (accountType di
   * atas adalah akun ASAL). null untuk income/expense biasa.
   */
  transferToAccountType: AccountType | null;
  /**
   * Poin 9, khusus type "transfer": id dokumen pasangannya — satu transfer
   * selalu menghasilkan 2 dokumen (keluar dari asal, masuk ke tujuan) yang
   * saling merujuk lewat field ini, supaya bisa dihapus/dipulihkan bersamaan
   * dan ditelusuri sebagai satu peristiwa yang sama.
   */
  transferPairId: string | null;
}

/**
 * Payload untuk create — id, createdAt, updatedAt, deletedAt di-generate
 * oleh repository.
 */
export type TransactionInput = Omit<
  Transaction,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: "Tunai",
  bank: "Bank",
};

export const OWNER_LABELS: Record<Owner, string> = {
  suami: "Suami",
  istri: "Istri",
};
