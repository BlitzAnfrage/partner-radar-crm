"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CalendarClock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldX,
  ThumbsUp
} from "lucide-react";
import type { Lead, LeadPatch, LeadStatus } from "@/types/crm";
import { chainHintLabels, statusLabels } from "@/types/crm";
import { buildCallQueue } from "@/lib/crm/call-queue";
import { CallModal } from "@/components/modals/call-modal";
import { MailModal } from "@/components/modals/mail-modal";
import { StatusPill } from "@/components/ui/status-pill";

type SessionStats = {
  handled: number;
  interested: number;
  notReached: number;
  postponed: number;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function CallingMode({ initialLeads, loadError }: { initialLeads: Lead[]; loadError?: string | null }) {
  const initialQueue = useMemo(() => buildCallQueue(initialLeads), [initialLeads]);
  const [queue, setQueue] = useState<Lead[]>(initialQueue);
  const [history, setHistory] = useState<Lead[]>([]);
  const [activeCall, setActiveCall] = useState<Lead | null>(null);
  const [activeMail, setActiveMail] = useState<Lead | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteStampInserted, setNoteStampInserted] = useState(false);
  const [appointmentAt, setAppointmentAt] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<SessionStats>({ handled: 0, interested: 0, notReached: 0, postponed: 0 });
  const currentLead = queue[0] ?? null;
  const hasLowQuality = currentLead?.leadQuality === "C";

  useEffect(() => {
    setQueue(initialQueue);
    setHistory([]);
  }, [initialQueue]);

  useEffect(() => {
    setDetailsOpen(false);
    setNote(currentLead?.callNote ?? "");
    setNoteStampInserted(false);
    setAppointmentAt("");
    setSaveState("idle");
    setMessage("");
  }, [currentLead]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT") return;
      if (!currentLead || saveState === "saving") return;

      const key = event.key.toLowerCase();
      if (key === "s") postpone();
      if (key === "a") callLead(currentLead);
      if (key === "i") void saveDecision("INTERESTED");
      if (key === "n") void saveDecision("NOT_REACHED");
      if (key === "x") void saveDecision("REJECTED");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const currentIndex = history.length + (currentLead ? 1 : 0);
  const total = history.length + queue.length;

  const moveCurrentOut = () => {
    if (!currentLead) return;
    setHistory((items) => [...items, currentLead]);
    setQueue((items) => items.slice(1));
  };

  const postpone = () => {
    if (!currentLead) return;
    setQueue((items) => (items.length > 1 ? [...items.slice(1), items[0]] : items));
    setStats((current) => ({ ...current, postponed: current.postponed + 1 }));
    setMessage("Nach hinten geschoben.");
  };

  const previous = () => {
    setHistory((items) => {
      const previousLead = items.at(-1);
      if (!previousLead) return items;
      setQueue((current) => [previousLead, ...current]);
      return items.slice(0, -1);
    });
  };

  const callLead = (lead: Lead) => {
    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `tel:${lead.phone.replace(/\s/g, "")}`;
      return;
    }

    setActiveCall(lead);
  };

  const saveDecision = async (status: LeadStatus) => {
    if (!currentLead) return;
    setSaveState("saving");
    setMessage("");

    const patch: LeadPatch = {
      status,
      callNote: note,
      appointmentAt: status === "APPOINTMENT" ? appointmentAt || null : currentLead.appointmentAt,
      lastContactResult: statusLabels[status],
      updatedAt: new Date().toISOString()
    };

    const response = await fetch(`/api/leads/${currentLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    }).catch(() => null);

    if (!response?.ok) {
      const payload = await response?.json().catch(() => null);
      setSaveState("error");
      setMessage(payload?.error ?? "Status konnte nicht gespeichert werden.");
      return;
    }

    setStats((current) => ({
      handled: current.handled + 1,
      interested: current.interested + (status === "INTERESTED" ? 1 : 0),
      notReached: current.notReached + (status === "NOT_REACHED" ? 1 : 0),
      postponed: current.postponed
    }));
    setSaveState("saved");
    setMessage("Gespeichert.");
    moveCurrentOut();
    window.setTimeout(() => setSaveState("idle"), 1400);
  };

  const ensureNoteTimestamp = () => {
    if (noteStampInserted) return;
    const stamp = `[${formatNoteTimestamp(new Date())}]`;
    setNote((currentNote) => {
      const trimmed = currentNote.trim();
      if (!trimmed) return `${stamp}\n`;
      if (trimmed.endsWith(stamp)) return currentNote;
      return `${currentNote.trimEnd()}\n\n${stamp}\n`;
    });
    setNoteStampInserted(true);
  };

  const saveNote = async () => {
    if (!currentLead) return;
    setSaveState("saving");
    setMessage("");

    const response = await fetch(`/api/leads/${currentLead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callNote: note,
        updatedAt: new Date().toISOString()
      })
    }).catch(() => null);

    if (!response?.ok) {
      const payload = await response?.json().catch(() => null);
      setSaveState("error");
      setMessage(payload?.error ?? "Notiz konnte nicht gespeichert werden.");
      return;
    }

    setSaveState("saved");
    setMessage("Notiz gespeichert.");
    window.setTimeout(() => setSaveState("idle"), 1600);
  };

  if (loadError) {
    return (
      <StateCard
        title="Leads konnten nicht geladen werden."
        text={loadError}
        actions={<button type="button" onClick={() => window.location.reload()} className="btn-dark">Erneut versuchen</button>}
      />
    );
  }

  if (!currentLead) {
    return (
      <StateCard
        title="Keine anrufbaren Leads."
        text="Keine neuen Leads mit Telefonnummer in der Queue."
        actions={
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/lead-suche" className="btn-dark">Lead-Suche starten</Link>
            <Link href="/crm" className="btn-light">CRM öffnen</Link>
            <Link href="/crm?phone=present" className="btn-light">Filter lockern</Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <Metric label="Aktueller Lead" value={`${currentIndex}/${total}`} />
        <Metric label="Verbleibend" value={queue.length} />
        <Metric label="Heute bearbeitet" value={stats.handled} />
        <Metric label="Später" value={stats.postponed} />
      </div>

      <article className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-soft">
        <div className="border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/80 p-5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusPill tone={hasLowQuality ? "warning" : "dark"}>{currentLead.leadQuality || "-"} Lead</StatusPill>
              <StatusPill tone="neutral">Score {currentLead.score}</StatusPill>
              <StatusPill tone={currentLead.chainHint === "LOCAL" ? "success" : "neutral"}>{chainHintLabels[currentLead.chainHint]}</StatusPill>
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{currentLead.companyName}</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-medium text-slate-500">
              <span>{currentLead.category || "Kategorie offen"}</span>
              <span>·</span>
              <span>{currentLead.regionName || "Region offen"}</span>
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-slate-950 px-5 py-4 text-white shadow-sm">
            <div className="text-xs font-semibold uppercase text-white/45">Telefon</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">{currentLead.phone || "Fehlt"}</div>
          </div>
        </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-[1fr_0.8fr]">
          <div>
        <div className="grid gap-3 lg:grid-cols-2">
          <InfoLine label="E-Mail" value={currentLead.emails[0] || "Fehlt"} />
          <InfoLine label="Website" value={currentLead.website || "Fehlt"} />
          <InfoLine label="Adresse" value={currentLead.address || "Offen"} />
          <InfoLine label="Öffnungszeiten" value={currentLead.openingHours || "Offen"} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => callLead(currentLead)} className="btn-dark">
            <Phone className="h-4 w-4" />
            Anrufen
          </button>
          {currentLead.emails.length ? (
            <button type="button" onClick={() => setActiveMail(currentLead)} className="btn-light">
              <Mail className="h-4 w-4" />
              Mail senden
            </button>
          ) : null}
          {currentLead.website ? <QuickLink href={currentLead.website} label="Website" icon={<ExternalLink className="h-4 w-4" />} /> : null}
          {currentLead.mapsUrl ? <QuickLink href={currentLead.mapsUrl} label="Maps" icon={<MapPin className="h-4 w-4" />} /> : null}
          {currentLead.googleSearchUrl ? <QuickLink href={currentLead.googleSearchUrl} label="Google" icon={<SearchIcon />} /> : null}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={() => setDetailsOpen((current) => !current)}
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            Details
          </button>
          {detailsOpen ? (
            <div className="mt-4 grid gap-3">
              {currentLead.contactPerson ? <InfoLine label="Ansprechpartner" value={currentLead.contactPerson} /> : null}
              {currentLead.impressumUrl ? <QuickLink href={currentLead.impressumUrl} label="Impressum" icon={<ExternalLink className="h-4 w-4" />} /> : null}
              {currentLead.contactPageUrl ? <QuickLink href={currentLead.contactPageUrl} label="Kontaktseite" icon={<ExternalLink className="h-4 w-4" />} /> : null}
              <label>
                <span className="mb-2 block text-sm font-medium text-slate-500">Termin</span>
                <input
                  type="datetime-local"
                  value={appointmentAt}
                  onChange={(event) => setAppointmentAt(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>
            </div>
          ) : null}
        </div>
          </div>

          <aside className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950">Notiz</div>
                <div className="text-xs text-slate-500">Wird mit Statusaktionen gespeichert.</div>
              </div>
              <button type="button" onClick={saveNote} disabled={saveState === "saving"} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50">
                Notiz speichern
              </button>
            </div>
            <textarea
              value={note}
              onFocus={ensureNoteTimestamp}
              onChange={(event) => setNote(event.target.value)}
              rows={7}
              placeholder="Kurze Gesprächsnotiz..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-400"
            />
          </aside>
        </div>

        <div className="border-t border-slate-100 bg-white p-5 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ActionButton label="Interessiert" onClick={() => saveDecision("INTERESTED")} icon={<ThumbsUp />} disabled={saveState === "saving"} tone="positive" />
          <ActionButton label="Nicht erreicht" onClick={() => saveDecision("NOT_REACHED")} icon={<Phone />} disabled={saveState === "saving"} />
          <ActionButton label="Termin" onClick={() => saveDecision("APPOINTMENT")} icon={<CalendarClock />} disabled={saveState === "saving"} tone="positive" />
          <ActionButton label="Absage" onClick={() => saveDecision("REJECTED")} icon={<Ban />} disabled={saveState === "saving"} />
          <ActionButton label="Nicht passend" onClick={() => saveDecision("NOT_FIT")} icon={<ShieldX />} disabled={saveState === "saving"} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={previous} disabled={!history.length} className="btn-light disabled:cursor-not-allowed disabled:opacity-50">
            <ArrowLeft className="h-4 w-4" />
            Vorheriger Lead
          </button>
          <button type="button" onClick={postpone} className="btn-light">
            <RotateCcw className="h-4 w-4" />
            Später
          </button>
          <button type="button" onClick={postpone} className="btn-light">
            <ArrowRight className="h-4 w-4" />
            Nächster Lead
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => void saveDecision("BLACKLIST")} disabled={saveState === "saving"} className="text-sm font-semibold text-slate-400 transition hover:text-red-700">
            Blacklist
          </button>
          <div className="min-h-5 text-sm font-semibold">
            {saveState === "saving" ? <span className="text-slate-500">Speichert...</span> : null}
            {saveState === "saved" ? <span className="text-emerald-700">{message}</span> : null}
            {saveState === "error" ? <span className="text-red-700">{message}</span> : null}
            {saveState === "idle" && message ? <span className="text-slate-500">{message}</span> : null}
          </div>
        </div>
        </div>
      </article>

      <div className="mt-4 text-center text-xs font-medium text-slate-400">
        Kürzel: A Anrufen · I Interessiert · N Nicht erreicht · S Später · X Absage
      </div>

      {activeCall ? <CallModal lead={activeCall} onClose={() => setActiveCall(null)} /> : null}
      {activeMail ? <MailModal lead={activeMail} onClose={() => setActiveMail(null)} /> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-soft">
      <div className="text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  const muted = value === "Fehlt" || value === "Offen";
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className={`mt-1 truncate text-sm font-medium ${muted ? "text-slate-400" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  tone = "light"
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "dark" | "light" | "positive";
}) {
  const className =
    tone === "positive"
      ? "btn-positive disabled:cursor-not-allowed disabled:opacity-50"
      : tone === "dark"
        ? "btn-dark disabled:cursor-not-allowed disabled:opacity-50"
        : "btn-light disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {label}
    </button>
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

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="btn-light">
      {icon}
      {label}
    </a>
  );
}

function StateCard({ title, text, actions }: { title: string; text: string; actions: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-100 bg-white p-10 text-center shadow-soft">
      <div className="text-2xl font-semibold tracking-tight text-slate-950">{title}</div>
      <div className="mt-2 text-sm text-slate-500">{text}</div>
      <div className="mt-6">{actions}</div>
    </div>
  );
}

function SearchIcon() {
  return <ExternalLink className="h-4 w-4" />;
}
