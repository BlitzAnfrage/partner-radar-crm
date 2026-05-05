import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createImportRun, updateImportRun } from "@/lib/crm/import-runs";
import { verifyImportSecret } from "@/lib/imports/import-secret";
import {
  mapIncomingOsmLeads,
  toExistingLeadUpdate,
  type ImportedLeadRow,
  type IncomingOsmLead
} from "@/lib/crm/import-mapper";

export const dynamic = "force-dynamic";

type ImportRequestBody = {
  importRunId?: unknown;
  source?: unknown;
  leads?: unknown;
};

export async function POST(request: Request) {
  const auth = verifyImportSecret(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized", diagnostics: auth.diagnostics }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ImportRequestBody | null;
  if (!body || !Array.isArray(body.leads)) {
    return NextResponse.json({ error: "Invalid import payload" }, { status: 400 });
  }

  const source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : "n8n-osm";
  const providedImportRunId = typeof body.importRunId === "string" && body.importRunId.trim() ? body.importRunId.trim() : null;
  let importRunId = providedImportRunId;

  try {
    if (importRunId) {
      await updateImportRun(importRunId, {
        status: "RUNNING",
        started_at: new Date().toISOString(),
        metadata: { source }
      });
    } else {
      const run = await createImportRun({ source, status: "RUNNING", metadata: { source } });
      importRunId = run.id;
    }

    const { rows, skipped } = mapIncomingOsmLeads(body.leads as IncomingOsmLead[], importRunId);
    const result = await upsertImportedLeads(rows);

    await updateImportRun(importRunId, {
      status: "SUCCESS",
      leads_found: body.leads.length,
      leads_inserted: result.inserted,
      leads_updated: result.updated,
      finished_at: new Date().toISOString(),
      error_message: null,
      metadata: {
        source,
        skipped
      }
    });

    return NextResponse.json({
      ok: true,
      importRunId,
      leadsFound: body.leads.length,
      leadsInserted: result.inserted,
      leadsUpdated: result.updated,
      leadsSkipped: skipped
    });
  } catch (error) {
    if (importRunId) {
      await updateImportRun(importRunId, {
        status: "FAILED",
        leads_found: Array.isArray(body.leads) ? body.leads.length : 0,
        finished_at: new Date().toISOString(),
        error_message: safeError(error)
      }).catch(() => undefined);
    }

    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}

async function upsertImportedLeads(rows: ImportedLeadRow[]) {
  if (rows.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  const supabase = createSupabaseServerClient();
  const sourceIds = rows.map((row) => row.source_id);
  const { data: existing, error: existingError } = await supabase
    .from("leads")
    .select("source_id")
    .in("source_id", sourceIds);

  if (existingError) {
    throw new Error(`Could not check existing leads: ${existingError.message}`);
  }

  const existingSourceIds = new Set((existing ?? []).map((row) => row.source_id as string));
  const newRows = rows.filter((row) => !existingSourceIds.has(row.source_id));
  const existingRows = rows.filter((row) => existingSourceIds.has(row.source_id));

  if (newRows.length > 0) {
    const { error } = await supabase.from("leads").upsert(newRows, {
      onConflict: "source_id",
      ignoreDuplicates: false
    });

    if (error) {
      throw new Error(`Could not insert imported leads: ${error.message}`);
    }
  }

  await Promise.all(
    existingRows.map(async (row) => {
      const { error } = await supabase.from("leads").update(toExistingLeadUpdate(row)).eq("source_id", row.source_id);
      if (error) {
        throw new Error(`Could not update imported lead: ${error.message}`);
      }
    })
  );

  return {
    inserted: newRows.length,
    updated: existingRows.length
  };
}

function safeError(error: unknown) {
  return error instanceof Error && error.message.includes("Unauthorized")
    ? "Unauthorized"
    : "Import konnte nicht verarbeitet werden.";
}
