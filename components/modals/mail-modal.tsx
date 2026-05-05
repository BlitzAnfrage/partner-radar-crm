"use client";

import { Copy, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import type { Lead } from "@/types/crm";
import { ModalShell } from "./modal-shell";

export function MailModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [recipient, setRecipient] = useState(lead.emails[0] ?? "");
  const [subject, setSubject] = useState(`Kurzer Austausch mit ${lead.companyName}`);
  const [body, setBody] = useState(
    `Guten Tag ${lead.contactPerson || ""},\n\nich melde mich kurz wegen einer möglichen lokalen Partnerschaft im Saarland.\n\nBeste Grüße`
  );

  const mailto = useMemo(() => {
    const params = new URLSearchParams({ subject, body });
    return `mailto:${encodeURIComponent(recipient)}?${params.toString()}`;
  }, [recipient, subject, body]);

  const fullText = `An: ${recipient}\nBetreff: ${subject}\n\n${body}`;

  return (
    <ModalShell title="Mail senden" onClose={onClose}>
      <div className="space-y-4">
        <select
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
        >
          {lead.emails.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={8}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-slate-400"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={mailto}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Mail className="h-4 w-4" />
            Mail-App öffnen
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(fullText)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
          >
            <Copy className="h-4 w-4" />
            Text kopieren
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
