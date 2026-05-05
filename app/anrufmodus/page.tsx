import { CallingMode } from "@/components/calling/calling-mode";
import { PageHeader } from "@/components/layout/page-header";
import { toSafeCrmError } from "@/lib/crm/errors";
import { listLeads } from "@/lib/crm/repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CallingPage() {
  const result = await listLeads()
    .then((leads) => ({ leads, error: null }))
    .catch((error) => ({ leads: [], error: toSafeCrmError(error) }));

  return (
    <div>
      <PageHeader title="Anrufmodus" eyebrow="Akquise" />
      <CallingMode initialLeads={result.leads} loadError={result.error} />
    </div>
  );
}
