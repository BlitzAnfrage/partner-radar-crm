export type LeadQuality = "A" | "B" | "C" | "D";

export type LeadStatus =
  | "NEW"
  | "CALLED"
  | "NOT_REACHED"
  | "INTERESTED"
  | "APPOINTMENT"
  | "PARTNER"
  | "REJECTED"
  | "NOT_FIT"
  | "BLACKLIST";

export type ChainHint = "LOCAL" | "CHAIN" | "BRANCH";

export type Lead = {
  id: string;
  sourceId: string;
  companyName: string;
  regionName: string;
  categoryGroup: string;
  category: string;
  address: string;
  phone: string;
  emails: string[];
  website: string;
  mapsUrl: string;
  googleSearchUrl: string;
  phoneSearchUrl: string;
  contactPerson: string;
  decisionMakerPhone: string;
  decisionMakerEmail: string;
  openingHours: string;
  lat: number | null;
  lon: number | null;
  score: number;
  leadQuality: LeadQuality | "";
  leadQualityLabel: string;
  chainHint: ChainHint;
  status: LeadStatus;
  lastContactedAt: string | null;
  lastContactResult: string;
  contactCount: number;
  callNote: string;
  appointmentAt: string | null;
  appointmentNote: string;
  internalNotes: string;
  impressumUrl: string;
  contactPageUrl: string;
  extractedEmails: string[];
  extractedPhones: string[];
  decisionMakerRole: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadPatch = Partial<
  Pick<
    Lead,
    | "status"
    | "lastContactedAt"
    | "lastContactResult"
    | "contactCount"
    | "callNote"
    | "appointmentAt"
    | "appointmentNote"
    | "internalNotes"
    | "updatedAt"
  >
>;

export const leadStatuses: LeadStatus[] = [
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

export const leadQualities: LeadQuality[] = ["A", "B", "C", "D"];

export const statusLabels: Record<LeadStatus, string> = {
  NEW: "Neu",
  CALLED: "Angerufen",
  NOT_REACHED: "Nicht erreicht",
  INTERESTED: "Interessiert",
  APPOINTMENT: "Termin",
  PARTNER: "Partner",
  REJECTED: "Abgelehnt",
  NOT_FIT: "Passt nicht",
  BLACKLIST: "Blacklist"
};

export const chainHintLabels: Record<ChainHint, string> = {
  LOCAL: "Lokal",
  CHAIN: "Kette",
  BRANCH: "Filiale"
};
