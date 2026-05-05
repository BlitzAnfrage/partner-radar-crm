"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, LogOut, Search, Settings } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/crm", label: "CRM", icon: BarChart3 },
  { href: "/lead-search", label: "Lead-Suche", icon: Search },
  { href: "/settings", label: "Einstellungen", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] lg:flex">
      <aside className="sticky top-0 z-30 border-b border-white/10 bg-[#0d0f14] text-white lg:h-screen lg:w-72 lg:border-b-0">
        <div className="px-4 py-4 lg:px-5 lg:py-6">
          <div className="mb-4 flex items-center justify-between lg:mb-10">
            <Link href="/" className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/40">
              <div className="text-lg font-semibold tracking-tight">Partner Radar</div>
              <div className="text-xs text-white/45">Private CRM</div>
            </Link>
            <form action="/api/auth/logout" method="post" className="lg:hidden">
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-white/55 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0" aria-label="Hauptnavigation">
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || (item.href === "/lead-search" && pathname === "/lead-suche");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-white/40 lg:px-4 lg:py-3",
                    active ? "bg-white text-[#101216] shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <form action="/api/auth/logout" method="post" className="hidden lg:block lg:pt-6">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/50 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </nav>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
