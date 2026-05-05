"use client";

import Link from "next/link";
import { Check, ChevronDown, Play, RotateCcw, Search, X } from "lucide-react";
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
  const [categoriesOpen, setCategoriesOpen] = useState(false);
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

  const toggleGroup = (categories: CategoryDefinition[]) => {
    const groupIds = categories.map((category) => category.id);
    const allSelected = groupIds.every((id) => categoryIds.includes(id));
    setCategoryIds((current) =>
      allSelected
        ? current.filter((id) => !groupIds.includes(id))
        : Array.from(new Set([...current, ...groupIds]))
    );
  };

  const reset = () => {
    setRegion("Saarbrücken");
    setCategoryIds(defaultLeadSearchCategoryIds);
    setCategorySearch("");
    setCategoriesOpen(false);
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
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-soft sm:p-7">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-slate-950">Kontrollierte Lead-Suche</div>
            <div className="mt-2 text-sm text-slate-500">A/B Leads, Telefon, lokale Betriebe. Ruhig starten, sauber importieren.</div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <span className={`h-2 w-2 rounded-full ${configured ? "bg-emerald-500" : "bg-amber-500"}`} />
            n8n {configured ? "bereit" : "offen"} · URL {webhookUrlPresent ? "ok" : "fehlt"} · Secret {webhookSecretPresent ? "ok" : "fehlt"}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-500">Region</span>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            >
              {leadSearchRegions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="relative">
            <span className="mb-2 block text-sm font-medium text-slate-500">Kategorien</span>
            <button
              type="button"
              onClick={() => setCategoriesOpen((current) => !current)}
              className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-sm outline-none transition hover:bg-white focus:border-slate-400 focus:bg-white"
              aria-expanded={categoriesOpen}
            >
              <span className="min-w-0 truncate font-medium text-slate-800">
                {selectedCategories.length ? `${selectedCategories.length} Kategorien` : "Kategorien auswählen"}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
            {categoriesOpen ? (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-soft">
                <div className="border-b border-slate-100 p-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={categorySearch}
                        onChange={(event) => setCategorySearch(event.target.value)}
                        placeholder="Branche suchen"
                        className="h-10 w-full rounded-2xl bg-slate-50 pl-9 pr-3 text-sm outline-none focus:bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCategoriesOpen(false)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                      aria-label="Kategorieauswahl schließen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 space-y-4 overflow-auto p-3">
                  {Object.entries(groupedCategories).map(([group, categories]) => {
                    const groupIds = categories.map((category) => category.id);
                    const selectedCount = groupIds.filter((id) => categoryIds.includes(id)).length;
                    const allSelected = selectedCount === groupIds.length;
                    return (
                      <div key={group} className="rounded-2xl bg-slate-50 p-3">
                        <button
                          type="button"
                          onClick={() => toggleGroup(categories)}
                          className="mb-2 flex w-full items-center justify-between text-left"
                        >
                          <span className="text-sm font-semibold text-slate-900">{group}</span>
                          <span className="text-xs font-medium text-slate-500">{selectedCount}/{groupIds.length}</span>
                        </button>
                        <div className="grid gap-1 sm:grid-cols-2">
                          {categories.map((category) => {
                            const active = categoryIds.includes(category.id);
                            return (
                              <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-700 hover:bg-white">
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={() => toggleCategory(category.id)}
                                  className="h-4 w-4 accent-slate-950"
                                />
                                <span className="truncate">{category.label}</span>
                              </label>
                            );
                          })}
                        </div>
                        {allSelected ? <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check className="h-3 w-3" /> Gruppe aktiv</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {categoryPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setCategoryIds(preset.categoryIds)}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
        {selectedCategories.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCategories.slice(0, 6).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white"
              >
                {category.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            {selectedCategories.length > 6 ? (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                +{selectedCategories.length - 6}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          <NumberField label="max. Leads" value={maxLeads} min={1} max={500} onChange={setMaxLeads} />
          <NumberField label="max. Suchjobs" value={maxSearchJobs} min={1} max={20} onChange={setMaxSearchJobs} />
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">Modus</div>
            <div className="space-y-2">
              <Toggle label="Ketten ausschließen" checked={excludeChains} onChange={setExcludeChains} />
              <Toggle label="nur mit Telefon" checked={phoneOnly} onChange={setPhoneOnly} />
              <Toggle label="Testmodus" checked={testMode} onChange={setTestMode} />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Kostenloser Modus: 3-5 Suchjobs, 30-50 Leads. Aktuell ca. {estimatedSeconds}s.{" "}
            {activeBlockingImport ? "Es läuft bereits eine Suche." : "Mehr Suchjobs brauchen länger."}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
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
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">{qualities.join("/") || "keine"} Leads</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5">{selectedCategories.length} Kategorien</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5">{phoneOnly ? "Telefon Pflicht" : "Telefon optional"}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5">{excludeChains ? "ohne Ketten" : "Ketten erlaubt"}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5">{testMode ? "Testmodus" : "Live-Modus"}</span>
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

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-soft sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-lg font-semibold tracking-tight text-slate-950">Letzte Importläufe</div>
          {runningImport ? (
            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {activeBlockingImport ? "läuft" : "wahrscheinlich hängen geblieben"}
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
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
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-500">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </label>
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
