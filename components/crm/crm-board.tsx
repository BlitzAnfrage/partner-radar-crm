"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, ListChecks, Mail, MapPin, Phone, RotateCcw, Search, Sparkles } from "lucide-react";
import type { ChainHint, Lead, LeadPatch, LeadStatus } from "@/types/crm";
import { chainHintLabels, leadQualities, leadStatuses, statusLabels } from "@/types/crm";
import { filterAndSortLeads, type SortMode, uniqueValues } from "@/lib/crm/filtering";
import { mergeLocalLeadEdits, saveLocalLeadEdit } from "@/lib/crm/local-persistence";
import { CallModal } from "@/components/modals/call-modal";
import { MailModal } from "@/components/modals/mail-modal";

type Props = {
  initialLeads: Lead[];
  initialFilters: Record<string, string | string[] | undefined>;
  dataMode: "mock" | "supabase";
  loadError?: string | null;
};

export function CrmBoard({ initialLeads, initialFilters, dataMode, loadError }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeCall, setActiveCall] = useState<Lead | null>(null);
  const [activeMail, setActiveMail] = useState<Lead | null>(null);
  const [search, setSearch] = useState(String(initialFilters.search ?? ""));
  const [region, setRegion] = useState(String(initialFilters.region ?? ""));
  const [category, setCategory] = useState(String(initialFilters.category ?? ""));
  const [quality, setQuality] = useState(String(initialFilters.quality ?? ""));
  const [status, setStatus] = useState(String(initialFilters.status ?? ""));
  const [chain, setChain] = useState(String(initialFilters.chain ?? ""));
  const [phoneFilter, setPhoneFilter] = useState(String(initialFilters.phone ?? ""));
  const [sort, setSort] = useState<SortMode>("recommended");
  const [callList, setCallList] = useState(initialFilters.callList === "1");

  useEffect(() => {
    setLeads(dataMode === "mock" ? mergeLocalLeadEdits(initialLeads) : initialLeads);
  }, [initialLeads, dataMode]);

  const regions = useMemo(() => uniqueValues(leads, "regionName"), [leads]);
  const categories = useMemo(() => uniqueValues(leads, "category"), [leads]);

  const visibleLeads = useMemo(() => {
    const filtered = filterAndSortLeads(leads, {
      search,
      region,
      category,
      quality: quality as never,
      status: status as never,
      chain: chain as never,
      sort
    });

    const phoneFiltered =
      phoneFilter === "present"
        ? filtered.filter((lead) => lead.phone)
        : phoneFilter === "missing"
          ? filtered.filter((lead) => !lead.phone)
          : filtered;

    if (!callList) return phoneFiltered;

    return phoneFiltered.filter(
      (lead) =>
        lead.status === "NEW" &&
        (lead.leadQuality === "A" || lead.leadQuality === "B") &&
        Boolean(lead.phone) &&
        lead.chainHint === "LOCAL"
    );
  }, [leads, search, region, category, quality, status, chain, phoneFilter, sort, callList]);

  const clearFilters = () => {
    setSearch("");
    setRegion("");
    setCategory("");
    setQuality("");
    setStatus("");
    setChain("");
    setPhoneFilter("");
    setSort("recommended");
    setCallList(false);
  };

  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCallList(false);
  };

  const activateCallList = () => {
    setSearch("");
    setRegion("");
    setCategory("");
    setQuality("");
    setStatus("");
    setChain("");
    setPhoneFilter("");
    setSort("recommended");
    setCallList(true);
  };

  const patchLead = async (lead: Lead, patch: LeadPatch) => {
    const nextPatch = {
      ...patch,
      updatedAt: new Date().toISOString()
    };

    setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, ...nextPatch } : item)));
    if (dataMode === "mock") {
      saveLocalLeadEdit(lead.id, nextPatch);
    }

    const response = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextPatch)
    }).catch(() => undefined);

    if (response?.ok) {
      const payload = (await response.json()) as { lead?: Lead };
      if (payload.lead) {
        setLeads((current) => current.map((item) => (item.id === lead.id ? payload.lead as Lead : item)));
      }
      return true;
    }

    return false;
  };

  const callLead = (lead: Lead) => {
    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const patch = {
      contactCount: lead.contactCount + 1,
      lastContactedAt: new Date().toISOString(),
      lastContactResult: "Anruf vorbereitet"
    };
    void patchLead(lead, patch);

    if (isMobile) {
      window.location.href = `tel:${lead.phone.replace(/\s/g, "")}`;
      return;
    }

    setActiveCall({ ...lead, ...patch });
  };

  return (
    <>
      <CrmStats leads={leads} />

      <div className="mb-5 flex flex-col gap-3 rounded-[2rem] bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-950">Schnellfilter</div>
          <div className="text-sm text-slate-500">Fokus auf direkt anrufbare A/B-Leads.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={activateCallList}
            className={`inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
              callList ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            }`}
          >
            <ListChecks className="h-4 w-4" />
            Anrufliste
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-10 items-center rounded-2xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
          >
            Alle Leads
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-[2rem] bg-white p-4 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCallList(false);
              }}
              placeholder="Suche"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-slate-400"
            />
          </label>
          <Select value={region} onChange={(value) => setFilter(setRegion, value)} options={regions} placeholder="Region" />
          <Select value={category} onChange={(value) => setFilter(setCategory, value)} options={categories} placeholder="Kategorie" />
          <Select value={quality} onChange={(value) => setFilter(setQuality, value)} options={leadQualities} placeholder="Qualität" />
          <Select value={status} onChange={(value) => setFilter(setStatus, value)} options={leadStatuses} placeholder="Status" labels={statusLabels} />
          <Select
            value={chain}
            onChange={(value) => setFilter(setChain, value)}
            options={["LOCAL", "CHAIN", "BRANCH"]}
            placeholder="Typ"
            labels={chainHintLabels}
          />
          <Select value={phoneFilter} onChange={(value) => setFilter(setPhoneFilter, value)} options={["present", "missing"]} placeholder="Telefon" labels={{ present: "Mit Tel.", missing: "Ohne Tel." }} />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="recommended">Empfohlen</option>
            <option value="score">Score</option>
            <option value="quality">Qualität</option>
            <option value="newest">Neueste</option>
            <option value="status">Status</option>
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-white transition hover:bg-slate-800"
            aria-label="Filter zurücksetzen"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm font-medium text-slate-500">{visibleLeads.length} Leads</div>

      {loadError ? (
        <div className="mb-4 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-soft">
          <div className="text-lg font-semibold tracking-tight">Supabase konnte nicht gelesen werden.</div>
          <div className="mt-2 text-sm leading-6 text-amber-800">{loadError}</div>
        </div>
      ) : null}

      {dataMode === "supabase" && leads.length === 0 ? (
        <div className="rounded-[2rem] bg-white p-10 text-center shadow-soft">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-xl font-semibold tracking-tight text-slate-950">Noch keine Leads.</div>
          <div className="mt-2 text-sm text-slate-500">Starte deine erste Lead-Suche.</div>
          <Link
            href="/lead-suche"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Lead-Suche starten
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {visibleLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onCall={callLead}
            onMail={setActiveMail}
            onPatch={(patch) => patchLead(lead, patch)}
          />
        ))}
      </div>

      {activeCall ? <CallModal lead={activeCall} onClose={() => setActiveCall(null)} /> : null}
      {activeMail ? <MailModal lead={activeMail} onClose={() => setActiveMail(null)} /> : null}
    </>
  );
}

function CrmStats({ leads }: { leads: Lead[] }) {
  const stats = [
    { label: "Leads gesamt", value: leads.length },
    { label: "A-Leads", value: leads.filter((lead) => lead.leadQuality === "A").length },
    { label: "B-Leads", value: leads.filter((lead) => lead.leadQuality === "B").length },
    { label: "Mit Telefonnummer", value: leads.filter((lead) => lead.phone).length },
    { label: "Ohne Telefonnummer", value: leads.filter((lead) => !lead.phone).length },
    { label: "Ketten", value: leads.filter((lead) => lead.chainHint !== "LOCAL").length },
    { label: "Neue Leads", value: leads.filter((lead) => lead.status === "NEW").length }
  ];

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white px-4 py-3 shadow-soft">
          <div className="text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</div>
          <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  labels
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly T[];
  placeholder: string;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {labels?.[option] ?? option}
        </option>
      ))}
    </select>
  );
}

function LeadCard({
  lead,
  onCall,
  onMail,
  onPatch
}: {
  lead: Lead;
  onCall: (lead: Lead) => void;
  onMail: (lead: Lead) => void;
  onPatch: (patch: LeadPatch) => Promise<boolean>;
}) {
  const [draftStatus, setDraftStatus] = useState<LeadStatus>(lead.status);
  const [callNote, setCallNote] = useState(lead.callNote);
  const [appointmentAt, setAppointmentAt] = useState(lead.appointmentAt ?? "");
  const [appointmentNote, setAppointmentNote] = useState(lead.appointmentNote);
  const [internalNotes, setInternalNotes] = useState(lead.internalNotes);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setDraftStatus(lead.status);
    setCallNote(lead.callNote);
    setAppointmentAt(lead.appointmentAt ?? "");
    setAppointmentNote(lead.appointmentNote);
    setInternalNotes(lead.internalNotes);
  }, [lead]);

  const save = async () => {
    setSaveState("saving");
    const ok = await onPatch({
      status: draftStatus,
      callNote,
      appointmentAt: appointmentAt || null,
      appointmentNote,
      internalNotes,
      lastContactResult: draftStatus === "APPOINTMENT" ? "Termin geplant" : lead.lastContactResult
    });
    setSaveState(ok ? "saved" : "error");
    window.setTimeout(() => setSaveState("idle"), 2200);
  };

  return (
    <article className="rounded-[1.5rem] bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950">{lead.companyName}</h2>
          <div className="mt-1 truncate text-sm text-slate-500">{lead.address || "Adresse offen"}</div>
        </div>
        <div className="shrink-0 rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white">{lead.leadQuality || "-"}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Info label="Kategorie" value={lead.category || "Offen"} />
        <Info label="Region" value={lead.regionName || "Offen"} />
        <Info label="Typ" value={chainHintLabels[lead.chainHint]} />
        <Info label="Telefon" value={lead.phone || "Fehlt"} />
        <Info label="E-Mail" value={lead.emails[0] || "Fehlt"} />
        <Info label="Status" value={statusLabels[lead.status]} />
      </div>

      <div className="mt-3 line-clamp-2 rounded-2xl bg-slate-50 px-4 py-2 text-xs leading-5 text-slate-500">
        {lead.openingHours || "Öffnungszeiten offen"}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {lead.phone ? (
          <button onClick={() => onCall(lead)} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            <Phone className="mr-1.5 inline h-3.5 w-3.5" />
            Anrufen
          </button>
        ) : null}
        {lead.emails.length ? (
          <button onClick={() => onMail(lead)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
            <Mail className="mr-1.5 inline h-3.5 w-3.5" />
            Mail senden
          </button>
        ) : null}
        {lead.website ? <QuickLink href={lead.website} label="Website" icon={<ExternalLink className="h-3.5 w-3.5" />} /> : null}
        {lead.mapsUrl ? <QuickLink href={lead.mapsUrl} label="Maps" icon={<MapPin className="h-3.5 w-3.5" />} /> : null}
        {lead.googleSearchUrl ? <QuickLink href={lead.googleSearchUrl} label="Google" icon={<Search className="h-3.5 w-3.5" />} /> : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="text-xs font-medium text-slate-400">{getContactSummary(lead)}</div>
        <button
          type="button"
          onClick={() => setEditing((current) => !current)}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
        >
          Bearbeiten / Notiz
        </button>
      </div>

      {editing ? (
        <div className="mt-4 grid gap-3">
          {(lead.contactPerson || lead.decisionMakerRole || lead.impressumUrl || lead.contactPageUrl || lead.extractedEmails.length || lead.extractedPhones.length) ? (
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
              {lead.contactPerson ? <div>Ansprechpartner: {lead.contactPerson}{lead.decisionMakerRole ? ` · ${lead.decisionMakerRole}` : ""}</div> : null}
              {lead.impressumUrl ? <a href={lead.impressumUrl} target="_blank" rel="noreferrer" className="block font-medium text-slate-900">Impressum öffnen</a> : null}
              {lead.contactPageUrl ? <a href={lead.contactPageUrl} target="_blank" rel="noreferrer" className="block font-medium text-slate-900">Kontaktseite öffnen</a> : null}
              {lead.extractedEmails.length ? <div>Weitere E-Mails: {lead.extractedEmails.slice(0, 2).join(", ")}</div> : null}
              {lead.extractedPhones.length ? <div>Weitere Telefone: {lead.extractedPhones.slice(0, 2).join(", ")}</div> : null}
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value as LeadStatus)}
              className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
            >
              {leadStatuses.map((item) => (
                <option key={item} value={item}>
                  {statusLabels[item]}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={appointmentAt}
              onChange={(event) => setAppointmentAt(event.target.value)}
              className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <input
            value={callNote}
            onChange={(event) => setCallNote(event.target.value)}
            placeholder="Notiz"
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={appointmentNote}
            onChange={(event) => setAppointmentNote(event.target.value)}
            placeholder="Terminnotiz"
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
          />
          <textarea
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            placeholder="Interne Notizen"
            rows={2}
            className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <div className="flex items-center justify-end gap-3">
          <button
            onClick={save}
            disabled={saveState === "saving"}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveState === "saving" ? "Speichert..." : "Speichern"}
          </button>
        </div>
        <div className="min-h-5 text-sm font-medium">
          {saveState === "saved" ? <span className="text-emerald-700">Gespeichert</span> : null}
          {saveState === "error" ? <span className="text-red-700">Speichern fehlgeschlagen. Bitte erneut versuchen.</span> : null}
        </div>
        </div>
      ) : null}
    </article>
  );
}

function getContactSummary(lead: Lead) {
  if (lead.contactCount === 0 && !lead.lastContactResult) return "Noch kein Kontakt";
  if (lead.contactCount === 0) return lead.lastContactResult || "Noch kein Kontakt";
  return `${lead.contactCount} Kontakte${lead.lastContactResult ? ` · ${lead.lastContactResult}` : ""}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-normal text-slate-400">{label}</div>
      <div className="truncate text-slate-800">{value}</div>
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800"
    >
      {icon}
      {label}
    </a>
  );
}
