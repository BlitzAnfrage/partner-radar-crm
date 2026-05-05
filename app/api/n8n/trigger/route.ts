import { NextResponse } from "next/server";
import { createImportRun, updateImportRun } from "@/lib/crm/import-runs";
import { getN8nStatus } from "@/lib/n8n/trigger";

export async function POST() {
  const status = getN8nStatus();

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
        triggeredBy: "crm"
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
        secretHeaderName: "x-crm-import-secret"
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
