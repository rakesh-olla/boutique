"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { parseMeasurements, stringifyMeasurements } from "@/lib/measurements";
import { sanitizeDigitsOnly } from "@/lib/numeric-input";
import { useRunWithTopProgress } from "@/hooks/use-run-with-top-progress";
import { WhatsAppReminderButton } from "@/components/whatsapp-reminder-button";

type OrderLite = {
  id: string;
  dressType: string;
  deliveryDate: string;
  status: string;
  totalAmount: number;
  advancePaid: number;
  remainingPayment: number;
};

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const runWithTopProgress = useRunWithTopProgress();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [measureText, setMeasureText] = useState("");
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedHint, setSavedHint] = useState(false);

  async function reloadCustomer() {
    const r = await fetch(`/api/customers/${id}`, { cache: "no-store" });
    if (!r.ok) return;
    const c = await r.json();
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address ?? "");
    setNotes(c.notes ?? "");
    setMeasureText(stringifyMeasurements(c.measurements ?? {}));
    setOrders(c.orders ?? []);
  }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/customers/${id}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((c) => {
        setName(c.name);
        setPhone(c.phone);
        setAddress(c.address ?? "");
        setNotes(c.notes ?? "");
        setMeasureText(stringifyMeasurements(c.measurements ?? {}));
        setOrders(c.orders ?? []);
      })
      .catch(() => setError("Could not load customer"))
      .finally(() => setLoading(false));
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await runWithTopProgress(async () => {
        const res = await fetch(`/api/customers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phone,
            address,
            notes,
            measurements: parseMeasurements(measureText),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(typeof data.error === "string" ? data.error : "Save failed");
          return;
        }
        await reloadCustomer();
        setSavedHint(true);
        window.setTimeout(() => setSavedHint(false), 2800);
        queueMicrotask(() => {
          (document.activeElement as HTMLElement | null)?.blur?.();
        });
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this customer and their orders?")) return;
    await runWithTopProgress(async () => {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/customers");
    });
  }

  if (loading) return <p className="text-[var(--muted)]">Loading…</p>;
  if (error && !name) return <p className="text-[var(--danger)]">{error}</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/customers"
          className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
        >
          ← All customers
        </Link>
        {savedHint ? (
          <p
            className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--foreground)]"
            role="status"
          >
            Changes saved.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name || "Customer"}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Edit details & history</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--danger)] px-3 py-2 text-sm text-[var(--danger)] hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <form onSubmit={onSave} className="surface space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(sanitizeDigitsOnly(e.target.value))}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Measurements</label>
          <textarea
            value={measureText}
            onChange={(e) => setMeasureText(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        {error ? (
          <p className="text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--on-accent)] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="surface p-6">
        <h2 className="font-semibold">Order history</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">No orders yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--card-border)]">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                    {o.dressType}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">
                    {new Date(o.deliveryDate).toLocaleDateString("en-IN")} · {o.status}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-sm tabular-nums">
                    ₹{o.totalAmount} · Due ₹{o.remainingPayment}
                  </p>
                  {o.remainingPayment > 0 && phone ? (
                    <WhatsAppReminderButton
                      phone={phone}
                      customerName={name}
                      dressType={o.dressType}
                      deliveryDate={o.deliveryDate}
                      remainingPayment={o.remainingPayment}
                      totalAmount={o.totalAmount}
                      kind="payment"
                      compact
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/orders/new?customerId=${id}`}
          className="mt-4 inline-block text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
        >
          + New order for this customer
        </Link>
      </div>
    </div>
  );
}
