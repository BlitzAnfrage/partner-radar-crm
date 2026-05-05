import type { ChainHint, LeadQuality, LeadStatus } from "@/types/crm";

export type IncomingOsmLead = Record<string, unknown> & {
  place_id?: unknown;
  source_id?: unknown;
  found_at?: unknown;
  region_name?: unknown;
  category_group?: unknown;
  category?: unknown;
  query?: unknown;
  name?: unknown;
  company_name?: unknown;
  address?: unknown;
  phone?: unknown;
  email?: unknown;
  emails?: unknown;
  website?: unknown;
  maps_url?: unknown;
  google_search_url?: unknown;
  phone_search_url?: unknown;
  contact_person?: unknown;
  opening_hours?: unknown;
  lat?: unknown;
  lon?: unknown;
  score?: unknown;
  lead_quality?: unknown;
  lead_quality_code?: unknown;
  lead_quality_label?: unknown;
  chain_hint?: unknown;
  status?: unknown;
  raw_payload?: unknown;
};

export type ImportedLeadRow = {
  import_run_id: string | null;
  source_id: string;
  data_source: string;
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
  raw_payload: Record<string, unknown>;
};

export type ImportMapResult = {
  rows: ImportedLeadRow[];
  skipped: number;
};

export function mapIncomingOsmLeads(leads: IncomingOsmLead[], importRunId: string | null): ImportMapResult {
  const rows: ImportedLeadRow[] = [];
  let skipped = 0;

  for (const lead of leads) {
    const companyName = firstText(lead.company_name, lead.name);
    if (!companyName) {
      skipped += 1;
      continue;
    }

    const sourceId =
      cleanText(lead.source_id) ??
      cleanText(lead.place_id) ??
      stableSourceId(companyName, cleanText(lead.address), cleanText(lead.region_name));

    rows.push({
      import_run_id: importRunId,
      source_id: sourceId,
      data_source: "OpenStreetMap / Overpass",
      company_name: companyName,
      region_name: cleanText(lead.region_name),
      category_group: cleanText(lead.category_group),
      category: cleanText(lead.category),
      address: cleanText(lead.address),
      phone: normalizePhone(lead.phone),
      emails: normalizeEmails(lead.email, lead.emails),
      website: cleanText(lead.website),
      maps_url: cleanText(lead.maps_url),
      google_search_url: cleanText(lead.google_search_url),
      phone_search_url: cleanText(lead.phone_search_url),
      contact_person: cleanText(lead.contact_person),
      opening_hours: cleanText(lead.opening_hours),
      lat: parseCoordinate(lead.lat),
      lon: parseCoordinate(lead.lon),
      score: clampScore(lead.score),
      lead_quality_code: normalizeLeadQualityCode(lead.lead_quality_code, lead.lead_quality),
      lead_quality_label: cleanText(lead.lead_quality_label) ?? cleanText(lead.lead_quality),
      chain_hint: normalizeChainHint(lead.chain_hint),
      status: normalizeStatus(lead.status),
      raw_payload: lead
    });
  }

  return { rows, skipped };
}

export function toExistingLeadUpdate(row: ImportedLeadRow) {
  return {
    import_run_id: row.import_run_id,
    data_source: row.data_source,
    region_name: row.region_name,
    category_group: row.category_group,
    category: row.category,
    address: row.address,
    phone: row.phone,
    emails: row.emails,
    website: row.website,
    maps_url: row.maps_url,
    google_search_url: row.google_search_url,
    phone_search_url: row.phone_search_url,
    contact_person: row.contact_person,
    opening_hours: row.opening_hours,
    lat: row.lat,
    lon: row.lon,
    score: row.score,
    lead_quality_code: row.lead_quality_code,
    lead_quality_label: row.lead_quality_label,
    chain_hint: row.chain_hint,
    raw_payload: row.raw_payload
  };
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }

  return null;
}

function normalizePhone(value: unknown) {
  const phone = cleanText(value);
  if (!phone) return null;
  return phone.startsWith("'") ? phone.slice(1) : phone;
}

function normalizeEmails(email: unknown, emails: unknown) {
  const values = new Set<string>();
  const add = (value: unknown) => {
    const text = cleanText(value);
    if (text) values.add(text);
  };

  add(email);
  if (Array.isArray(emails)) {
    emails.forEach(add);
  }

  return Array.from(values);
}

function parseCoordinate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const parsed = Number.parseFloat(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function clampScore(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : 0;
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeLeadQualityCode(code: unknown, label: unknown): LeadQuality | null {
  const explicit = cleanText(code)?.toUpperCase();
  if (explicit === "A" || explicit === "B" || explicit === "C" || explicit === "D") return explicit;

  const fromLabel = cleanText(label)?.trim().charAt(0).toUpperCase();
  if (fromLabel === "A" || fromLabel === "B" || fromLabel === "C" || fromLabel === "D") return fromLabel;

  return null;
}

function normalizeChainHint(value: unknown): ChainHint {
  const text = cleanText(value)?.toUpperCase();
  if (text === "KETTE / FILIALE" || text === "CHAIN") return "CHAIN";
  if (text === "BRANCH") return "BRANCH";
  return "LOCAL";
}

function normalizeStatus(value: unknown): LeadStatus {
  const text = cleanText(value)?.toUpperCase();
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

  if (text === "NEU") return "NEW";
  if (text && allowed.includes(text as LeadStatus)) return text as LeadStatus;

  return "NEW";
}

function stableSourceId(companyName: string, address: string | null, regionName: string | null) {
  return [companyName, address, regionName]
    .filter(Boolean)
    .join("|")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}
