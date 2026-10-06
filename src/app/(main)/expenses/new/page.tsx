"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { sanitizeDecimalString } from "@/lib/numeric-input";
import { useRunWithTopProgress } from "@/hooks/use-run-with-top-progress";

const categories = [
  "Electricity Bill",
  "Water Bill",
  "Shop Rent",
  "Material Cost",
  "Salary",
  "Miscellaneous",
] as const;

export default function NewExpensePage() {
  const router = useRouter();
  const runWithTopProgress = useRunWithTopProgress();
  const [category, setCategory] = useState<(typeof categories)[number]>("Miscellaneous");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const n = Number(amount);
      if (Number.isNaN(n) || n <= 0) {
        setError("Enter a valid amount.");
        return;
      }
      await runWithTopProgress(async () => {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, amount: n, description, date }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Save failed");
          return;
        }
        router.replace("/expenses");
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
          href="/expenses"
          className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
        >
          ← All expenses
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New expense</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Record a business expense</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="surface space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof categories)[number])}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Amount (₹) *</label>
          <input
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(sanitizeDecimalString(e.target.value))}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Date *</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
          {loading ? "Saving…" : "Save expense"}
        </button>
      </form>
    </div>
  );
}
