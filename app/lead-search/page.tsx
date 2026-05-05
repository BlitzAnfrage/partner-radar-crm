import { LeadSearchForm } from "@/components/lead-search/lead-search-form";
import { PageHeader } from "@/components/layout/page-header";
import { getN8nStatus } from "@/lib/n8n/trigger";

export const dynamic = "force-dynamic";

export default function LeadSearchPage() {
  const n8nStatus = getN8nStatus();

  return (
    <div>
      <PageHeader title="Lead-Suche" eyebrow="n8n" />
      <LeadSearchForm configured={n8nStatus.configured} />
    </div>
  );
}
