import type { ChainHint, Lead, LeadQuality, LeadStatus } from "@/types/crm";

export type SupabaseLeadRow = {
  id: string;
  import_run_id: string | null;
  source_id: string | null;
  data_source: string;
  company_name: string;
  region_name: string | null;
  category_group: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  emails: string[] | null;
  website: string | null;
  maps_url: string | null;
  google_search_url: string | null;
  phone_search_url: string | null;
  contact_person: string | null;
  decision_maker_phone: string | null;
  decision_maker_email: string | null;
  opening_hours: string | null;
  lat: number | null;
  lon: number | null;
  score: number | null;
  lead_quality_code: LeadQuality | null;
  lead_quality_label: string | null;
  chain_hint: ChainHint | null;
  status: LeadStatus;
  last_contacted_at: string | null;
  last_contact_result: string | null;
  contact_count: number | null;
  call_note: string | null;
  appointment_at: string | null;
  appointment_note: string | null;
  internal_notes: string | null;
  last_email_subject: string | null;
  last_email_body: string | null;
  last_email_sent_at: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseLeadInsert = Partial<SupabaseLeadRow> & {
  source_id: string;
  company_name: string;
};

export type SupabaseLeadUpdate = Partial<
  Pick<
    SupabaseLeadRow,
    | "status"
    | "last_contacted_at"
    | "last_contact_result"
    | "contact_count"
    | "call_note"
    | "appointment_at"
    | "appointment_note"
    | "internal_notes"
  >
>;

export function mapSupabaseLead(row: SupabaseLeadRow): Lead {
  return {
    id: row.id,
    sourceId: row.source_id ?? "",
    companyName: row.company_name,
    regionName: row.region_name ?? "",
    categoryGroup: row.category_group ?? "",
    category: row.category ?? "",
    address: row.address ?? "",
    phone: row.phone ?? "",
    emails: row.emails ?? [],
    website: row.website ?? "",
    mapsUrl: row.maps_url ?? "",
    googleSearchUrl: row.google_search_url ?? "",
    phoneSearchUrl: row.phone_search_url ?? "",
    contactPerson: row.contact_person ?? "",
    decisionMakerPhone: row.decision_maker_phone ?? "",
    decisionMakerEmail: row.decision_maker_email ?? "",
    openingHours: row.opening_hours ?? "",
    lat: row.lat,
    lon: row.lon,
    score: row.score ?? 0,
    leadQuality: row.lead_quality_code ?? "",
    leadQualityLabel: row.lead_quality_label ?? "",
    chainHint: row.chain_hint ?? "LOCAL",
    status: row.status,
    lastContactedAt: row.last_contacted_at,
    lastContactResult: row.last_contact_result ?? "",
    contactCount: row.contact_count ?? 0,
    callNote: row.call_note ?? "",
    appointmentAt: row.appointment_at,
    appointmentNote: row.appointment_note ?? "",
    internalNotes: row.internal_notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapLeadToSupabaseInsert(lead: Lead): SupabaseLeadInsert {
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
    decision_maker_phone: lead.decisionMakerPhone || null,
    decision_maker_email: lead.decisionMakerEmail || null,
    opening_hours: lead.openingHours || null,
    lat: lead.lat,
    lon: lead.lon,
    score: lead.score,
    lead_quality_code: lead.leadQuality || null,
    lead_quality_label: lead.leadQualityLabel || null,
    chain_hint: lead.chainHint,
    status: lead.status,
    last_contacted_at: lead.lastContactedAt,
    last_contact_result: lead.lastContactResult || null,
    contact_count: lead.contactCount,
    call_note: lead.callNote || null,
    appointment_at: lead.appointmentAt,
    appointment_note: lead.appointmentNote || null,
    internal_notes: lead.internalNotes || null,
    raw_payload: {}
  };
}
