import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { transactionConverter } from "@/lib/firebase/converters";
import type {
  AccountType,
  Owner,
  Transaction,
  TransactionInput,
} from "@/lib/types/transaction";
import { ACCOUNT_TYPE_LABELS } from "@/lib/types/transaction";
import { logActivity } from "@/lib/repositories/activityLogRepo";

/**
 * SATU-SATUNYA lapisan yang bicara ke Firestore untuk transactions
 * (Bagian 4.2, aturan keras #1). Komponen React TIDAK PERNAH import
 * firebase/firestore langsung — selalu lewat fungsi di sini, dikonsumsi
 * lewat lib/hooks/useTransactions.ts.
 *
 * Hapus bersifat SOFT-DELETE (Poin 7, Recycle Bin) — dokumen tidak pernah
 * langsung dihapus dari Firestore lewat modul ini, hanya ditandai
 * `deletedAt`. Query subscribe tetap mengembalikan SEMUA dokumen (termasuk
 * yang soft-deleted); pemilahan aktif vs terhapus dilakukan di
 * financeSelectors. Hapus permanen ada di lib/repositories/trashRepo.ts.
 *
 * Poin 9: transfer tunai<->bank dibuat lewat createTransfer() — SATU aksi
 * yang menghasilkan DUA dokumen Transaction saling terhubung lewat
 * `transferPairId`, ditulis atomic pakai writeBatch supaya tidak pernah ada
 * transfer "setengah jadi" (satu sisi tercatat, sisi lain gagal).
 */

function transactionsCollection(userId: string) {
  return collection(db, "users", userId, "transactions").withConverter(
    transactionConverter
  );
}

/**
 * Subscribe real-time ke seluruh transaksi user (aktif + soft-deleted),
 * urut tanggal terbaru dulu. Listener hidup di sini (Bagian 4.2 aturan #4).
 */
export function subscribeToTransactions(
  userId: string,
  onChange: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(transactionsCollection(userId), orderBy("date", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((d) => d.data()));
    },
    (error) => onError?.(error)
  );
}

export async function createTransaction(
  userId: string,
  input: TransactionInput
): Promise<string> {
  const ref = await addDoc(transactionsCollection(userId), {
    ...input,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as TransactionInput);
  await logActivity(userId, {
    module: "finance",
    action: "create",
    targetId: ref.id,
    targetLabel: input.category || "Transaksi",
    actorName: input.lastEditedBy,
  });
  return ref.id;
}

export interface TransferInput {
  amount: number;
  fromAccountType: AccountType;
  toAccountType: AccountType;
  owner: Owner;
  note: string;
  date: Timestamp;
  lastEditedBy: string;
}

/**
 * Poin 9: catat perpindahan tunai<->bank sebagai SATU aksi, menghasilkan
 * dua dokumen Transaction bertipe "transfer" (satu di akun asal, satu di
 * akun tujuan), saling merujuk lewat transferPairId. Dikecualikan dari
 * total income/expense di financeSelectors — uangnya tidak hilang/
 * bertambah, cuma pindah tempat.
 */
export async function createTransfer(
  userId: string,
  input: TransferInput
): Promise<void> {
  // Pakai collection TANPA converter untuk batch write mentah ini — dengan
  // .withConverter(), toFirestore() mengharapkan objek Transaction utuh
  // (termasuk `id`), padahal `id` di sini justru datang DARI doc ref yang
  // baru dibuat, belum ada nilainya. Collection reference mentah (rawColl)
  // menghindari itu; hasil baca tetap lewat transactionsCollection() yang
  // ber-converter seperti biasa.
  const rawColl = collection(db, "users", userId, "transactions");
  const fromRef = doc(rawColl);
  const toRef = doc(rawColl);

  const fromLabel = `Transfer ke ${ACCOUNT_TYPE_LABELS[input.toAccountType]}`;
  const toLabel = `Transfer dari ${ACCOUNT_TYPE_LABELS[input.fromAccountType]}`;

  const batch = writeBatch(db);

  batch.set(fromRef, {
    type: "transfer",
    amount: input.amount,
    category: fromLabel,
    note: input.note,
    date: input.date,
    lastEditedBy: input.lastEditedBy,
    deletedAt: null,
    accountType: input.fromAccountType,
    owner: input.owner,
    transferToAccountType: input.toAccountType,
    transferPairId: toRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(toRef, {
    type: "transfer",
    amount: input.amount,
    category: toLabel,
    note: input.note,
    date: input.date,
    lastEditedBy: input.lastEditedBy,
    deletedAt: null,
    accountType: input.toAccountType,
    owner: input.owner,
    transferToAccountType: input.fromAccountType,
    transferPairId: fromRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  await logActivity(userId, {
    module: "finance",
    action: "create",
    targetId: fromRef.id,
    targetLabel: `Transfer ${ACCOUNT_TYPE_LABELS[input.fromAccountType]} → ${ACCOUNT_TYPE_LABELS[input.toAccountType]}`,
    actorName: input.lastEditedBy,
  });
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: Partial<TransactionInput>
): Promise<void> {
  const ref = doc(db, "users", userId, "transactions", transactionId);
  await updateDoc(ref, { ...input, updatedAt: serverTimestamp() });
  await logActivity(userId, {
    module: "finance",
    action: "update",
    targetId: transactionId,
    targetLabel: input.category || "Transaksi",
    actorName: input.lastEditedBy ?? "Pengguna",
  });
}

/**
 * Soft-delete: pindah ke Recycle Bin, bukan hapus permanen. Kalau
 * transaksi ini bagian dari transfer (`transferPairId` terisi), pasangannya
 * IKUT dihapus sekaligus — transfer selalu diperlakukan sebagai satu
 * peristiwa utuh, tidak pernah dihapus setengah.
 */
export async function softDeleteTransaction(
  userId: string,
  transactionId: string,
  actorName: string,
  targetLabel: string,
  pairId?: string | null
): Promise<void> {
  const batch = writeBatch(db);
  const ref = doc(db, "users", userId, "transactions", transactionId);
  batch.update(ref, {
    deletedAt: Timestamp.now(),
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });

  if (pairId) {
    const pairRef = doc(db, "users", userId, "transactions", pairId);
    batch.update(pairRef, {
      deletedAt: Timestamp.now(),
      lastEditedBy: actorName,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  await logActivity(userId, {
    module: "finance",
    action: "delete",
    targetId: transactionId,
    targetLabel,
    actorName,
  });
}

/** Pulihkan dari Recycle Bin — pasangan transfer ikut dipulihkan juga. */
export async function restoreTransaction(
  userId: string,
  transactionId: string,
  actorName: string,
  targetLabel: string,
  pairId?: string | null
): Promise<void> {
  const batch = writeBatch(db);
  const ref = doc(db, "users", userId, "transactions", transactionId);
  batch.update(ref, {
    deletedAt: null,
    lastEditedBy: actorName,
    updatedAt: serverTimestamp(),
  });

  if (pairId) {
    const pairRef = doc(db, "users", userId, "transactions", pairId);
    batch.update(pairRef, {
      deletedAt: null,
      lastEditedBy: actorName,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  await logActivity(userId, {
    module: "finance",
    action: "restore",
    targetId: transactionId,
    targetLabel,
    actorName,
  });
}
