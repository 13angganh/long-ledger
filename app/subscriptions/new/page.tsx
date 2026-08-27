"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppMeta } from "@/lib/hooks/useAppMeta";
import { createSubscription } from "@/lib/repositories/subscriptionRepo";
import { addSubscriptionCategory } from "@/lib/repositories/metaRepo";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { TagInput } from "@/components/shared/TagInput";
import { DEFAULT_REMINDER_DAYS_BEFORE, type BillingCycle } from "@/lib/types/subscription";
import { OWNER_LABELS, type Owner } from "@/lib/types/transaction";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function NewSubscriptionPage() {
  const { user } = useAuth();
  const { meta } = useAppMeta();
  const router = useRouter();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [nextRenewalDate, setNextRenewalDate] = useState(toDateInputValue(new Date()));
  const [category, setCategory] = useState("");
  const [owner, setOwner] = useState<Owner>("suami");
  const [reminderDaysBefore, setReminderDaysBefore] = useState(DEFAULT_REMINDER_DAYS_BEFORE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (amount <= 0) {
      setError("Jumlah harus lebih dari 0.");
      return;
    }
    if (!name.trim()) {
      setError("Nama langganan wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await createSubscription(user.uid, {
        name: name.trim(),
        amount,
        billingCycle,
        nextRenewalDate: Timestamp.fromDate(new Date(nextRenewalDate)),
        category: category.trim(),
        status: "active",
        reminderDaysBefore,
        lastEditedBy: editorName,
        owner,
      });
      if (category.trim()) {
        await addSubscriptionCategory(user.uid, category.trim());
      }
      router.push("/subscriptions");
    } catch {
      setError("Gagal menyimpan langganan. Coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
        Tambah langganan
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nama" htmlFor="name">
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Netflix, Vercel Pro"
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Jumlah" htmlFor="amount">
            <CurrencyInput id="amount" value={amount} onChange={setAmount} required />
          </Field>
          <Field label="Siklus tagihan" htmlFor="billingCycle">
            <select
              id="billingCycle"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
            >
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
              <option value="weekly">Mingguan</option>
            </select>
          </Field>
        </div>

        <Field label="Tanggal perpanjangan berikutnya" htmlFor="nextRenewalDate">
          <input
            id="nextRenewalDate"
            type="date"
            required
            value={nextRenewalDate}
            onChange={(e) => setNextRenewalDate(e.target.value)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          />
        </Field>

        <Field label="Kategori (opsional)" htmlFor="category">
          <TagInput
            id="category"
            value={category}
            onChange={setCategory}
            suggestions={meta.categories.subscription}
            placeholder="mis. Hiburan, Software, Kerja"
          />
        </Field>

        <Field label="Pemilik" htmlFor="owner">
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(OWNER_LABELS) as [Owner, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setOwner(value)}
                className={`rounded-control border px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                  owner === value
                    ? "border-accent-emerald bg-accent-emerald-soft text-text-primary"
                    : "border-border-hairline text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Ingatkan berapa hari sebelum renewal" htmlFor="reminderDaysBefore">
          <input
            id="reminderDaysBefore"
            type="number"
            min={0}
            value={reminderDaysBefore}
            onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
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
            {submitting ? "Menyimpan…" : "Simpan langganan"}
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
