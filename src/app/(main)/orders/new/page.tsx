"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { parseDressItems } from "@/lib/dress-items";
import { sanitizeDecimalString } from "@/lib/numeric-input";
import { useRunWithTopProgress } from "@/hooks/use-run-with-top-progress";
type CustomerOpt = { id: string; name: string; phone: string };

const statuses = ["Pending", "Cutting", "Stitching", "Ready", "Delivered"] as const;

function NewOrderForm() {
  const router = useRouter();
  const runWithTopProgress = useRunWithTopProgress();
  const searchParams = useSearchParams();
  const presetCustomer = searchParams.get("customerId") ?? "";

  const [customers, setCustomers] = useState<CustomerOpt[]>([]);
  const [customerId, setCustomerId] = useState(presetCustomer);
  const [dressType, setDressType] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Pending");
  const [totalAmount, setTotalAmount] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/customers", { cache: "no-store" })
      .then((r) => r.json())
      .then((list: CustomerOpt[]) => setCustomers(list))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (presetCustomer) setCustomerId(presetCustomer);
  }, [presetCustomer]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const total = Number(totalAmount);
      const adv = Number(advancePaid);
      if (!customerId || parseDressItems(dressType).length === 0 || Number.isNaN(total) || Number.isNaN(adv)) {
        setError("Enter valid numbers, select a customer, and at least one dress/item (one per line).");
        return;
      }
      await runWithTopProgress(async () => {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            dressType,
            deliveryDate,
            status,
            totalAmount: total,
            advancePaid: adv,
            notes,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Save failed");
          return;
        }
        router.replace("/orders?added=1");
        router.refresh();
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/orders"
          className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
        >
          ← All orders
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New order</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Link to a customer and set delivery & payment
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="surface space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Customer *</label>
          <select
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">Select…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.phone}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Missing someone?{" "}
            <Link href="/customers/new" className="underline">
              Add customer
            </Link>
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Dress / item *</label>
          <textarea
            required
            value={dressType}
            onChange={(e) => setDressType(e.target.value)}
            rows={4}
            placeholder="Lehenga, Blouse — ya har line par ek item"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Nayi line = naya item; ya ek line par comma / semicolon se kai items.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Delivery date *</label>
          <input
            required
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof statuses)[number])}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Total (₹) *</label>
            <input
              required
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(sanitizeDecimalString(e.target.value))}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Advance (₹) *</label>
            <input
              required
              inputMode="decimal"
              value={advancePaid}
              onChange={(e) => setAdvancePaid(sanitizeDecimalString(e.target.value))}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
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
          disabled={loading}
          className="flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--on-accent)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
          {loading ? "Creating…" : "Create order"}
        </button>
      </form>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Loading…</p>}>
      <NewOrderForm />
    </Suspense>
  );
}
