"use client";

import { useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAppMeta } from "@/lib/hooks/useAppMeta";
import { useSubscriptions } from "@/lib/hooks/useSubscriptions";
import { updateSubscription, deleteSubscription } from "@/lib/repositories/subscriptionRepo";
import { addSubscriptionCategory } from "@/lib/repositories/metaRepo";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { TagInput } from "@/components/shared/TagInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LastEditedBy } from "@/components/shared/LastEditedBy";
import type { BillingCycle, SubscriptionStatus } from "@/lib/types/subscription";

function resolveEditorName(displayName: string | null, email: string | null): string {
  return displayName || email?.split("@")[0] || "Pengguna";
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { meta } = useAppMeta();
  const { subscriptions, loading } = useSubscriptions();
  const router = useRouter();

  const subscription = subscriptions.find((s) => s.id === id);

  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [nextRenewalDate, setNextRenewalDate] = useState(toDateInputValue(new Date()));
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (subscription && subscription.id !== hydratedId) {
    setHydratedId(subscription.id);
    setName(subscription.name);
    setAmount(subscription.amount);
    setBillingCycle(subscription.billingCycle);
    setNextRenewalDate(toDateInputValue(subscription.nextRenewalDate.toDate()));
    setCategory(subscription.category);
    setStatus(subscription.status);
    setReminderDaysBefore(subscription.reminderDaysBefore);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !subscription) return;
    if (amount <= 0) {
      setError("Jumlah harus lebih dari 0.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const editorName = resolveEditorName(user.displayName, user.email);
      await updateSubscription(user.uid, subscription.id, {
        name: name.trim(),
        amount,
        billingCycle,
        nextRenewalDate: Timestamp.fromDate(new Date(nextRenewalDate)),
        category: category.trim(),
        status,
        reminderDaysBefore,
        lastEditedBy: editorName,
      });
      if (category.trim()) {
        await addSubscriptionCategory(user.uid, category.trim());
      }
      router.push("/subscriptions");
    } catch {
      setError("Gagal menyimpan perubahan. Coba lagi.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user || !subscription) return;
    await deleteSubscription(user.uid, subscription.id);
    router.push("/subscriptions");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="h-64 animate-pulse rounded-card border border-border-hairline bg-bg-surface" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-text-secondary">Langganan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>
          {subscription.name}
        </h1>
        <LastEditedBy name={subscription.lastEditedBy} size="md" />
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

        <Field label="Kategori" htmlFor="category">
          <TagInput
            id="category"
            value={category}
            onChange={setCategory}
            suggestions={meta.categories.subscription}
          />
        </Field>

        <Field label="Status" htmlFor="status">
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
            className="w-full rounded-control border border-border-hairline bg-bg-base px-3.5 py-2.5 text-text-primary outline-none focus:border-accent-emerald"
          >
            <option value="active">Aktif</option>
            <option value="paused">Dijeda</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
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
        title="Hapus langganan ini?"
        description="Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
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
