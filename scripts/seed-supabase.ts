import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { mockLeads } from "../data/mock-leads";
import type { ChainHint, Lead, LeadQuality, LeadStatus } from "../types/crm";

type LeadSeedRow = {
  source_id: string;
  company_name: string;
  region_name: string | null;
  category_group: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  emails: string[];
  website: string | null;
  maps_url: string | null;
  google_search_url: string | null;
  phone_search_url: string | null;
  contact_person: string | null;
  opening_hours: string | null;
  lat: number | null;
  lon: number | null;
  score: number;
  lead_quality_code: LeadQuality | null;
  lead_quality_label: string | null;
  chain_hint: ChainHint;
  status: LeadStatus;
  last_contacted_at: string | null;
  last_contact_result: string | null;
  contact_count: number;
  call_note: string | null;
  appointment_at: string | null;
  appointment_note: string | null;
  internal_notes: string | null;
  raw_payload: Record<string, unknown>;
};

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1).replace(/^["']|["']$/g, "");
    process.env[key] ||= value;
  }
}

function normalizeChainHint(value: string): ChainHint {
  if (value === "CHAIN" || value === "BRANCH") return value;
  return "LOCAL";
}

function normalizeStatus(value: string): LeadStatus {
  const allowed: LeadStatus[] = [
    "NEW",
    "CALLED",
    "NOT_REACHED",
    "INTERESTED",
    "APPOINTMENT",
    "PARTNER",
    "REJECTED",
    "NOT_FIT",
    "BLACKLIST"
  ];

  return allowed.includes(value as LeadStatus) ? (value as LeadStatus) : "NEW";
}

async function main() {
  loadEnvLocal();

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const rows = mockLeads.map(mapMockLeadToSeedRow);

  const { error } = await supabase.from("leads").upsert(rows, {
    onConflict: "source_id",
    ignoreDuplicates: false
  });

  if (error) {
    throw new Error(`Seed failed: ${error.message}`);
  }

  console.log(`Seeded ${rows.length} mock leads into public.leads.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exit(1);
});

function mapMockLeadToSeedRow(lead: Lead): LeadSeedRow {
  return {
    source_id: lead.sourceId,
    company_name: lead.companyName,
    region_name: lead.regionName || null,
    category_group: lead.categoryGroup || null,
    category: lead.category || null,
    address: lead.address || null,
    phone: lead.phone || null,
    emails: lead.emails,
    website: lead.website || null,
    maps_url: lead.mapsUrl || null,
    google_search_url: lead.googleSearchUrl || null,
    phone_search_url: lead.phoneSearchUrl || null,
    contact_person: lead.contactPerson || null,
    opening_hours: lead.openingHours || null,
    lat: lead.lat,
    lon: lead.lon,
    score: lead.score,
    lead_quality_code: normalizeLeadQuality(lead.leadQuality),
    lead_quality_label: lead.leadQualityLabel || null,
    chain_hint: normalizeChainHint(lead.chainHint),
    status: normalizeStatus(lead.status),
    last_contacted_at: lead.lastContactedAt,
    last_contact_result: lead.lastContactResult || null,
    contact_count: lead.contactCount,
    call_note: lead.callNote || null,
    appointment_at: lead.appointmentAt,
    appointment_note: lead.appointmentNote || null,
    internal_notes: lead.internalNotes || null,
    raw_payload: {
      seed: "mock-leads"
    }
  };
}

function normalizeLeadQuality(value: string): LeadQuality | null {
  if (value === "A" || value === "B" || value === "C" || value === "D") return value;
  return null;
}
