import { NextResponse } from "next/server";
import { createImportRun, updateImportRun } from "@/lib/crm/import-runs";
import { getN8nStatus } from "@/lib/n8n/trigger";

type TriggerBody = {
  search?: {
    region?: unknown;
    categories?: unknown;
    quality?: unknown;
    maxLeads?: unknown;
    excludeChains?: unknown;
    phoneOnly?: unknown;
    testMode?: unknown;
  };
};

export async function POST(request: Request) {
  const status = getN8nStatus();
  const body = (await request.json().catch(() => ({}))) as TriggerBody;
  const search = normalizeSearch(body.search);

  if (!status.configured) {
    return NextResponse.json({
      ok: true,
      configured: false,
      message: "n8n ist noch nicht konfiguriert. Setze N8N_WEBHOOK_URL und N8N_WEBHOOK_SECRET."
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
        search
      }
    });
    importRunId = run.id;

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/imports/osm-leads`;
    const response = await fetch(process.env.N8N_WEBHOOK_URL as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-crm-import-secret": process.env.N8N_WEBHOOK_SECRET as string
      },
      body: JSON.stringify({
        importRunId,
        callbackUrl,
        source: "crm",
        mode: "osm_supabase_import",
        secretHeaderName: "x-crm-import-secret",
        search
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
        error_message: error instanceof Error ? error.message : "n8n trigger failed"
      }).catch(() => undefined);
    }

    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: error instanceof Error ? error.message : "n8n trigger failed"
      },
      { status: 500 }
    );
  }
}

function normalizeSearch(search: TriggerBody["search"]) {
  const categories = Array.isArray(search?.categories)
    ? search.categories.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const maxLeads = typeof search?.maxLeads === "number" ? search.maxLeads : Number(search?.maxLeads ?? 50);

  return {
    region: typeof search?.region === "string" && search.region.trim() ? search.region.trim() : "Saarbrücken",
    categories,
    quality: typeof search?.quality === "string" && search.quality.trim() ? search.quality.trim() : "A",
    maxLeads: Number.isFinite(maxLeads) ? Math.max(1, Math.min(500, Math.round(maxLeads))) : 50,
    excludeChains: Boolean(search?.excludeChains),
    phoneOnly: Boolean(search?.phoneOnly),
    testMode: search?.testMode !== false
  };
}
