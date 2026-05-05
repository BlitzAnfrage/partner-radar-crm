import { LeadSearchForm } from "@/components/lead-search/lead-search-form";
import { PageHeader } from "@/components/layout/page-header";
import { listImportRuns } from "@/lib/crm/import-runs";
import { getN8nStatus } from "@/lib/n8n/trigger";

export const dynamic = "force-dynamic";

export default async function LeadSearchPage() {
  const n8nStatus = getN8nStatus();
  const importRuns = await listImportRuns(6).catch(() => []);

  return (
    <div>
      <PageHeader title="Lead-Suche" eyebrow="n8n" />
      <LeadSearchForm configured={n8nStatus.configured} importRuns={importRuns} />
    </div>
  );
}
