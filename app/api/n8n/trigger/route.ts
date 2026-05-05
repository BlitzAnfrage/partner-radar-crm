import { NextResponse } from "next/server";
import { createImportRun, updateImportRun } from "@/lib/crm/import-runs";
import { getN8nStatus } from "@/lib/n8n/trigger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TriggerBody = {
  searchConfig?: {
    region?: unknown;
    regionGroup?: unknown;
    country?: unknown;
    categories?: unknown;
    qualities?: unknown;
    quality?: unknown;
    maxLeadsPerRun?: unknown;
    maxJobsPerRun?: unknown;
    maxLeads?: unknown;
    maxSearchJobs?: unknown;
    onlyHighQuality?: unknown;
    onlyWithPhone?: unknown;
    enableWebsiteLookup?: unknown;
    enableImpressumLookup?: unknown;
    excludeChains?: unknown;
    phoneOnly?: unknown;
    testMode?: unknown;
    freeMode?: unknown;
    duplicateMode?: unknown;
  };
  search?: TriggerBody["searchConfig"];
};

export async function POST(request: Request) {
  const status = getN8nStatus();
  const body = (await request.json().catch(() => ({}))) as TriggerBody;
  const searchConfig = normalizeSearchConfig(body.searchConfig ?? body.search);

  if (!status.configured) {
    return NextResponse.json({
      ok: true,
      configured: false,
      message: "n8n ist noch nicht vollständig konfiguriert. Prüfe URL, Secret und App-URL."
    });
  }

  let importRunId: string | null = null;

  try {
    const run = await createImportRun({
      source: "crm",
      status: "RUNNING",
      metadata: {
        mode: "osm_supabase_import",
        triggeredBy: "crm",
        searchConfig
      }
    });
    importRunId = run.id;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim();
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim();

    if (!appUrl || !webhookUrl || !webhookSecret) {
      throw new Error("n8n trigger configuration is incomplete");
    }

    const callbackUrl = `${appUrl.replace(/\/$/, "")}/api/imports/osm-leads`;
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-crm-import-secret": webhookSecret
      },
      body: JSON.stringify({
        importRunId,
        callbackUrl,
        source: "crm",
        mode: "osm_supabase_import",
        secretHeaderName: "x-crm-import-secret",
        searchConfig
      })
    });

    if (!response.ok) {
      throw new Error(`n8n trigger failed with status ${response.status}`);
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      importRunId,
      message: "n8n Lead-Suche wurde gestartet."
    });
  } catch (error) {
    if (importRunId) {
      await updateImportRun(importRunId, {
        status: "FAILED",
        finished_at: new Date().toISOString(),
        error_message: safeTriggerError(error)
      }).catch(() => undefined);
    }

    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: safeTriggerError(error)
      },
      { status: 500 }
    );
  }
}

function normalizeSearchConfig(searchConfig: TriggerBody["searchConfig"]) {
  const categories = Array.isArray(searchConfig?.categories)
    ? searchConfig.categories.filter((item) => typeof item === "object" && item !== null)
    : [];
  const rawMaxLeads = searchConfig?.maxLeadsPerRun ?? searchConfig?.maxLeads;
  const rawMaxJobs = searchConfig?.maxJobsPerRun ?? searchConfig?.maxSearchJobs;
  const maxLeads = typeof rawMaxLeads === "number" ? rawMaxLeads : Number(rawMaxLeads ?? 30);
  const maxSearchJobs =
    typeof rawMaxJobs === "number" ? rawMaxJobs : Number(rawMaxJobs ?? 3);
  const qualities = Array.isArray(searchConfig?.qualities)
    ? searchConfig.qualities.filter((item): item is string => typeof item === "string" && ["A", "B", "C", "D"].includes(item))
    : typeof searchConfig?.quality === "string" && ["A", "B", "C", "D"].includes(searchConfig.quality)
      ? [searchConfig.quality]
      : ["A", "B"];

  return {
    region: typeof searchConfig?.region === "string" && searchConfig.region.trim() ? searchConfig.region.trim() : "Saarbrücken",
    regionGroup: typeof searchConfig?.regionGroup === "string" ? searchConfig.regionGroup : "saarland",
    country: typeof searchConfig?.country === "string" ? searchConfig.country : "DE",
    categories,
    qualities,
    quality: qualities[0] ?? "A",
    maxLeadsPerRun: Number.isFinite(maxLeads) ? Math.max(1, Math.min(500, Math.round(maxLeads))) : 30,
    maxJobsPerRun: Number.isFinite(maxSearchJobs) ? Math.max(1, Math.min(20, Math.round(maxSearchJobs))) : 3,
    onlyHighQuality: searchConfig?.onlyHighQuality !== false,
    onlyWithPhone: searchConfig?.onlyWithPhone !== false && searchConfig?.phoneOnly !== false,
    enableWebsiteLookup: searchConfig?.enableWebsiteLookup !== false,
    enableImpressumLookup: searchConfig?.enableImpressumLookup !== false,
    excludeChains: Boolean(searchConfig?.excludeChains),
    phoneOnly: searchConfig?.phoneOnly !== false,
    testMode: searchConfig?.testMode !== false,
    freeMode: searchConfig?.freeMode !== false,
    duplicateMode: "ignore_existing"
  };
}

function safeTriggerError(error: unknown) {
  if (error instanceof Error && error.message.includes("status")) return error.message;
  return "n8n Lead-Suche konnte nicht gestartet werden.";
}
