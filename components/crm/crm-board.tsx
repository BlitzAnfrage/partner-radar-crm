"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Mail, MapPin, Phone, RotateCcw, Search } from "lucide-react";
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
  const [sort, setSort] = useState<SortMode>("score");

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

    if (phoneFilter === "present") return filtered.filter((lead) => lead.phone);
    if (phoneFilter === "missing") return filtered.filter((lead) => !lead.phone);
    return filtered;
  }, [leads, search, region, category, quality, status, chain, phoneFilter, sort]);

  const clearFilters = () => {
    setSearch("");
    setRegion("");
    setCategory("");
    setQuality("");
    setStatus("");
    setChain("");
    setPhoneFilter("");
    setSort("score");
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
    }
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
      <div className="mb-5 rounded-[2rem] bg-white p-4 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suche"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-slate-400"
            />
          </label>
          <Select value={region} onChange={setRegion} options={regions} placeholder="Region" />
          <Select value={category} onChange={setCategory} options={categories} placeholder="Kategorie" />
          <Select value={quality} onChange={setQuality} options={leadQualities} placeholder="Qualität" />
          <Select value={status} onChange={setStatus} options={leadStatuses} placeholder="Status" labels={statusLabels} />
          <Select
            value={chain}
            onChange={setChain}
            options={["LOCAL", "CHAIN", "BRANCH"]}
            placeholder="Typ"
            labels={chainHintLabels}
          />
          <Select value={phoneFilter} onChange={setPhoneFilter} options={["present", "missing"]} placeholder="Telefon" labels={{ present: "Mit Tel.", missing: "Ohne Tel." }} />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-slate-400"
          >
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
          <div className="text-xl font-semibold tracking-tight text-slate-950">Noch keine Leads in Supabase.</div>
          <div className="mt-2 text-sm text-slate-500">Importiere Leads über n8n oder seed test data.</div>
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
  onPatch: (patch: LeadPatch) => void;
}) {
  const [draftStatus, setDraftStatus] = useState<LeadStatus>(lead.status);
  const [callNote, setCallNote] = useState(lead.callNote);
  const [appointmentAt, setAppointmentAt] = useState(lead.appointmentAt ?? "");
  const [appointmentNote, setAppointmentNote] = useState(lead.appointmentNote);
  const [internalNotes, setInternalNotes] = useState(lead.internalNotes);

  useEffect(() => {
    setDraftStatus(lead.status);
    setCallNote(lead.callNote);
    setAppointmentAt(lead.appointmentAt ?? "");
    setAppointmentNote(lead.appointmentNote);
    setInternalNotes(lead.internalNotes);
  }, [lead]);

  return (
    <article className="rounded-[1.75rem] bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950">{lead.companyName}</h2>
          <div className="mt-1 text-sm text-slate-500">{lead.address || "Adresse offen"}</div>
        </div>
        <div className="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white">{lead.leadQuality || "-"}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Info label="Kontakt" value={lead.contactPerson || "Offen"} />
        <Info label="Region" value={lead.regionName || "Offen"} />
        <Info label="Kategorie" value={lead.category || "Offen"} />
        <Info label="Typ" value={chainHintLabels[lead.chainHint]} />
        <Info label="Telefon" value={lead.phone || "Fehlt"} />
        <Info label="E-Mail" value={lead.emails[0] || "Fehlt"} />
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{lead.openingHours || "Öffnungszeiten offen"}</div>

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

      <div className="mt-4 grid gap-3">
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
        <textarea
          value={callNote}
          onChange={(event) => setCallNote(event.target.value)}
          placeholder="Notiz"
          rows={2}
          className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
        <input
          type="datetime-local"
          value={appointmentAt}
          onChange={(event) => setAppointmentAt(event.target.value)}
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
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium text-slate-400">
            {lead.contactCount} Kontakte · {lead.lastContactResult}
          </div>
          <button
            onClick={() =>
              onPatch({
                status: draftStatus,
                callNote,
                appointmentAt: appointmentAt || null,
                appointmentNote,
                internalNotes,
                lastContactResult: draftStatus === "APPOINTMENT" ? "Termin geplant" : lead.lastContactResult
              })
            }
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Speichern
          </button>
        </div>
      </div>
    </article>
  );
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
