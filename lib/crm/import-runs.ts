import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ImportRunStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export type ImportRun = {
  id: string;
  source: string;
  status: ImportRunStatus;
  requested_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  leads_found: number;
  leads_inserted: number;
  leads_updated: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function createImportRun(input?: {
  source?: string;
  status?: ImportRunStatus;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("import_runs")
    .insert({
      source: input?.source ?? "n8n-osm",
      status: input?.status ?? "RUNNING",
      started_at: now,
      metadata: input?.metadata ?? {}
    })
    .select("*")
    .single();

  if (error) throw new Error(`Could not create import run: ${error.message}`);
  return data as ImportRun;
}

export async function updateImportRun(
  id: string,
  patch: Partial<
    Pick<
      ImportRun,
      | "status"
      | "started_at"
      | "finished_at"
      | "leads_found"
      | "leads_inserted"
      | "leads_updated"
      | "error_message"
      | "metadata"
    >
  >
) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("import_runs").update(patch).eq("id", id).select("*").single();

  if (error) throw new Error(`Could not update import run: ${error.message}`);
  return data as ImportRun;
}

export async function listImportRuns(limit = 5) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Could not load import runs: ${error.message}`);
  return (data ?? []) as ImportRun[];
}
