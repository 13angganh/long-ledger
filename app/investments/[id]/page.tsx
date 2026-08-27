"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useInvestments } from "@/lib/hooks/useInvestments";
import { updateInvestment, softDeleteInvestment } from "@/lib/repositories/investmentRepo";
import {
  getInvestmentCurrentValue,
  getInvestmentGainLoss,
} from "@/lib/selectors/investmentSelectors";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import {
  DynamicDetailFields,
  buildDetailObject,
  detailObjectToFormValues,
  type DetailFormValues,
} from "@/components/shared/DynamicDetailFields";
import {
  INVESTMENT_TYPE_LABELS,
  INVESTMENT_DETAIL_FIELDS,
  DETAIL_FIELD_NAME,
} from "@/lib/investmentFieldConfig";
import { formatIDR } from "@/lib/format";
import type { InvestmentInput, InvestmentStatus } from "@/lib/types/investment";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

export default function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { investments, loading } = useInvestments();
  const router = useRouter();

  const investment = investments.find((inv) => inv.id === id);

  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<InvestmentStatus>("active");
  const [currentPriceInput, setCurrentPriceInput] = useState(0);
  const [targetSellPrice, setTargetSellPrice] = useState(0);
  const [targetBuybackPrice, setTargetBuybackPrice] = useState(0);
  const [note, setNote] = useState("");
  const [detailValues, setDetailValues] = useState<DetailFormValues>({});

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Isi form dari data begitu tersedia — hanya sekali per dokumen (pola
  // "adjust state during render", hindari setState sinkron di effect).
  if (investment && investment.id !== hydratedId) {
    setHydratedId(investment.id);
    setName(investment.name);
    setStatus(investment.status);
    setCurrentPriceInput(investment.currentPrice ?? investment.purchasePrice);
    setTargetSellPrice(investment.targetSellPrice ?? 0);
    setTargetBuybackPrice(investment.targetBuybackPrice ?? 0);
    setNote(investment.note);
    const fields = INVESTMENT_DETAIL_FIELDS[investment.type];
    const detailKey = DETAIL_FIELD_NAME[investment.type] as keyof typeof investment;
    setDetailValues(
      detailObjectToFormValues(
        fields,
        investment[detailKey] as Record<string, unknown> | undefined
      )
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="h-64 animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
      </div>
    );
  }

  if (!investment) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-text-secondary">Investasi tidak ditemukan.</p>
      </div>
    );
  }

  const fields = INVESTMENT_DETAIL_FIELDS[investment.type];
  const detailKey = DETAIL_FIELD_NAME[investment.type];
  const currentValue = getInvestmentCurrentValue(investment);
  const gainLoss = getInvestmentGainLoss(investment);
  const isGain = gainLoss.nominal >= 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !investment) return;

    setSubmitting(true);
    setError(null);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      const detailObject = buildDetailObject(fields, detailValues);
      const priceChanged = currentPriceInput !== (investment.currentPrice ?? investment.purchasePrice);

      await updateInvestment(user.uid, investment.id, {
        name: name.trim(),
        status,
        currentPrice: currentPriceInput > 0 ? currentPriceInput : null,
        currentPriceUpdatedAt: priceChanged ? Timestamp.now() : investment.currentPriceUpdatedAt,
        targetSellPrice: targetSellPrice > 0 ? targetSellPrice : null,
        targetBuybackPrice: targetBuybackPrice > 0 ? targetBuybackPrice : null,
        note: note.trim(),
        lastEditedBy: editorName,
        [detailKey]: detailObject,
      } as Partial<InvestmentInput>);
      router.push("/investments");
    } catch {
      setError("Gagal menyimpan perubahan. Coba lagi.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user || !investment) return;
    const editorName = resolveEditorName(user.displayName, user.email);
    await softDeleteInvestment(user.uid, investment.id, editorName, investment.name);
    router.push("/investments");
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
            {investment.name}
          </h1>
          <p className="text-sm text-text-tertiary">
            {INVESTMENT_TYPE_LABELS[investment.type]}
          </p>
        </div>
        <LastEditedBy name={investment.lastEditedBy} size="md" />
      </div>

      <div className="rounded-card border border-border-hairline bg-bg-surface p-6">
        <p className="text-xs text-text-tertiary">Nilai saat ini</p>
        <p className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          {formatIDR(currentValue)}
        </p>
        <p className={`mt-1 text-sm ${isGain ? "text-accent-emerald" : "text-danger"}`}>
          {isGain ? "+" : ""}
          {formatIDR(gainLoss.nominal)} ({gainLoss.percent >= 0 ? "+" : ""}
          {gainLoss.percent.toFixed(1)}%) vs modal {formatIDR(investment.purchaseTotal)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nama" htmlFor="name">
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <Field label="Status" htmlFor="status">
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as InvestmentStatus)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          >
            <option value="active">Aktif</option>
            <option value="sold">Terjual</option>
            <option value="matured">Jatuh tempo</option>
          </select>
        </Field>

        <Field label="Harga terkini per unit" htmlFor="currentPrice">
          <CurrencyInput id="currentPrice" value={currentPriceInput} onChange={setCurrentPriceInput} />
        </Field>
        {investment.currentPriceUpdatedAt && (
          <p className="-mt-3 text-xs text-text-tertiary">
            Terakhir update harga:{" "}
            {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
              investment.currentPriceUpdatedAt.toDate()
            )}
          </p>
        )}

        <div className="border-t border-border-hairline pt-5">
          <DynamicDetailFields
            fields={fields}
            values={detailValues}
            onChange={(key, value) =>
              setDetailValues((prev) => ({ ...prev, [key]: value }))
            }
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border-hairline pt-5">
          <p className="text-sm text-text-secondary">Target harga (opsional)</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target jual" htmlFor="targetSellPrice">
              <CurrencyInput id="targetSellPrice" value={targetSellPrice} onChange={setTargetSellPrice} />
            </Field>
            <Field label="Target beli kembali" htmlFor="targetBuybackPrice">
              <CurrencyInput id="targetBuybackPrice" value={targetBuybackPrice} onChange={setTargetBuybackPrice} />
            </Field>
          </div>
        </div>

        <Field label="Catatan" htmlFor="note">
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
            Pindahkan ke Recycle Bin
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
        title="Pindahkan ke Recycle Bin?"
        description="Investasi akan dipindah ke Recycle Bin dan bisa dipulihkan kapan saja dalam 30 hari sebelum terhapus permanen."
        confirmLabel="Pindahkan"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
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
