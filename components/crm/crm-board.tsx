"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Mail, MapPin, Phone, PhoneCall, RotateCcw, Search, Sparkles } from "lucide-react";
import type { ChainHint, Lead, LeadPatch, LeadStatus } from "@/types/crm";
import { chainHintLabels, leadQualities, leadStatuses, statusLabels } from "@/types/crm";
import { filterAndSortLeads, type SortMode, uniqueValues } from "@/lib/crm/filtering";
import { mergeLocalLeadEdits, saveLocalLeadEdit } from "@/lib/crm/local-persistence";
import { CallModal } from "@/components/modals/call-modal";
import { MailModal } from "@/components/modals/mail-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";

type Props = {
  initialLeads: Lead[];
  initialFilters: Record<string, string | string[] | undefined>;
  dataMode: "mock" | "supabase";
  loadError?: string | null;
};

const sortLabels: Record<SortMode, string> = {
  recommended: "Empfohlen",
  score: "Score",
  quality: "Qualität",
  newest: "Neueste",
  status: "Status"
};

export function CrmBoard({ initialLeads, initialFilters, dataMode, loadError }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeCall, setActiveCall] = useState<Lead | null>(null);
  const [activeMail, setActiveMail] = useState<Lead | null>(null);
  const [search, setSearch] = useState(String(initialFilters.search ?? ""));
  const [region, setRegion] = useState(String(initialFilters.region ?? ""));
  const [category, setCategory] = useState(String(initialFilters.category ?? ""));
  const initialCallList = initialFilters.callList === "1";
  const [quality, setQuality] = useState(initialCallList ? "AB" : String(initialFilters.quality ?? ""));
  const [status, setStatus] = useState(initialCallList ? "NEW" : String(initialFilters.status ?? ""));
  const [chain, setChain] = useState(initialCallList ? "LOCAL" : String(initialFilters.chain ?? ""));
  const [phoneFilter, setPhoneFilter] = useState(initialCallList ? "present" : String(initialFilters.phone ?? ""));
  const [sort, setSort] = useState<SortMode>("recommended");

  useEffect(() => {
    setLeads(dataMode === "mock" ? mergeLocalLeadEdits(initialLeads) : initialLeads);
  }, [initialLeads, dataMode]);

  const regions = useMemo(() => uniqueValues(leads, "regionName"), [leads]);
  const categories = useMemo(() => uniqueValues(leads, "category"), [leads]);
  const activeFilters = [
    search ? `Suche: ${search}` : "",
    region ? `Region: ${region}` : "",
    category ? `Branche: ${category}` : "",
    quality ? `Qualität: ${quality}` : "",
    status ? `Status: ${statusLabels[status as LeadStatus] ?? status}` : "",
    phoneFilter === "present" ? "Mit Telefon" : phoneFilter === "missing" ? "Ohne Telefon" : "",
    chain ? `Typ: ${chainHintLabels[chain as ChainHint] ?? chain}` : "",
    sort !== "recommended" ? `Sortierung: ${sortLabels[sort]}` : ""
  ].filter(Boolean);

  const visibleLeads = useMemo(() => {
    const filtered = filterAndSortLeads(leads, {
      search,
      region,
      category,
      quality: quality === "AB" ? "" : quality as never,
      status: status as never,
      chain: chain as never,
      sort
    });

    const qualityFiltered =
      quality === "AB"
        ? filtered.filter((lead) => lead.leadQuality === "A" || lead.leadQuality === "B")
        : filtered;

    const phoneFiltered =
      phoneFilter === "present"
        ? qualityFiltered.filter((lead) => lead.phone)
        : phoneFilter === "missing"
          ? qualityFiltered.filter((lead) => !lead.phone)
          : qualityFiltered;

    return phoneFiltered;
  }, [leads, search, region, category, quality, status, chain, phoneFilter, sort]);

  const clearFilters = () => {
    setSearch("");
    setRegion("");
    setCategory("");
    setQuality("");
    setStatus("");
    setChain("");
    setPhoneFilter("");
    setSort("recommended");
  };

  const patchLead = async (lead: Lead, patch: LeadPatch) => {
    const nextPatch = {
      ...patch,
      updatedAt: new Date().toISOString()
    };

    const previousLead = leads.find((item) => item.id === lead.id);
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

    if (previousLead) {
      setLeads((current) => current.map((item) => (item.id === lead.id ? previousLead : item)));
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

      <div className="sticky top-[5.25rem] z-10 mb-5 rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-4 shadow-premium backdrop-blur lg:top-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-950">Leads filtern</div>
            <div className="text-xs text-slate-500">{visibleLeads.length} sichtbar</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/anrufmodus"
              className="btn-dark h-10 px-4"
            >
              <PhoneCall className="h-4 w-4" />
              Anrufmodus starten
            </Link>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-light h-10 px-4"
            >
              <RotateCcw className="h-4 w-4" />
              Zurücksetzen
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.6fr_repeat(7,minmax(0,1fr))]">
          <label className="relative md:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suche"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
            />
          </label>
          <Select value={region} onChange={setRegion} options={regions} placeholder="Region" />
          <Select value={category} onChange={setCategory} options={categories} placeholder="Branche" />
          <Select value={quality} onChange={setQuality} options={["AB", ...leadQualities]} placeholder="Qualität" labels={{ AB: "A/B" }} />
          <Select value={status} onChange={setStatus} options={leadStatuses} placeholder="Status" labels={statusLabels} />
          <Select value={phoneFilter} onChange={setPhoneFilter} options={["present", "missing"]} placeholder="Kontaktierbar" labels={{ present: "Mit Telefon", missing: "Ohne Telefon" }} />
          <Select
            value={chain}
            onChange={setChain}
            options={["LOCAL", "CHAIN", "BRANCH"]}
            placeholder="Typ"
            labels={chainHintLabels}
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
          >
            <option value="recommended">Empfohlen</option>
            <option value="score">Score</option>
            <option value="quality">Qualität</option>
            <option value="newest">Neueste</option>
            <option value="status">Status</option>
          </select>
        </div>
        {activeFilters.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span key={filter} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {filter}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mb-4 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-soft">
          <div className="text-lg font-semibold tracking-tight">Supabase konnte nicht gelesen werden.</div>
          <div className="mt-2 text-sm leading-6 text-amber-800">{loadError}</div>
        </div>
      ) : null}

      {dataMode === "supabase" && leads.length === 0 ? (
        <EmptyState
          title="Noch keine Leads."
          text="Starte deine erste Lead-Suche."
          actions={<Link href="/lead-suche" className="btn-dark"><Sparkles className="h-4 w-4" />Lead-Suche starten</Link>}
        />
      ) : null}

      {leads.length > 0 && visibleLeads.length === 0 ? (
        <EmptyState title="Keine Treffer." text="Passe die Filter an oder setze sie zurück." actions={<button type="button" onClick={clearFilters} className="btn-dark">Filter zurücksetzen</button>} />
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
        <div key={stat.label} className="rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 shadow-sm">
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
      className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editing, setEditing] = useState(false);
  const [noteStampInserted, setNoteStampInserted] = useState(false);

  useEffect(() => {
    setDraftStatus(lead.status);
    setCallNote(lead.callNote);
    setAppointmentAt(lead.appointmentAt ?? "");
    setNoteStampInserted(false);
  }, [lead]);

  const save = async () => {
    setSaveState("saving");
    const ok = await onPatch({
      status: draftStatus,
      callNote,
      appointmentAt: appointmentAt || null,
      lastContactResult: draftStatus === "APPOINTMENT" ? "Termin geplant" : lead.lastContactResult
    });
    setSaveState(ok ? "saved" : "error");
    window.setTimeout(() => setSaveState("idle"), 2200);
  };

  const openEditor = () => {
    setEditing((current) => {
      if (!current && !noteStampInserted) {
        const stamp = `[${formatNoteTimestamp(new Date())}]`;
        setCallNote((currentNote) => {
          const trimmed = currentNote.trim();
          if (!trimmed) return `${stamp}\n`;
          if (trimmed.endsWith(stamp)) return currentNote;
          return `${currentNote.trimEnd()}\n\n${stamp}\n`;
        });
        setNoteStampInserted(true);
      }

      return !current;
    });
  };

  return (
    <article className="group rounded-[1.5rem] border border-slate-200/70 bg-white/90 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">{lead.companyName}</h2>
          <div className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{lead.address || "Adresse offen"}</span>
          </div>
        </div>
        <StatusPill tone={lead.leadQuality === "A" ? "dark" : lead.leadQuality === "B" ? "success" : "neutral"}>{lead.leadQuality || "-"}</StatusPill>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <StatusPill>{lead.category || "Kategorie offen"}</StatusPill>
        <StatusPill>{lead.regionName || "Region offen"}</StatusPill>
        <StatusPill>{chainHintLabels[lead.chainHint]}</StatusPill>
        <StatusPill tone="dark">{statusLabels[lead.status]}</StatusPill>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <ContactLine icon={<Phone className="h-4 w-4" />} value={lead.phone || "Telefon fehlt"} muted={!lead.phone} />
        <ContactLine icon={<Mail className="h-4 w-4" />} value={lead.emails[0] || "E-Mail fehlt"} muted={!lead.emails[0]} />
        <ContactLine icon={<ExternalLink className="h-4 w-4" />} value={lead.website || "Website fehlt"} muted={!lead.website} />
      </div>

      <div className="mt-3 line-clamp-2 rounded-2xl bg-slate-50 px-4 py-2 text-xs leading-5 text-slate-500">
        {lead.openingHours || "Öffnungszeiten offen"}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {lead.phone ? (
          <button onClick={() => onCall(lead)} className="btn-dark h-10 rounded-full px-4">
            <Phone className="mr-1.5 inline h-3.5 w-3.5" />
            Anrufen
          </button>
        ) : null}
        {lead.emails.length ? (
          <button onClick={() => onMail(lead)} className="btn-light h-10 rounded-full px-4">
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
          onClick={openEditor}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
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
          <textarea
            value={callNote}
            onChange={(event) => setCallNote(event.target.value)}
            placeholder="Notiz"
            className="h-20 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-slate-400"
          />
          <div className="flex items-center justify-end gap-3">
          <button
            onClick={save}
            disabled={saveState === "saving"}
            className="btn-dark h-10 rounded-full px-4 disabled:cursor-not-allowed disabled:opacity-60"
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

function formatNoteTimestamp(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getContactSummary(lead: Lead) {
  if (lead.contactCount === 0 && !lead.lastContactResult) return "Noch kein Kontakt";
  if (lead.contactCount === 0) return lead.lastContactResult || "Noch kein Kontakt";
  const count = lead.contactCount === 1 ? "1 Kontakt" : `${lead.contactCount} Kontakte`;
  return `${count}${lead.lastContactResult ? ` · ${lead.lastContactResult}` : ""}`;
}

function ContactLine({ icon, value, muted }: { icon: React.ReactNode; value: string; muted?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 ${muted ? "text-slate-400" : "text-slate-800"}`}>
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
    >
      {icon}
      {label}
    </a>
  );
}
