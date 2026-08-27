"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { createInvestment } from "@/lib/repositories/investmentRepo";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import {
  DynamicDetailFields,
  buildDetailObject,
  type DetailFormValues,
} from "@/components/shared/DynamicDetailFields";
import {
  INVESTMENT_TYPE_ORDER,
  INVESTMENT_TYPE_LABELS,
  INVESTMENT_DETAIL_FIELDS,
  DETAIL_FIELD_NAME,
} from "@/lib/investmentFieldConfig";
import type { InvestmentType, InvestmentInput } from "@/lib/types/investment";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function NewInvestmentPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<InvestmentType | null>(null);

  const [name, setName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(toDateInputValue(new Date()));
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [purchaseQty, setPurchaseQty] = useState(0);
  const [targetSellPrice, setTargetSellPrice] = useState(0);
  const [targetBuybackPrice, setTargetBuybackPrice] = useState(0);
  const [note, setNote] = useState("");
  const [detailValues, setDetailValues] = useState<DetailFormValues>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelectType(selected: InvestmentType) {
    setType(selected);
    setDetailValues({});
    setStep(2);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !type) return;
    if (purchasePrice <= 0 || purchaseQty <= 0) {
      setError("Harga beli dan jumlah unit harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      const fields = INVESTMENT_DETAIL_FIELDS[type];
      const detailKey = DETAIL_FIELD_NAME[type];
      const detailObject = buildDetailObject(fields, detailValues);

      const payload: InvestmentInput = {
        type,
        name: name.trim(),
        status: "active",
        purchaseDate: Timestamp.fromDate(new Date(purchaseDate)),
        purchasePrice,
        purchaseQty,
        purchaseTotal: purchasePrice * purchaseQty,
        currentPrice: null,
        currentPriceUpdatedAt: null,
        targetSellPrice: targetSellPrice > 0 ? targetSellPrice : null,
        targetBuybackPrice: targetBuybackPrice > 0 ? targetBuybackPrice : null,
        note: note.trim(),
        lastEditedBy: editorName,
        [detailKey]: detailObject,
      } as InvestmentInput;

      await createInvestment(user.uid, payload);
      router.push("/investments");
    } catch {
      setError("Gagal menyimpan investasi. Coba lagi.");
      setSubmitting(false);
    }
  }

  if (step === 1) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Pilih jenis instrumen
        </h1>
        <div className="grid grid-cols-2 gap-3">
          {INVESTMENT_TYPE_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleSelectType(t)}
              className="card-interactive rounded-card border border-border-hairline bg-bg-surface p-5 text-left"
            >
              <span className="text-sm font-medium text-text-primary">
                {INVESTMENT_TYPE_LABELS[t]}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const fields = INVESTMENT_DETAIL_FIELDS[type!];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          ← Ganti jenis
        </button>
      </div>
      <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
        {INVESTMENT_TYPE_LABELS[type!]}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nama" htmlFor="name">
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='mis. "BBCA", "BTC", "Emas Antam 10gr"'
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <Field label="Tanggal beli" htmlFor="purchaseDate">
          <input
            id="purchaseDate"
            type="date"
            required
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Harga beli per unit" htmlFor="purchasePrice">
            <CurrencyInput id="purchasePrice" value={purchasePrice} onChange={setPurchasePrice} required />
          </Field>
          <Field label="Jumlah unit" htmlFor="purchaseQty">
            <input
              id="purchaseQty"
              type="number"
              inputMode="decimal"
              required
              value={purchaseQty || ""}
              onChange={(e) => setPurchaseQty(Number(e.target.value))}
              className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
            />
          </Field>
        </div>

        {purchasePrice > 0 && purchaseQty > 0 && (
          <p className="text-xs text-text-tertiary">
            Total modal: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(purchasePrice * purchaseQty)}
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
            onClick={() => router.back()}
            className="flex-1 rounded-control border border-border-hairline px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-control bg-accent-emerald px-4 py-2.5 text-sm font-medium text-bg-base transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Menyimpan…" : "Simpan investasi"}
          </button>
        </div>
      </form>
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
