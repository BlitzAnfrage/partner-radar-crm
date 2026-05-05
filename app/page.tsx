import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { PageHeader } from "@/components/layout/page-header";
import { getDataMode } from "@/lib/crm/config";
import { toSafeCrmError } from "@/lib/crm/errors";
import { listImportRuns } from "@/lib/crm/import-runs";
import { listLeads } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await listLeads()
    .then((leads) => ({ leads, error: null }))
    .catch((error) => ({ leads: [], error: toSafeCrmError(error) }));
  const latestImport = await listImportRuns(1)
    .then((runs) => runs[0] ?? null)
    .catch(() => null);
  const leads = result.leads;
  const dataMode = getDataMode();

  return (
    <div>
      <PageHeader title="Partner Radar CRM" eyebrow="Home" />
      {result.error ? (
        <div className="mb-5 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-soft">
          {result.error}
        </div>
      ) : null}
      <DashboardGrid leads={leads} />
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[2rem] bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Top Regionen</h2>
          </div>
          <div className="space-y-3">
            {Array.from(new Set(leads.map((lead) => lead.regionName || "Offen")))
              .slice(0, 5)
              .map((region) => {
                const count = leads.filter((lead) => lead.regionName === region).length;
                return (
                  <div key={region} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="font-medium text-slate-800">{region}</span>
                    <span className="text-sm text-slate-500">{count}</span>
                  </div>
                );
              })}
          </div>
        </section>
        <section className="rounded-[2rem] bg-white p-6 shadow-soft lg:hidden">
          <div className="text-sm text-slate-500">Datenmodus</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{dataMode}</div>
        </section>
        <section className="rounded-[2rem] bg-[#101216] p-6 text-white shadow-soft">
          <div className="text-sm text-white/45">Letzter Import</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight">{latestImport?.status ?? "Keiner"}</div>
          <div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm text-white/65">
            {latestImport
              ? `${latestImport.leads_inserted} neu · ${latestImport.leads_updated} aktualisiert`
              : "n8n Import-Bridge ist vorbereitet."}
          </div>
        </section>
      </div>
    </div>
  );
}
