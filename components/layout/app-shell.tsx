"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, LogOut, Settings } from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/crm", label: "CRM", icon: BarChart3 },
  { href: "/settings", label: "Einstellungen", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] lg:flex">
      <aside className="sticky top-0 z-30 border-b border-white/10 bg-[#101216] text-white lg:h-screen lg:w-72 lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:px-6 lg:py-7">
          <div>
            <div className="text-lg font-semibold tracking-tight">Partner Radar</div>
            <div className="text-xs text-white/45">CRM Saarland</div>
          </div>
          <nav className="flex gap-1 lg:mt-10 lg:block lg:space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition lg:px-4",
                    active ? "bg-white text-[#101216]" : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <form action="/api/auth/logout" method="post" className="lg:pt-6">
              <button
                type="submit"
                className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-white/55 transition hover:bg-white/10 hover:text-white lg:w-full lg:px-4"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </nav>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
