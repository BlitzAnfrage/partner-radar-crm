import { mockLeads } from "@/data/mock-leads";
import type { Lead, LeadPatch } from "@/types/crm";
import type { SupabaseLeadRow, SupabaseLeadUpdate } from "@/types/supabase";
import { mapSupabaseLead } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDataMode } from "./config";

const contactRelevantStatuses = new Set([
  "CALLED",
  "NOT_REACHED",
  "INTERESTED",
  "APPOINTMENT",
  "PARTNER",
  "REJECTED"
]);

export async function listLeads(): Promise<Lead[]> {
  if (getDataMode() === "supabase") {
    return listSupabaseLeads();
  }

  return mockLeads;
}

export async function updateLead(id: string, patch: LeadPatch): Promise<Lead | null> {
  if (getDataMode() === "supabase") {
    return updateSupabaseLead(id, patch);
  }

  const lead = mockLeads.find((item) => item.id === id);
  if (!lead) return null;

  return {
    ...lead,
    ...patch,
    updatedAt: patch.updatedAt ?? new Date().toISOString()
  };
}

async function listSupabaseLeads(): Promise<Lead[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("lead_quality_code", { ascending: true, nullsFirst: false })
    .order("score", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load Supabase leads: ${error.message}`);
  }

  return ((data ?? []) as SupabaseLeadRow[]).map(mapSupabaseLead);
}

async function updateSupabaseLead(id: string, patch: LeadPatch): Promise<Lead | null> {
  const supabase = createSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (existingError) {
    if (existingError.code === "PGRST116") return null;
    throw new Error(`Could not load Supabase lead: ${existingError.message}`);
  }

  const row = existing as SupabaseLeadRow;
  const statusChanged = Boolean(patch.status && patch.status !== row.status);
  const contactRelevant = Boolean(patch.status && contactRelevantStatuses.has(patch.status));
  const now = new Date().toISOString();
  const update: SupabaseLeadUpdate = {};

  if (patch.status) update.status = patch.status;
  if ("callNote" in patch) update.call_note = patch.callNote ?? "";
  if ("appointmentAt" in patch) update.appointment_at = patch.appointmentAt ?? null;
  if ("appointmentNote" in patch) update.appointment_note = patch.appointmentNote ?? "";
  if ("internalNotes" in patch) update.internal_notes = patch.internalNotes ?? "";

  if (statusChanged && contactRelevant) {
    update.contact_count = (row.contact_count ?? 0) + 1;
    update.last_contacted_at = now;
    update.last_contact_result = patch.status ?? row.status;
  } else if ("lastContactedAt" in patch) {
    update.last_contacted_at = patch.lastContactedAt;
  }

  const { data: updated, error: updateError } = await supabase
    .from("leads")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(`Could not update Supabase lead: ${updateError.message}`);
  }

  const contactType = getContactType(patch, statusChanged);
  if (contactType) {
    const { error: logError } = await supabase.from("contact_logs").insert({
      lead_id: id,
      contact_type: contactType,
      result: patch.status ?? "NOTE",
      note: buildContactNote(patch),
      contacted_at: contactRelevant ? now : new Date().toISOString()
    });

    if (logError) {
      throw new Error(`Lead updated but contact log failed: ${logError.message}`);
    }
  }

  return mapSupabaseLead(updated as SupabaseLeadRow);
}

function getContactType(patch: LeadPatch, statusChanged: boolean) {
  if (statusChanged) {
    if (patch.status === "APPOINTMENT") return "APPOINTMENT";
    if (patch.status && ["CALLED", "NOT_REACHED", "INTERESTED", "REJECTED"].includes(patch.status)) return "CALL";
    if (patch.status && ["PARTNER"].includes(patch.status)) return "NOTE";
  }

  if ("callNote" in patch || "appointmentNote" in patch || "internalNotes" in patch || "appointmentAt" in patch) {
    return "NOTE";
  }

  return null;
}

function buildContactNote(patch: LeadPatch) {
  return [patch.callNote, patch.appointmentNote, patch.internalNotes].filter(Boolean).join("\n\n") || null;
}
