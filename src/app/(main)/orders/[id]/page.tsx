"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { parseDressItems } from "@/lib/dress-items";
import { sanitizeDecimalString } from "@/lib/numeric-input";
import { useRunWithTopProgress } from "@/hooks/use-run-with-top-progress";
import { WhatsAppReminderButton } from "@/components/whatsapp-reminder-button";

const statuses = ["Pending", "Cutting", "Stitching", "Ready", "Delivered"] as const;

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const runWithTopProgress = useRunWithTopProgress();

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dressType, setDressType] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("Pending");
  const [totalAmount, setTotalAmount] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [pendingPaid, setPendingPaid] = useState("");
  const [remainingPayment, setRemainingPayment] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applyOrderJson = useCallback((o: Record<string, unknown>) => {
    setCustomerId(String(o.customerId ?? ""));
    setCustomerName(String(o.customerName ?? ""));
    setCustomerPhone(String(o.customerPhone ?? ""));
    setDressType(String(o.dressType ?? ""));
    setDeliveryDate(
      o.deliveryDate ? new Date(o.deliveryDate as string).toISOString().slice(0, 10) : "",
    );
    setStatus((o.status as (typeof statuses)[number]) ?? "Pending");
    setTotalAmount(String(o.totalAmount ?? ""));
    setAdvancePaid(String(o.advancePaid ?? ""));
    const rem = Number(o.remainingPayment ?? 0);
    setRemainingPayment(rem);
    setPendingPaid(String(Math.max(0, rem)));
    setNotes(String(o.notes ?? ""));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders/${id}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("missing");
        return r.json();
      })
      .then((o) => applyOrderJson(o as Record<string, unknown>))
      .catch(() => setError("Could not load order"))
      .finally(() => setLoading(false));
  }, [id, applyOrderJson]);

  function syncFromTotalAndAdvance(tStr: string, aStr: string) {
    if (tStr.trim() === "") return;
    const t = Number(tStr);
    if (Number.isNaN(t)) return;
    if (aStr.trim() === "") return;
    const a = Number(aStr);
    if (Number.isNaN(a)) return;
    setPendingPaid(String(Math.max(0, t - a)));
  }

  function syncAdvanceFromTotalAndPending(tStr: string, pStr: string) {
    if (pStr.trim() === "") return;
    if (tStr.trim() === "") return;
    const t = Number(tStr);
    const p = Number(pStr);
    if (Number.isNaN(t) || Number.isNaN(p)) return;
    const pClamped = Math.max(0, Math.min(t, p));
    setAdvancePaid(String(Math.max(0, t - pClamped)));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const total = Number(totalAmount);
      let adv: number;
      const dueRaw = pendingPaid.trim() === "" ? NaN : Number(pendingPaid);
      const advRaw = advancePaid.trim() === "" ? NaN : Number(advancePaid);
      if (Number.isNaN(total) || total < 0) {
        setError("Enter a valid total.");
        return;
      }
      if (!Number.isNaN(dueRaw) && dueRaw >= 0) {
        adv = Math.max(0, Math.min(total, total - Math.min(dueRaw, total)));
      } else if (!Number.isNaN(advRaw) && advRaw >= 0) {
        adv = Math.min(Math.max(0, advRaw), total);
      } else {
        setError("Enter advance paid and/or pending (due) amount.");
        return;
      }
      await runWithTopProgress(async () => {
        const res = await fetch(`/api/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dressType,
            deliveryDate,
            status,
            totalAmount: total,
            advancePaid: adv,
            notes,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(typeof data.error === "string" ? data.error : "Save failed");
          return;
        }
        queueMicrotask(() => {
          (document.activeElement as HTMLElement | null)?.blur?.();
        });
        router.replace("/orders?updated=1");
        router.refresh();
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this order?")) return;
    await runWithTopProgress(async () => {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/orders");
    });
  }

  if (loading) return <p className="text-[var(--muted)]">Loading…</p>;
  if (error && !dressType) return <p className="text-[var(--danger)]">{error}</p>;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/orders"
          className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
        >
          ← All orders
        </Link>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {(() => {
            const items = parseDressItems(dressType);
            if (items.length === 0) {
              return <h1 className="text-2xl font-semibold tracking-tight">Order</h1>;
            }
            if (items.length === 1) {
              return <h1 className="text-2xl font-semibold tracking-tight">{items[0]}</h1>;
            }
            return (
              <ol className="list-inside list-decimal space-y-1 text-2xl font-semibold tracking-tight marker:text-[var(--muted)]">
                {items.map((item, i) => (
                  <li key={i} className="pl-0.5">
                    {item}
                  </li>
                ))}
              </ol>
            );
          })()}
          <p className="mt-1 text-sm text-[var(--muted)]">
            {customerName ? (
              <Link href={`/customers/${customerId}`} className="underline">
                {customerName}
              </Link>
            ) : (
              "Customer"
            )}
          </p>
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

      <div className="surface grid gap-3 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-[var(--muted)]">Total</p>
          <p className="text-lg font-semibold tabular-nums">₹{totalAmount}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Advance</p>
          <p className="text-lg font-semibold tabular-nums">₹{advancePaid}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Remaining</p>
          <p className="text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            ₹{remainingPayment}
          </p>
        </div>
      </div>

      <div className="surface space-y-3 p-4">
        <p className="text-sm font-medium">Customer reminder (WhatsApp)</p>
        <p className="text-xs text-[var(--muted)]">
          Khata Book jaisa — message tayyar hoga, aap sirf Send dabayenge.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {remainingPayment > 0 ? (
            <WhatsAppReminderButton
              phone={customerPhone}
              customerName={customerName}
              dressType={dressType}
              deliveryDate={deliveryDate}
              remainingPayment={remainingPayment}
              totalAmount={Number(totalAmount) || undefined}
              status={status}
              kind="payment"
            />
          ) : null}
          {status === "Ready" ? (
            <WhatsAppReminderButton
              phone={customerPhone}
              customerName={customerName}
              dressType={dressType}
              deliveryDate={deliveryDate}
              remainingPayment={remainingPayment}
              kind="ready"
            />
          ) : null}
          <WhatsAppReminderButton
            phone={customerPhone}
            customerName={customerName}
            dressType={dressType}
            deliveryDate={deliveryDate}
            remainingPayment={remainingPayment}
            kind="delivery"
          />
        </div>
      </div>

      <form onSubmit={onSave} className="surface space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Dress / item</label>
          <textarea
            value={dressType}
            onChange={(e) => setDressType(e.target.value)}
            rows={4}
            placeholder="Lehenga, Blouse — ya har line par ek item"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Har line alag item — ya ek line mein comma / semicolon se alag-alag likho (jaise: Lehenga, Blouse).
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Delivery date</label>
          <input
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Total (₹)</label>
            <input
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => {
                const v = sanitizeDecimalString(e.target.value);
                setTotalAmount(v);
                syncFromTotalAndAdvance(v, advancePaid);
              }}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Advance paid (₹)</label>
            <input
              inputMode="decimal"
              value={advancePaid}
              onChange={(e) => {
                const v = sanitizeDecimalString(e.target.value);
                setAdvancePaid(v);
                syncFromTotalAndAdvance(totalAmount, v);
              }}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Pending / due (₹)</label>
            <input
              inputMode="decimal"
              value={pendingPaid}
              onChange={(e) => {
                const v = sanitizeDecimalString(e.target.value);
                setPendingPaid(v);
                if (v.trim() === "") return;
                syncAdvanceFromTotalAndPending(totalAmount, v);
              }}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Change advance or pending — the other updates automatically.
            </p>
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
          disabled={saving}
          className="flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--on-accent)] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
