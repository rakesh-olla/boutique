"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Row = {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
};

function monthNow() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

export default function ExpensesPage() {
  const [month, setMonth] = useState(monthNow);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      setLoading(true);
      fetch(`/api/expenses?month=${encodeURIComponent(month)}`, { cache: "no-store" })
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
  }, [month]);

  async function removeExpense(expenseId: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    setRows((r) => r.filter((x) => x.id !== expenseId));
  }

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Track shop costs by month</p>
        </div>
        <Link
          href="/expenses/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--on-accent)]"
        >
          <Plus className="h-4 w-4" />
          Add expense
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <span className="text-sm text-[var(--muted)]">
          Total:{" "}
          <strong className="text-[var(--foreground)] tabular-nums">₹{total}</strong>
        </span>
      </div>

      <div className="surface overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No expenses this month.</p>
        ) : (
          <ul className="divide-y divide-[var(--card-border)]">
            {rows.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/expenses/${e.id}`}
                    className="font-medium hover:underline"
                  >
                    {e.category}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">
                    {e.description || "—"} ·{" "}
                    {new Date(e.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">₹{e.amount}</span>
                  <Link
                    href={`/expenses/${e.id}`}
                    className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-sm hover:bg-[var(--sidebar)]"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeExpense(e.id)}
                    className="rounded-lg border border-[var(--card-border)] p-2 text-[var(--danger)] hover:bg-red-500/10"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
