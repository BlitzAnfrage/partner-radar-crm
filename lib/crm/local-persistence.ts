"use client";

import type { Lead, LeadPatch } from "@/types/crm";

const storageKey = "partner-radar-crm-lead-edits";

type LeadEditMap = Record<string, LeadPatch>;

function readEdits(): LeadEditMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as LeadEditMap) : {};
  } catch {
    return {};
  }
}

function writeEdits(edits: LeadEditMap) {
  window.localStorage.setItem(storageKey, JSON.stringify(edits));
}

export function mergeLocalLeadEdits(leads: Lead[]): Lead[] {
  const edits = readEdits();
  return leads.map((lead) => ({ ...lead, ...edits[lead.id] }));
}

export function saveLocalLeadEdit(id: string, patch: LeadPatch) {
  const edits = readEdits();
  edits[id] = {
    ...edits[id],
    ...patch,
    updatedAt: patch.updatedAt ?? new Date().toISOString()
  };
  writeEdits(edits);
}
