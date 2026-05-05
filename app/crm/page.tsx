import { CrmBoard } from "@/components/crm/crm-board";
import { PageHeader } from "@/components/layout/page-header";
import { getDataMode } from "@/lib/crm/config";
import { toSafeCrmError } from "@/lib/crm/errors";
import { listLeads } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";

export default async function CrmPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const dataMode = getDataMode();
  const result = await listLeads()
    .then((leads) => ({ leads, error: null }))
    .catch((error) => ({ leads: [], error: toSafeCrmError(error) }));

  return (
    <div>
      <PageHeader title="CRM" eyebrow="Leads" />
      <CrmBoard
        initialLeads={result.leads}
        initialFilters={searchParams}
        dataMode={dataMode}
        loadError={result.error}
      />
    </div>
  );
}
