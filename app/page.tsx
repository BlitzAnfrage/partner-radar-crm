import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { PageHeader } from "@/components/layout/page-header";
import { StatusPill } from "@/components/ui/status-pill";
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
        eyebrow="Home"
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
      <DashboardGrid leads={leads} />
      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.72fr_0.72fr]">
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-500">Heute anrufen</div>
              <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">{callTodayCount}</div>
              <div className="mt-2 text-sm text-slate-500">Neue Leads mit Telefonnummer</div>
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
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-soft">
          <div className="text-sm font-medium text-slate-500">Neue Leads</div>
          <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{newLeadsCount}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill tone="neutral">Datenmodus: {dataMode}</StatusPill>
            <StatusPill tone={leads.length ? "success" : "warning"}>{leads.length} gesamt</StatusPill>
          </div>
        </section>
        <section className="rounded-[2rem] bg-[#0d0f14] p-6 text-white shadow-soft">
          <div className="text-sm text-white/45">Letzter Import</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight">{latestImport?.status ?? "Keiner"}</div>
          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-white/65">
            {latestImport
              ? `${latestImport.leads_inserted} neu · ${latestImport.leads_updated} aktualisiert`
              : "Import-Bridge ist vorbereitet."}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Top Regionen</h2>
          <Link href="/crm" className="text-sm font-semibold text-slate-500 transition hover:text-slate-950">Alle Leads</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {topRegions.length ? topRegions.map((item) => (
            <Link key={item.region} href={`/crm?region=${encodeURIComponent(item.region)}`} className="rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
              <div className="truncate font-medium text-slate-800">{item.region}</div>
              <div className="mt-1 text-sm text-slate-500">{item.count} Leads</div>
            </Link>
          )) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Noch keine Regionen.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-slate-700 shadow-soft transition hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}
