"use client";

import { useEffect, useState, useCallback } from "react";
import { CONFIG_DEFINITIONS } from "@/lib/config-definitions";

interface ConfigRow {
  key: string;
  value: string;
  label: string;
  description: string;
  group: string;
  type: string;
  unit?: string | null;
}

const GROUP_LABELS: Record<string, string> = {
  general: "General",
  plates: "Plate Calculation",
  sections: "Section Defaults",
};

export default function ConfigPage() {
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfigs(data.configs ?? []);
      const initEdits: Record<string, string> = {};
      for (const c of data.configs ?? []) initEdits[c.key] = c.value;
      setEdits(initEdits);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const updates = Object.entries(edits).map(([key, value]) => ({ key, value }));
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to save.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    await load();
  }

  async function handleReset(key: string) {
    const def = CONFIG_DEFINITIONS.find((d) => d.key === key);
    if (!def) return;
    setEdits((prev) => ({ ...prev, [key]: def.defaultValue }));
  }

  const isDirty = configs.some((c) => edits[c.key] !== c.value);

  const grouped = Object.entries(GROUP_LABELS).map(([group, label]) => ({
    group,
    label,
    items: configs.filter((c) => c.group === group),
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">
            All calculation constants are stored in the database. Changes take effect on the next MTO run.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="flex-shrink-0 px-4 py-2 bg-steel-800 hover:bg-steel-900 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {grouped.map(({ group, label, items }) =>
        items.length === 0 ? null : (
          <div key={group}>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              {label}
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {items.map((config) => {
                const def = CONFIG_DEFINITIONS.find((d) => d.key === config.key);
                const current = edits[config.key] ?? config.value;
                const isChanged = current !== config.value;

                return (
                  <div key={config.key} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">{config.label}</p>
                        {config.unit && (
                          <span className="text-xs text-slate-400 font-mono">{config.unit}</span>
                        )}
                        {isChanged && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                            Modified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type={config.type === "NUMBER" ? "number" : "text"}
                        step={config.type === "NUMBER" ? "any" : undefined}
                        value={current}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [config.key]: e.target.value }))
                        }
                        className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg font-mono text-right focus:outline-none focus:ring-2 focus:ring-steel-500"
                      />
                      {def && current !== def.defaultValue && (
                        <button
                          onClick={() => handleReset(config.key)}
                          className="text-xs text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap"
                          title={`Reset to ${def.defaultValue}`}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {isDirty && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-steel-800 hover:bg-steel-900 disabled:bg-slate-200 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
