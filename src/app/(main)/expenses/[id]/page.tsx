"use client";



import Link from "next/link";

import { useParams } from "next/navigation";

import { useEffect, useState } from "react";

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



export default function EditExpensePage() {

  const params = useParams();

  const id = params.id as string;



  const [category, setCategory] = useState<(typeof categories)[number]>("Miscellaneous");

  const [amount, setAmount] = useState("");

  const [description, setDescription] = useState("");

  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [savedHint, setSavedHint] = useState(false);



  const runWithTopProgress = useRunWithTopProgress();
  useEffect(() => {

    fetch(`/api/expenses/${id}`)

      .then((r) => {

        if (!r.ok) throw new Error("Not found");

        return r.json();

      })

      .then((e) => {
        const cat = categories.find((c) => c === e.category);
        setCategory(cat ?? "Miscellaneous");

        setAmount(String(e.amount ?? ""));

        setDescription(e.description ?? "");

        setDate(e.date ?? "");

      })

      .catch(() => setError("Could not load expense"))

      .finally(() => setLoading(false));

  }, [id]);



  async function onSubmit(ev: React.FormEvent) {

    ev.preventDefault();

    setError("");

    setSaving(true);

    try {

      const n = Number(amount);

      if (Number.isNaN(n) || n <= 0) {

        setError("Enter a valid amount.");

        return;

      }

      await runWithTopProgress(async () => {

      const res = await fetch(`/api/expenses/${id}`, {

        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          category,

          amount: n,

          description,

          date,

        }),

      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {

        setError(typeof data.error === "string" ? data.error : "Save failed");

        return;

      }

      const fresh = await fetch(`/api/expenses/${id}`, { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error("reload");
        return r.json();
      });
      const cat2 = categories.find((c) => c === fresh.category);
      setCategory(cat2 ?? "Miscellaneous");
      setAmount(String(fresh.amount ?? ""));
      setDescription(fresh.description ?? "");
      setDate(fresh.date ?? "");
      setSavedHint(true);
      window.setTimeout(() => setSavedHint(false), 2800);

      });

    } finally {

      setSaving(false);

    }

  }



  if (loading) return <p className="text-[var(--muted)]">Loading…</p>;

  if (error && !date) return <p className="text-[var(--danger)]">{error}</p>;



  return (

    <div className="mx-auto max-w-lg space-y-6">

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-semibold tracking-tight">Edit expense</h1>

          <p className="mt-1 text-sm text-[var(--muted)]">Update category, amount, or date</p>

        </div>

        <Link

          href="/expenses"

          className="text-sm font-medium text-[var(--muted)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"

        >

          ← All expenses

        </Link>

      </div>

      {savedHint ? (

        <p

          className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--foreground)]"

          role="status"

        >

          Changes saved.

        </p>

      ) : null}

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

          disabled={saving}

          className="flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--on-accent)] disabled:opacity-60"

        >

          {saving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}

          {saving ? "Saving…" : "Save changes"}

        </button>

      </form>

    </div>

  );

}


