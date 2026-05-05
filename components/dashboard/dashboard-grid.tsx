import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, Phone, PhoneOff, Star, Store, Trophy, Users } from "lucide-react";
import type { Lead } from "@/types/crm";

function dashboardStats(leads: Lead[]) {
  return [
    { label: "Leads gesamt", value: leads.length, href: "/crm", icon: Building2 },
    { label: "A-Leads", value: leads.filter((lead) => lead.leadQuality === "A").length, href: "/crm?quality=A", icon: Star },
    { label: "Mit Telefonnummer", value: leads.filter((lead) => lead.phone).length, href: "/crm?phone=present", icon: Phone },
    { label: "Ohne Telefonnummer", value: leads.filter((lead) => !lead.phone).length, href: "/crm?phone=missing", icon: PhoneOff },
    { label: "Interessiert", value: leads.filter((lead) => lead.status === "INTERESTED").length, href: "/crm?status=INTERESTED", icon: Trophy },
    { label: "Termine", value: leads.filter((lead) => lead.status === "APPOINTMENT").length, href: "/crm?status=APPOINTMENT", icon: CalendarDays },
    { label: "Partner", value: leads.filter((lead) => lead.status === "PARTNER").length, href: "/crm?status=PARTNER", icon: Users },
    { label: "Ketten/Filialen", value: leads.filter((lead) => lead.chainHint !== "LOCAL").length, href: "/crm?chain=BRANCH", icon: Store }
  ];
}

export function DashboardGrid({ leads }: { leads: Lead[] }) {
  const stats = dashboardStats(leads);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-200"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-950" />
            </div>
            <div className="text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</div>
            <div className="mt-2 text-sm font-medium text-slate-500">{stat.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
