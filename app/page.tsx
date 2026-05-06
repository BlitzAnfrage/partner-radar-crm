import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionCard } from "@/components/ui/section-card";
import Link from "next/link";
import { getDataMode } from "@/lib/crm/config";
import { toSafeCrmError } from "@/lib/crm/errors";
import { listImportRuns } from "@/lib/crm/import-runs";
import { listLeads } from "@/lib/crm/repository";
import { countCallableLeads } from "@/lib/crm/call-queue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const result = await listLeads()
    .then((leads) => ({ leads, error: null }))
    .catch((error) => ({ leads: [], error: toSafeCrmError(error) }));
  const latestImport = await listImportRuns(1)
    .then((runs) => runs[0] ?? null)
    .catch(() => null);
  const leads = result.leads;
  const dataMode = getDataMode();
  const callTodayCount = countCallableLeads(leads);
  const newLeadsCount = leads.filter((lead) => lead.status === "NEW").length;
  const topRegions = Array.from(new Set(leads.map((lead) => lead.regionName || "Offen")))
    .map((region) => ({
      region,
      count: leads.filter((lead) => (lead.regionName || "Offen") === region).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Partner Radar CRM"
        eyebrow="Akquise Cockpit"
        action={
          <div className="flex flex-wrap gap-2">
            <QuickLink href="/crm">CRM öffnen</QuickLink>
            <QuickLink href="/lead-suche">Lead-Suche</QuickLink>
            <QuickLink href="/anrufmodus">Anrufmodus</QuickLink>
          </div>
        }
      />
      {result.error ? (
        <div className="mb-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-soft">
          {result.error}
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.72fr]">
        <section className="rounded-[2rem] border border-slate-200/70 bg-white/90 p-6 shadow-premium">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-500">Nächster bester Schritt</div>
              <div className="mt-3 text-7xl font-semibold tracking-tight text-slate-950">{callTodayCount}</div>
              <div className="mt-2 text-sm text-slate-500">anrufbare Leads in der Queue</div>
            </div>
            <StatusPill tone={callTodayCount ? "success" : "neutral"}>{callTodayCount ? "bereit" : "leer"}</StatusPill>
          </div>
          <Link
            href="/anrufmodus"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Anrufmodus starten
          </Link>
          <Link href="/crm?quality=AB&phone=present&status=NEW" className="ml-3 mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-200">
            CRM öffnen
          </Link>
        </section>
        <section className="rounded-[2rem] bg-[#0b0d12] p-6 text-white shadow-premium">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-white/45">Letzter Import</div>
              <div className="mt-3 text-4xl font-semibold tracking-tight">{latestImport?.status ?? "Keiner"}</div>
            </div>
            <StatusPill tone={latestImport?.status === "SUCCESS" ? "success" : "neutral"}>{dataMode}</StatusPill>
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
            {latestImport
              ? `${latestImport.leads_inserted} neu · ${latestImport.leads_updated} aktualisiert`
              : "Import-Bridge ist vorbereitet."}
          </div>
        </section>
      </div>

      <div className="mt-4">
        <DashboardGrid leads={leads} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.7fr]">
      <SectionCard title="Top Regionen" action={<Link href="/crm" className="text-sm font-semibold text-slate-500 transition hover:text-slate-950">Alle Leads</Link>}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {topRegions.length ? topRegions.map((item) => (
            <Link key={item.region} href={`/crm?region=${encodeURIComponent(item.region)}`} className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 transition hover:-translate-y-px hover:bg-white hover:shadow-soft">
              <div className="truncate font-medium text-slate-800">{item.region}</div>
              <div className="mt-1 text-sm text-slate-500">{item.count} Leads</div>
            </Link>
          )) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Noch keine Regionen.</div>
          )}
        </div>
      </SectionCard>
      <MetricCard label="Neue Leads" value={newLeadsCount} detail={`${leads.length} Leads gesamt`} />
      </div>
    </div>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-px hover:bg-white"
    >
      {children}
    </Link>
  );
}
