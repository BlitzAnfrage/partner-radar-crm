import { Database, KeyRound, Lock, ServerCog, Workflow } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { N8nImportCard } from "@/components/settings/n8n-import-card";
import { getPublicConfigStatus } from "@/lib/crm/config";
import { listImportRuns } from "@/lib/crm/import-runs";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const status = getPublicConfigStatus();
  const latestImport = await listImportRuns(1)
    .then((runs) => runs[0] ?? null)
    .catch(() => null);

  return (
    <div>
      <PageHeader title="Einstellungen" eyebrow="System" />
      <div className="grid gap-4 lg:grid-cols-2">
        <StatusCard icon={<ServerCog />} label="CRM_DATA_MODE" value={status.dataMode} ok={status.dataMode === "supabase"} />
        <StatusCard icon={<Database />} label="Database Mode" value={status.dataMode === "supabase" ? "aktiv" : "mock fallback"} ok={status.dataMode === "supabase"} />
        <StatusCard icon={<Database />} label="Supabase URL present" value={status.supabaseUrlPresent ? "yes" : "no"} ok={status.supabaseUrlPresent} />
        <StatusCard icon={<KeyRound />} label="Supabase service key present" value={status.supabaseServiceRolePresent ? "yes" : "no"} ok={status.supabaseServiceRolePresent} />
        <StatusCard icon={<Workflow />} label="n8n URL present" value={status.n8nWebhookUrlPresent ? "yes" : "no"} ok={status.n8nWebhookUrlPresent} />
        <StatusCard icon={<Workflow />} label="App URL present" value={status.appUrlPresent ? "yes" : "no"} ok={status.appUrlPresent} />
        <StatusCard icon={<Lock />} label="Admin Gate" value={status.adminPasswordPrepared ? "vorbereitet" : "leer"} ok={status.adminPasswordPrepared} />
        <StatusCard icon={<KeyRound />} label="n8n secret present" value={status.n8nWebhookSecretPresent ? "yes" : "no"} ok={status.n8nWebhookSecretPresent} />
      </div>

      <N8nImportCard configured={status.n8nWebhookUrlPresent && status.n8nWebhookSecretPresent && status.appUrlPresent} lastStatus={latestImport?.status ?? "keiner"} />
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  ok
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-soft">
      <div className="mb-6 flex items-center justify-between">
        <span className="rounded-2xl bg-slate-100 p-3 text-slate-700 [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {ok ? "bereit" : "offen"}
        </span>
      </div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
    </section>
  );
}
