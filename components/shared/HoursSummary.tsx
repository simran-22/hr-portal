"use client";

import { useEffect, useState } from "react";
import { Clock, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

type EmployeeSummary = {
  id: string;
  name: string;
  position: string | null;
  department: string | null;
  totalHours: number;
  daysWorked: number;
  avgPerDay: number;
  status: "on_track" | "under" | "over" | "no_data";
};

type SummaryData = {
  period: "week" | "month";
  from: string;
  to: string;
  workdaysSoFar: number;
  targetHours: number;
  dailyTarget: number;
  summary: EmployeeSummary[];
};

const statusConfig = {
  on_track: { label: "On track", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20", icon: Minus },
  under: { label: "Below target", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20", icon: TrendingDown },
  over: { label: "Overworked", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20", icon: TrendingUp },
  no_data: { label: "No records", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", icon: Minus },
};

export function HoursSummary({ isAdmin }: { isAdmin: boolean }) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/attendance/summary?period=${period}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error ?? "Failed to load summary");
          setData(null);
          return;
        }
        setData(d);
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [period]);

  const formatRange = (from: string, to: string) => {
    const f = new Date(from + "T00:00:00");
    const t = new Date(to + "T00:00:00");
    return `${f.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${t.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
            {isAdmin ? "Team Working Hours" : "My Working Hours"}
          </h3>
        </div>
        {data && (
          <span className="text-xs text-slate-400">{formatRange(data.from, data.to)}</span>
        )}
        <div className="ml-auto flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setPeriod("week")}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
              period === "week"
                ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
              period === "month"
                ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 text-sm">{error}</div>
      ) : !data || !Array.isArray(data.summary) ? (
        <div className="p-8 text-center text-slate-400 text-sm">No data available.</div>
      ) : !isAdmin ? (
        /* Employee view — single card with progress */
        (() => {
          const me = data.summary[0];
          if (!me || me.status === "no_data") {
            return (
              <div className="p-8 text-center text-slate-400 text-sm">
                No attendance records for this {period}. Check in to start tracking.
              </div>
            );
          }
          const percent = Math.min(100, Math.round((me.totalHours / data.targetHours) * 100)) || 0;
          const cfg = statusConfig[me.status];
          return (
            <div className="p-6 space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Hours</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {me.totalHours.toFixed(1)}
                    <span className="text-sm font-medium text-slate-400 ml-1.5">/ {data.targetHours}h target</span>
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Days worked</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{me.daysWorked} <span className="text-xs font-normal text-slate-400">/ {data.workdaysSoFar}</span></p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Avg per day</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{me.avgPerDay.toFixed(1)}h</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Completion</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{percent}%</p>
                </div>
              </div>
            </div>
          );
        })()
      ) : data.summary.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">No attendance records for this {period}.</div>
      ) : (
        /* HR view — table */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Days</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Hours</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg/day</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {data.summary.map((emp) => {
                const cfg = statusConfig[emp.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <a href={`/employees/${emp.id}`} className="text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-400 truncate block">
                            {emp.name}
                          </a>
                          {emp.position && <p className="text-xs text-slate-400 truncate">{emp.position}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {emp.department ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {emp.daysWorked}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 text-right tabular-nums">
                      {emp.totalHours.toFixed(1)}h
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {emp.daysWorked > 0 ? `${emp.avgPerDay.toFixed(1)}h` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-4">
            <span>Target: {data.dailyTarget}h/day × {data.workdaysSoFar} workdays = {data.targetHours}h</span>
            <span>•</span>
            <span>Below target: &lt;7.5h avg</span>
            <span>•</span>
            <span>Overworked: &gt;9.5h avg</span>
          </div>
        </div>
      )}
    </div>
  );
}
