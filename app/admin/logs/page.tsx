"use client";

import { useEffect, useState, useCallback } from "react";

interface LogRow {
  id: string;
  userEmail: string | null;
  filename: string;
  status: "SUCCESS" | "FAILED";
  totalWeightKg: number | null;
  sectionCount: number | null;
  plateCount: number | null;
  totalMembers: number | null;
  errorMsg: string | null;
  processingMs: number | null;
  createdAt: string;
}

interface LogStats {
  total: number;
  success: number;
  failed: number;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | "SUCCESS" | "FAILED">("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setStats(data.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function handleFilterChange(val: "" | "SUCCESS" | "FAILED") {
    setStatusFilter(val);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Processing Logs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Every MTO upload is logged here with timing and outcome.
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Runs", value: stats.total, color: "text-slate-800" },
            { label: "Successful", value: stats.success, color: "text-emerald-600" },
            { label: "Failed", value: stats.failed, color: "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(["", "SUCCESS", "FAILED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              statusFilter === f
                ? "bg-steel-800 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f || "All"}
          </button>
        ))}
        <button
          onClick={() => load()}
          className="ml-auto text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-400">
          No logs found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 font-medium">
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Weight (kg)</th>
                  <th className="px-4 py-3 text-right">Sections</th>
                  <th className="px-4 py-3 text-right">Plates</th>
                  <th className="px-4 py-3 text-right">Time (ms)</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 max-w-[180px] truncate">
                      {log.filename}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {log.userEmail ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {log.status}
                      </span>
                      {log.errorMsg && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-[200px] truncate" title={log.errorMsg}>
                          {log.errorMsg}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {log.totalWeightKg != null ? log.totalWeightKg.toFixed(0) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {log.sectionCount ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {log.plateCount ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      {log.processingMs ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="text-xs text-slate-500">Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={logs.length < 20}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
