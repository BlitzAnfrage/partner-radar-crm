"use client";

import { Copy, Phone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Lead } from "@/types/crm";
import { ModalShell } from "./modal-shell";

export function CallModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const tel = `tel:${lead.phone.replace(/\s/g, "")}`;

  return (
    <ModalShell title="Anrufen" onClose={onClose}>
      <div className="text-center">
        <div className="text-sm font-medium text-slate-500">{lead.companyName}</div>
        <div className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{lead.phone}</div>
        <div className="mx-auto mt-6 w-fit rounded-[1.5rem] bg-slate-50 p-4">
          <QRCodeSVG value={tel} size={172} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(lead.phone)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
          >
            <Copy className="h-4 w-4" />
            Kopieren
          </button>
          <a
            href={tel}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Phone className="h-4 w-4" />
            Direkt anrufen
          </a>
        </div>
      </div>
    </ModalShell>
  );
}
