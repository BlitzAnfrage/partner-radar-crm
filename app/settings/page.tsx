import { Database, KeyRound, Lock, ServerCog, Workflow } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { N8nImportCard } from "@/components/settings/n8n-import-card";
import { getPublicConfigStatus } from "@/lib/crm/config";
import { listImportRuns } from "@/lib/crm/import-runs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  const status = getPublicConfigStatus();
  const latestImport = await listImportRuns(1)
    .then((runs) => runs[0] ?? null)
    .catch(() => null);

  return (
    <div>
      <PageHeader title="Einstellungen" eyebrow="System" />
      <div className="grid gap-4 lg:grid-cols-2">
        <StatusCard icon={<ServerCog />} label="Datenmodus" value={status.dataMode} ok={status.dataMode === "supabase"} />
        <StatusCard icon={<Database />} label="Datenbankmodus" value={status.dataMode === "supabase" ? "aktiv" : "Mock-Fallback"} ok={status.dataMode === "supabase"} />
        <StatusCard icon={<Database />} label="Supabase URL" value={status.supabaseUrlPresent ? "vorhanden" : "fehlt"} ok={status.supabaseUrlPresent} />
        <StatusCard icon={<KeyRound />} label="Supabase Service Key" value={status.supabaseServiceRolePresent ? "vorhanden" : "fehlt"} ok={status.supabaseServiceRolePresent} />
        <StatusCard icon={<Workflow />} label="n8n Webhook URL" value={status.n8nWebhookUrlPresent ? "vorhanden" : "fehlt"} ok={status.n8nWebhookUrlPresent} />
        <StatusCard icon={<Workflow />} label="App URL" value={status.appUrlPresent ? "vorhanden" : "fehlt"} ok={status.appUrlPresent} />
        <StatusCard icon={<Lock />} label="Admin Gate" value={status.adminPasswordPrepared ? "vorbereitet" : "leer"} ok={status.adminPasswordPrepared} />
        <StatusCard icon={<KeyRound />} label="n8n Import Secret" value={status.n8nWebhookSecretPresent ? "vorhanden" : "fehlt"} ok={status.n8nWebhookSecretPresent} />
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
