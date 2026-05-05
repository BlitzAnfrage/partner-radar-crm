"use client";

import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ImportRun } from "@/lib/crm/import-runs";
import { categoryPresets, categoryRegistry, type CategoryDefinition } from "@/lib/crm/categories";
import { defaultLeadSearchCategoryIds, leadSearchRegions } from "@/lib/lead-search/options";

type TriggerResponse = {
  ok?: boolean;
  configured?: boolean;
  message?: string;
  importRunId?: string;
};

export function LeadSearchForm({
  configured,
  webhookUrlPresent,
  webhookSecretPresent,
  importRuns
}: {
  configured: boolean;
  webhookUrlPresent: boolean;
  webhookSecretPresent: boolean;
  importRuns: ImportRun[];
}) {
  const [region, setRegion] = useState("Saarbrücken");
  const [categoryIds, setCategoryIds] = useState<string[]>(defaultLeadSearchCategoryIds);
  const [categorySearch, setCategorySearch] = useState("");
  const [qualities, setQualities] = useState<string[]>(["A", "B"]);
  const [maxLeads, setMaxLeads] = useState(30);
  const [maxSearchJobs, setMaxSearchJobs] = useState(3);
  const [excludeChains, setExcludeChains] = useState(true);
  const [phoneOnly, setPhoneOnly] = useState(true);
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const runningImport = importRuns.some((run) => run.status === "RUNNING");
  const activeBlockingImport = importRuns.some((run) => run.status === "RUNNING" && !isStaleRunning(run));
  const selectedCategories = categoryRegistry.filter((category) => categoryIds.includes(category.id));
  const filteredCategories = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    return categoryRegistry.filter((category) =>
      [category.label, category.group, category.description].join(" ").toLowerCase().includes(term)
    );
  }, [categorySearch]);
  const groupedCategories = useMemo(() => groupCategories(filteredCategories), [filteredCategories]);
  const estimatedSeconds = maxSearchJobs * 10;

  const toggleCategory = (categoryId: string) => {
    setCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((item) => item !== categoryId) : [...current, categoryId]
    );
  };

  const reset = () => {
    setRegion("Saarbrücken");
    setCategoryIds(defaultLeadSearchCategoryIds);
    setCategorySearch("");
    setQualities(["A", "B"]);
    setMaxLeads(30);
    setMaxSearchJobs(3);
    setExcludeChains(true);
    setPhoneOnly(true);
    setTestMode(true);
    setMessage("");
  };

  const toggleQuality = (quality: string) => {
    setQualities((current) =>
      current.includes(quality) ? current.filter((item) => item !== quality) : [...current, quality]
    );
  };

  const startSearch = async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/n8n/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        searchConfig: {
          region,
          regionGroup: "saarland",
          country: "DE",
          categories: selectedCategories.map(toSearchCategory),
          qualities,
          maxLeadsPerRun: maxLeads,
          maxJobsPerRun: maxSearchJobs,
          onlyHighQuality: true,
          onlyWithPhone: phoneOnly,
          enableWebsiteLookup: true,
          enableImpressumLookup: true,
          excludeChains,
          phoneOnly,
          testMode,
          freeMode: true,
          duplicateMode: "ignore_existing"
        }
      })
    }).catch(() => null);

    if (!response) {
      setMessage("Lead-Suche konnte nicht gestartet werden.");
      setLoading(false);
      return;
    }

    const payload = (await response.json().catch(() => ({}))) as TriggerResponse;
    setMessage(
      response.ok && payload.configured !== false
        ? "Suche gestartet. Neue Leads erscheinen nach kurzer Zeit im CRM."
        : payload.message ?? "Lead-Suche konnte nicht gestartet werden."
    );
    setLoading(false);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="mb-6">
          <div className="text-xl font-semibold tracking-tight text-slate-950">Starte eine kontrollierte Lead-Suche über n8n.</div>
          <div className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Empfohlen: A/B Leads, nur mit Telefonnummer, Ketten ausschließen.
          </div>
        </div>
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

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-500">Qualität</span>
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
            {["A", "B", "C", "D"].map((quality) => (
                <button
                  key={quality}
                  type="button"
                  onClick={() => toggleQuality(quality)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    qualities.includes(quality) ? "bg-slate-950 text-white" : "bg-white text-slate-600"
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>

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

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-500">max. Suchjobs</span>
            <input
              type="number"
              min={1}
              max={20}
              value={maxSearchJobs}
              onChange={(event) => setMaxSearchJobs(Number(event.target.value))}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
            />
          </label>

          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Filter</div>
            <Toggle label="Ketten ausschließen" checked={excludeChains} onChange={setExcludeChains} />
            <Toggle label="nur mit Telefon" checked={phoneOnly} onChange={setPhoneOnly} />
            <Toggle label="Testmodus" checked={testMode} onChange={setTestMode} />
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-medium text-slate-500">Kategorien</div>
            <input
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              placeholder="Kategorie suchen"
              className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {categoryPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setCategoryIds(preset.categoryIds)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="max-h-80 space-y-4 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-3">
            {Object.entries(groupedCategories).map(([group, categories]) => (
              <div key={group}>
                <div className="mb-2 text-xs font-semibold uppercase text-slate-400">{group}</div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const active = categoryIds.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active ? "bg-slate-950 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Aktiv: {qualities.join("/")} Leads · {selectedCategories.length} Kategorien · {phoneOnly ? "nur mit Telefonnummer" : "Telefon optional"} ·{" "}
          {excludeChains ? "keine Ketten" : "Ketten erlaubt"} · ca. {estimatedSeconds}s
        </div>
        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Empfohlen im kostenlosen Modus: 3 bis 5 Suchjobs und 30 bis 50 Leads. Mehr Suchjobs dauern länger und können Overpass stärker belasten.
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={startSearch}
            disabled={!configured || activeBlockingImport || loading || selectedCategories.length === 0 || qualities.length === 0}
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

        {message ? (
          <div className={`mt-5 rounded-2xl p-4 text-sm font-medium ${configured ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
            <div>{message}</div>
            {configured && message.startsWith("Suche gestartet") ? (
              <Link href="/crm" className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-800">
                Zum CRM
              </Link>
            ) : null}
          </div>
        ) : null}
        {!configured ? (
          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-900">
            n8n ist noch nicht vollständig verbunden. URL und Secret müssen vorhanden sein.
          </div>
        ) : null}
      </section>

      <aside className="space-y-5">
        <section className="rounded-[2rem] bg-[#101216] p-6 text-white shadow-soft">
          <div className="text-sm text-white/45">n8n Status</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight">{configured ? "Bereit" : "Offen"}</div>
          <div className="mt-8 space-y-3 text-sm text-white/65">
            <div className="rounded-2xl bg-white/10 p-4">Webhook URL: {webhookUrlPresent ? "vorhanden" : "fehlt"}</div>
            <div className="rounded-2xl bg-white/10 p-4">Webhook Secret: {webhookSecretPresent ? "vorhanden" : "fehlt"}</div>
            <div className="rounded-2xl bg-white/10 p-4">Region: {region}</div>
            <div className="rounded-2xl bg-white/10 p-4">{selectedCategories.length} Kategorien · {qualities.join("/") || "keine Qualität"}</div>
            <div className="rounded-2xl bg-white/10 p-4">{maxLeads} Leads · {maxSearchJobs} Suchjobs</div>
            <div className="rounded-2xl bg-white/10 p-4">{testMode ? "Testmodus aktiv" : "Live-Suche vorbereitet"}</div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-soft">
          <div className="mb-4 text-lg font-semibold tracking-tight text-slate-950">Letzte Importläufe</div>
          {runningImport ? (
            <div className="mb-3 rounded-2xl bg-blue-50 p-4 text-sm font-medium text-blue-800">
              {activeBlockingImport ? "Es läuft bereits eine Suche." : "Ein alter Import läuft noch. Wahrscheinlich hängen geblieben."}
            </div>
          ) : null}
          <div className="space-y-3">
            {importRuns.length ? (
              importRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{run.source}</div>
                    <div className="text-xs text-slate-500">
                      {run.leads_found} gefunden · {run.leads_inserted} neu · {run.leads_updated} aktualisiert
                      {getSkippedExisting(run) ? ` · ${getSkippedExisting(run)} übersprungen` : ""}
                    </div>
                    {run.error_message ? <div className="mt-1 truncate text-xs text-red-600">{run.error_message}</div> : null}
                    <div className="mt-1 text-xs text-slate-400">
                      {formatDate(run.created_at)}
                      {isStaleRunning(run) ? " · Wahrscheinlich hängen geblieben" : ""}
                    </div>
                  </div>
                  <StatusBadge status={run.status} />
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Noch keine Importläufe.</div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}

function groupCategories(categories: CategoryDefinition[]) {
  return categories.reduce<Record<string, CategoryDefinition[]>>((groups, category) => {
    groups[category.group] = [...(groups[category.group] ?? []), category];
    return groups;
  }, {});
}

function toSearchCategory(category: CategoryDefinition) {
  return {
    id: category.id,
    label: category.label,
    group: category.group,
    osmTags: category.osmTags,
    priority: category.priority
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function isStaleRunning(run: ImportRun) {
  return run.status === "RUNNING" && Date.now() - new Date(run.created_at).getTime() > 15 * 60 * 1000;
}

function getSkippedExisting(run: ImportRun) {
  const value = run.metadata?.skipped_existing_count;
  return typeof value === "number" ? value : 0;
}

function StatusBadge({ status }: { status: ImportRun["status"] }) {
  const className =
    status === "SUCCESS"
      ? "bg-emerald-50 text-emerald-700"
      : status === "FAILED"
        ? "bg-red-50 text-red-700"
        : status === "RUNNING"
          ? "bg-blue-50 text-blue-700"
          : "bg-slate-100 text-slate-600";

  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{status}</span>;
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
