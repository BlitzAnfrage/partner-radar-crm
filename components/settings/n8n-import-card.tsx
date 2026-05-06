"use client";

import { Play } from "lucide-react";
import { useState } from "react";

export function N8nImportCard({
  configured,
  lastStatus
}: {
  configured: boolean;
  lastStatus: string;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const trigger = async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/n8n/trigger", { method: "POST" }).catch(() => null);
    if (!response) {
      setMessage("n8n konnte nicht gestartet werden.");
      setLoading(false);
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    setMessage(payload.message ?? "Antwort erhalten.");
    setLoading(false);
  };

  return (
    <section className="mt-5 rounded-[1.5rem] border border-slate-200/70 bg-white/90 p-5 shadow-soft">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">n8n Lead-Suche</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">Status: {configured ? "bereit" : "offen"}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">Letzter Import: {lastStatus}</span>
            <span>Callback: /api/imports/osm-leads</span>
          </div>
          {message ? <div className="mt-3 text-sm font-medium text-slate-700">{message}</div> : null}
        </div>
        <button
          type="button"
          onClick={trigger}
          disabled={loading}
          className="btn-dark h-12 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play className="h-4 w-4" />
          {loading ? "Startet..." : "Lead-Suche starten"}
        </button>
      </div>
    </section>
  );
}
