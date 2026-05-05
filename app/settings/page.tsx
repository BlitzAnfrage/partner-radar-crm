import { Database, KeyRound, Lock, ServerCog, ShieldCheck, Workflow } from "lucide-react";
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
      <div className="grid gap-4 xl:grid-cols-2">
        <StatusSection title="App">
          <StatusRow icon={<ServerCog />} label="Datenmodus" value={status.dataMode} ok={status.dataMode === "supabase"} />
          <StatusRow icon={<Workflow />} label="App URL" value={status.appUrlPresent ? "vorhanden" : "fehlt"} ok={status.appUrlPresent} />
        </StatusSection>
        <StatusSection title="Datenbank">
          <StatusRow icon={<Database />} label="Datenbankmodus" value={status.dataMode === "supabase" ? "aktiv" : "Mock-Fallback"} ok={status.dataMode === "supabase"} />
          <StatusRow icon={<Database />} label="Supabase URL" value={status.supabaseUrlPresent ? "vorhanden" : "fehlt"} ok={status.supabaseUrlPresent} />
          <StatusRow icon={<KeyRound />} label="Supabase Service Key" value={status.supabaseServiceRolePresent ? "vorhanden" : "fehlt"} ok={status.supabaseServiceRolePresent} />
        </StatusSection>
        <StatusSection title="Sicherheit">
          <StatusRow icon={<Lock />} label="Admin Gate" value={status.adminPasswordPrepared ? "vorbereitet" : "leer"} ok={status.adminPasswordPrepared} />
          <StatusRow icon={<ShieldCheck />} label="Private CRM" value={status.adminPasswordPrepared ? "geschützt" : "offen"} ok={status.adminPasswordPrepared} />
        </StatusSection>
        <StatusSection title="Integrationen">
          <StatusRow icon={<Workflow />} label="n8n Webhook URL" value={status.n8nWebhookUrlPresent ? "vorhanden" : "fehlt"} ok={status.n8nWebhookUrlPresent} />
          <StatusRow icon={<KeyRound />} label="n8n Import Secret" value={status.n8nWebhookSecretPresent ? "vorhanden" : "fehlt"} ok={status.n8nWebhookSecretPresent} />
        </StatusSection>
      </div>

      <N8nImportCard configured={status.n8nWebhookUrlPresent && status.n8nWebhookSecretPresent && status.appUrlPresent} lastStatus={latestImport?.status ?? "keiner"} />
    </div>
  );
}

function StatusSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-soft">
      <div className="mb-4 text-lg font-semibold tracking-tight text-slate-950">{title}</div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function StatusRow({
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
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded-xl bg-white p-2 text-slate-600 shadow-sm [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-500">{label}</div>
          <div className="truncate text-base font-semibold tracking-tight text-slate-950">{value}</div>
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {ok ? "bereit" : "offen"}
      </span>
    </div>
  );
}
