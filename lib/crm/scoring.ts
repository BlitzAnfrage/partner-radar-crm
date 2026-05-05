import type { LeadQuality } from "@/types/crm";

export type LeadScoringGuidance = {
  code: LeadQuality;
  label: string;
  criteria: string[];
  callListRecommended: boolean;
};

export const leadScoringGuidance: LeadScoringGuidance[] = [
  {
    code: "A",
    label: "A-Lead",
    criteria: [
      "Telefonnummer vorhanden",
      "Unternehmen wirkt lokal oder relevant",
      "Kategorie passt gut",
      "Adresse oder Website vorhanden",
      "Score hoch"
    ],
    callListRecommended: true
  },
  {
    code: "B",
    label: "B-Lead",
    criteria: [
      "Telefonnummer vorhanden",
      "weniger Zusatzinfos als A",
      "oder Website vorhanden und Telefon realistisch auffindbar"
    ],
    callListRecommended: true
  },
  {
    code: "C",
    label: "C-Lead",
    criteria: ["Unternehmen existiert wahrscheinlich", "keine Telefonnummer", "später prüfen"],
    callListRecommended: false
  },
  {
    code: "D",
    label: "D-Lead",
    criteria: ["Kette oder Filiale", "wenig Daten", "unklare Relevanz"],
    callListRecommended: false
  }
];

export function getLeadQualityGuidance(code: LeadQuality | null | undefined) {
  return leadScoringGuidance.find((item) => item.code === code) ?? null;
}
