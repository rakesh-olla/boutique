"use client";

import { useEffect, useState } from "react";

function monthNow() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

type Summary = {
  month: string;
  income: number;
  expenses: number;
  profit: number;
  pendingPayments: number;
  pendingOrdersCount: number;
  deliveredCount: number;
  expensesByCategory: Record<string, number>;
};

export default function ReportsPage() {
  const [month, setMonth] = useState(monthNow);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/summary?month=${encodeURIComponent(month)}`)
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Could not load report"))
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Income, expenses, profit & pending payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {loading || !data ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface p-6">
            <h2 className="font-semibold">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Income (delivered)</dt>
                <dd className="font-medium tabular-nums">₹{data.income}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Expenses</dt>
                <dd className="font-medium tabular-nums">₹{data.expenses}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-[var(--card-border)] pt-3">
                <dt className="font-medium">Profit</dt>
                <dd className="font-semibold tabular-nums text-[var(--success)]">
                  ₹{data.profit}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Orders delivered (month)</dt>
                <dd className="tabular-nums">{data.deliveredCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--muted)]">Pending payments (all open orders)</dt>
                <dd className="tabular-nums text-amber-600 dark:text-amber-400">
                  ₹{data.pendingPayments} ({data.pendingOrdersCount} orders)
                </dd>
              </div>
            </dl>
          </div>
          <div className="surface p-6">
            <h2 className="font-semibold">Expenses by category</h2>
            {Object.keys(data.expensesByCategory).length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">No expenses this month.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {Object.entries(data.expensesByCategory).map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-4">
                    <span className="text-[var(--muted)]">{k}</span>
                    <span className="tabular-nums">₹{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
