"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";

type Row = {
  id: string;
  name: string;
  phone: string;
  address: string;
  updatedAt?: string;
};

function CustomersListInner() {
  const searchParams = useSearchParams();
  const addedFlag = searchParams.get("added");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let debounceId: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        setLoading(true);
        fetch(`/api/customers?q=${encodeURIComponent(q)}`, { cache: "no-store" })
          .then((r) => r.json())
          .then((data) => {
            if (cancelled) return;
            setRows(
              (data as Row[]).map((c) => ({
                ...c,
                id: c.id,
              })),
            );
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      }, 300);
    };

    run();

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) run();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      if (debounceId) clearTimeout(debounceId);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [q, addedFlag]);

  const justAdded = addedFlag === "1";

  return (
    <div className="space-y-6">
      {justAdded ? (
        <p
          className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--foreground)]"
          role="status"
        >
          Customer saved — list updated below.
        </p>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Search and manage customer records</p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--on-accent)] active:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add customer
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="search"
          placeholder="Search name or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] outline-none ring-offset-[var(--background)] placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      <div className="surface overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No customers found.</p>
        ) : (
          <ul className="divide-y divide-[var(--card-border)]">
            {rows.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/customers/${c.id}`}
                  className="flex min-h-[3rem] flex-col gap-1 px-4 py-4 transition hover:bg-[var(--sidebar)] active:bg-[var(--sidebar)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-[var(--muted)]">{c.phone}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {c.updatedAt
                      ? `Updated ${new Date(c.updatedAt).toLocaleDateString("en-IN")}`
                      : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        </div>
      }
    >
      <CustomersListInner />
    </Suspense>
  );
}
