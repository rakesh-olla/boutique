"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  IndianRupee,
  Package,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

type Stats = {
  totalOrders: number;
  pendingPayments: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  profit: number;
  deliveredThisMonth: number;
  upcomingDeliveries: Array<{
    id?: string;
    dressType: string;
    deliveryDate: string;
    status: string;
    customerId?: string;
  }>;
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stats/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setStats)
      .catch(() => setError("Could not load dashboard. Check MongoDB connection."));
  }, []);

  if (error) {
    return <p className="text-sm text-[var(--danger)]">{error}</p>;
  }

  if (!stats) {
    return <p className="text-[var(--muted)]">Loading…</p>;
  }

  const cards = [
    {
      title: "Total Orders",
      value: String(stats.totalOrders),
      icon: Package,
      hint: "All time",
    },
    {
      title: "Pending Payments",
      value: fmt(stats.pendingPayments),
      icon: Wallet,
      hint: "Outstanding balance",
    },
    {
      title: "Monthly Income",
      value: fmt(stats.monthlyIncome),
      icon: TrendingUp,
      hint: "Delivered this month",
    },
    {
      title: "Expenses (month)",
      value: fmt(stats.monthlyExpenses),
      icon: TrendingDown,
      hint: "This calendar month",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Overview of your boutique</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, icon: Icon, hint }) => (
          <div key={title} className="surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--muted)]">{title}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
              </div>
              <div className="rounded-lg bg-[var(--sidebar)] p-2">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-[var(--success)]" />
            <h2 className="font-semibold">Profit (this month)</h2>
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums">{fmt(stats.profit)}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Income from delivered orders minus expenses (same month).
          </p>
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            <h2 className="font-semibold">Upcoming deliveries</h2>
          </div>
          {stats.upcomingDeliveries.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">No deliveries in the next 2 weeks.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.upcomingDeliveries.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{d.dressType}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Date(d.deliveryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {d.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
