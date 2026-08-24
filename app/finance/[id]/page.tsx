"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppMeta } from "@/lib/hooks/useAppMeta";
import { useTransactions } from "@/lib/hooks/useTransactions";
import {
  updateTransaction,
  deleteTransaction,
} from "@/lib/repositories/transactionRepo";
import { addFinanceCategory } from "@/lib/repositories/metaRepo";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { TagInput } from "@/components/shared/TagInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import type { TransactionType } from "@/lib/types/transaction";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { meta } = useAppMeta();
  const { transactions, loading } = useTransactions();
  const router = useRouter();

  const transaction = transactions.find((t) => t.id === id);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Isi form dari data transaksi begitu tersedia (pola "adjust state during
  // render" React — menghindari setState sinkron di effect body). Hanya
  // jalan sekali per dokumen (dibedakan lewat id), supaya edit user tidak
  // tertimpa ulang tiap kali listener Firestore mengirim snapshot baru.
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  if (transaction && transaction.id !== hydratedId) {
    setHydratedId(transaction.id);
    setType(transaction.type);
    setAmount(transaction.amount);
    setCategory(transaction.category);
    setNote(transaction.note);
    setDate(toDateInputValue(transaction.date.toDate()));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !transaction) return;
    if (amount <= 0) {
      setError("Jumlah harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await updateTransaction(user.uid, transaction.id, {
        type,
        amount,
        category: category.trim(),
        note: note.trim(),
        date: Timestamp.fromDate(new Date(date)),
        lastEditedBy: editorName,
      });
      if (category.trim()) {
        await addFinanceCategory(user.uid, category.trim());
      }
      router.push("/finance");
    } catch {
      setError("Gagal menyimpan perubahan. Coba lagi.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user || !transaction) return;
    await deleteTransaction(user.uid, transaction.id);
    router.push("/finance");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="h-64 animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-text-secondary">Transaksi tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Detail transaksi
        </h1>
        <LastEditedBy name={transaction.lastEditedBy} size="md" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-2">
          <TypeButton
            label="Pengeluaran"
            active={type === "expense"}
            onClick={() => setType("expense")}
          />
          <TypeButton
            label="Pemasukan"
            active={type === "income"}
            onClick={() => setType("income")}
          />
        </div>

        <Field label="Jumlah" htmlFor="amount">
          <CurrencyInput id="amount" value={amount} onChange={setAmount} required />
        </Field>

        <Field label="Kategori" htmlFor="category">
          <TagInput
            id="category"
            value={category}
            onChange={setCategory}
            suggestions={meta.categories.finance}
          />
        </Field>

        <Field label="Tanggal" htmlFor="date">
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <Field label="Catatan (opsional)" htmlFor="note">
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="rounded-control border border-danger/40 px-4 py-2.5 text-sm text-danger hover:bg-danger-soft"
          >
            Hapus
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-control bg-accent-emerald px-4 py-2.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus transaksi ini?"
        description="Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function TypeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-control border px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
        active
          ? "border-accent-emerald bg-accent-emerald-soft text-text-primary"
          : "border-border-hairline text-text-secondary hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}
