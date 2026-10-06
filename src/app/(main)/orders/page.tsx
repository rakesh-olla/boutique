"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { WhatsAppReminderButton } from "@/components/whatsapp-reminder-button";
import { parseDressItems } from "@/lib/dress-items";

type Row = {
  id: string;
  customerName: string;
  customerPhone: string;
  dressType: string;
  deliveryDate: string;
  status: string;
  remainingPayment: number;
  totalAmount?: number;
};

function OrdersListInner() {
  const searchParams = useSearchParams();
  const addedFlag = searchParams.get("added");
  const updatedFlag = searchParams.get("updated");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      setLoading(true);
      fetch("/api/orders", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setRows(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) load();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [addedFlag, updatedFlag]);

  const justAdded = addedFlag === "1";
  const justUpdated = updatedFlag === "1";

  return (
    <div className="space-y-6">
      {justUpdated ? (
        <p
          className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--foreground)]"
          role="status"
        >
          Order saved — list updated below.
        </p>
      ) : null}
      {justAdded ? (
        <p
          className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--foreground)]"
          role="status"
        >
          Order created — list updated below.
        </p>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Stitching workflow & payments</p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--on-accent)] active:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New order
        </Link>
      </div>

      <div className="surface overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--card-border)]">
            {rows.map((o) => (
              <li key={o.id}>
                <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <Link
                    href={`/orders/${o.id}`}
                    className="min-w-0 flex-1 transition hover:opacity-90 active:opacity-80"
                  >
                    <p className="text-base font-semibold leading-snug tracking-tight text-[var(--foreground)] sm:text-lg">
                      {o.customerName.trim() ? o.customerName : "Customer"}
                    </p>
                    <div className="mt-1.5 text-sm text-[var(--muted)]">
                      {(() => {
                        const items = parseDressItems(o.dressType);
                        if (items.length === 0) return <p>—</p>;
                        if (items.length === 1) {
                          return <p className="line-clamp-2">{items[0]}</p>;
                        }
                        return (
                          <ol className="list-inside list-decimal marker:font-normal marker:text-[var(--muted)]">
                            {items.map((item, i) => (
                              <li key={i} className="pl-0.5 [&:not(:first-child)]:mt-0.5">
                                {item}
                              </li>
                            ))}
                          </ol>
                        );
                      })()}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(o.deliveryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </Link>
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end sm:pt-0.5">
                    <div className="text-right text-sm sm:min-w-[5.5rem]">
                      <span className="rounded-full bg-[var(--sidebar)] px-2 py-0.5 text-xs font-medium">
                        {o.status}
                      </span>
                      {o.remainingPayment > 0 ? (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                          Due ₹{o.remainingPayment}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-[var(--success)]">Paid</p>
                      )}
                    </div>
                    {o.remainingPayment > 0 ? (
                      <WhatsAppReminderButton
                        phone={o.customerPhone}
                        customerName={o.customerName}
                        dressType={o.dressType}
                        deliveryDate={o.deliveryDate}
                        remainingPayment={o.remainingPayment}
                        totalAmount={o.totalAmount}
                        status={o.status}
                        kind="payment"
                        compact
                        className="w-full sm:w-auto"
                      />
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        </div>
      }
    >
      <OrdersListInner />
    </Suspense>
  );
}
