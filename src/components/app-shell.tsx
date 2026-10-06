"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Wallet,
  BarChart3,
  Menu,
  LogOut,
  X,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function AppShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const NavLinks = (
    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-[var(--accent)] text-[var(--on-accent)]"
                : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-[var(--background)]">
      <aside className="hidden h-full min-h-0 w-60 shrink-0 flex-col overflow-hidden border-r border-[var(--card-border)] bg-[var(--sidebar)] p-4 md:flex">
        <div className="mb-4 shrink-0 px-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Boutique
          </p>
          <p className="truncate text-sm font-semibold">{email ?? "Admin"}</p>
        </div>
        {NavLinks}
        <div className="mt-auto shrink-0 space-y-2 border-t border-[var(--card-border)]/60 pt-4">
          <div className="flex items-center gap-2 px-2">
            <ThemeToggle />
            <span className="text-xs text-[var(--muted)]">Theme</span>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--danger)] hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-dvh max-h-dvh w-[min(85vw,280px)] flex-col overflow-hidden border-r border-[var(--card-border)] bg-[var(--sidebar)] p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))] text-[var(--foreground)] shadow-xl">
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[var(--accent)] text-[var(--on-accent)]"
                        : "text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto shrink-0 space-y-3 border-t border-[var(--card-border)]/60 pt-4">
              <button
                type="button"
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--danger)]"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--card-border)] bg-[var(--background)]/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-2 text-[var(--foreground)] hover:bg-[var(--sidebar)]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate font-semibold">Boutique</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="scroll-main min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:p-8 md:pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
          {children}
        </main>
      </div>
    </div>
  );
}
