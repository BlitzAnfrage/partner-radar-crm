"use client";

import { Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { leadSearchCategories, leadSearchQualities, leadSearchRegions } from "@/lib/lead-search/options";

type TriggerResponse = {
  ok?: boolean;
  configured?: boolean;
  message?: string;
  importRunId?: string;
};

export function LeadSearchForm({ configured }: { configured: boolean }) {
  const [region, setRegion] = useState("Saarbrücken");
  const [categories, setCategories] = useState<string[]>(["Bäckerei", "Café", "Restaurant"]);
  const [quality, setQuality] = useState("A");
  const [maxLeads, setMaxLeads] = useState(50);
  const [excludeChains, setExcludeChains] = useState(true);
  const [phoneOnly, setPhoneOnly] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const toggleCategory = (category: string) => {
    setCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  };

  const reset = () => {
    setRegion("Saarbrücken");
    setCategories(["Bäckerei", "Café", "Restaurant"]);
    setQuality("A");
    setMaxLeads(50);
    setExcludeChains(true);
    setPhoneOnly(false);
    setTestMode(true);
    setMessage("");
  };

  const startSearch = async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/n8n/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        search: {
          region,
          categories,
          quality,
          maxLeads,
          excludeChains,
          phoneOnly,
          testMode
        }
      })
    }).catch(() => null);

    if (!response) {
      setMessage("Lead-Suche konnte nicht gestartet werden.");
      setLoading(false);
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as TriggerResponse;
    setMessage(payload.message ?? "Antwort erhalten.");
    setLoading(false);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-500">Region</span>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
            >
              {leadSearchRegions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-500">Qualität</span>
            <select
              value={quality}
              onChange={(event) => setQuality(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
            >
              {leadSearchQualities.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-500">max. Leads</span>
            <input
              type="number"
              min={1}
              max={500}
              value={maxLeads}
              onChange={(event) => setMaxLeads(Number(event.target.value))}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
            />
          </label>

          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4">
            <Toggle label="Ketten ausschließen" checked={excludeChains} onChange={setExcludeChains} />
            <Toggle label="nur mit Telefon" checked={phoneOnly} onChange={setPhoneOnly} />
            <Toggle label="Testmodus" checked={testMode} onChange={setTestMode} />
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-medium text-slate-500">Kategorien</div>
          <div className="flex flex-wrap gap-2">
            {leadSearchCategories.map((category) => {
              const active = categories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={startSearch}
            disabled={loading || categories.length === 0}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {loading ? "Startet..." : "Lead-Suche starten"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            Zurücksetzen
          </button>
        </div>

        {message ? <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-700">{message}</div> : null}
      </section>

      <aside className="rounded-[2rem] bg-[#101216] p-6 text-white shadow-soft">
        <div className="text-sm text-white/45">n8n Status</div>
        <div className="mt-3 text-3xl font-semibold tracking-tight">{configured ? "Bereit" : "Offen"}</div>
        <div className="mt-8 space-y-3 text-sm text-white/65">
          <div className="rounded-2xl bg-white/10 p-4">Region: {region}</div>
          <div className="rounded-2xl bg-white/10 p-4">{categories.length} Kategorien</div>
          <div className="rounded-2xl bg-white/10 p-4">{testMode ? "Testmodus aktiv" : "Live-Suche vorbereitet"}</div>
        </div>
      </aside>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-slate-950"
      />
    </label>
  );
}
