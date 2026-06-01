"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Clock, Timer, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "react-hot-toast";
import type { WorkingHoursRow } from "@/lib/working-hours";

type Props = {
  initialRows: WorkingHoursRow[];
  initialMonth: string;
  scope: "admin" | "manager" | "employee" | string;
};

function monthOptions() {
  const now = new Date();
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString(undefined, { month: "long", year: "numeric" });
    out.push({ value, label });
  }
  return out;
}

function fmtHours(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtMinutesAsHM(mins: number) {
  if (mins <= 0) return "0";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtShift(row: WorkingHoursRow) {
  if (!row.shift) return null;
  const trim = (t: string) => t.slice(0, 5);
  return `${trim(row.shift.start)} – ${trim(row.shift.end)}${row.shift.breakMinutes ? ` · ${row.shift.breakMinutes}m break` : ""}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function WorkingHoursClient({ initialRows, initialMonth, scope }: Props) {
  const [rows, setRows] = useState<WorkingHoursRow[]>(initialRows);
  const [month, setMonth] = useState(initialMonth);
  const [query, setQuery] = useState("");
  const [unconfigOnly, setUnconfigOnly] = useState(false);
  const [isPending, startTransition] = useTransition();

  const months = useMemo(monthOptions, []);

  const filtered = useMemo(() => {
    let list = rows;
    if (unconfigOnly) list = list.filter((r) => !r.shift);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.position ?? "").toLowerCase().includes(q) ||
          (r.department ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, query, unconfigOnly]);

  const totals = useMemo(() => {
    let worked = 0,
      expected = 0,
      overtime = 0,
      late = 0,
      unconfigured = 0,
      withShift = 0;
    for (const r of rows) {
      worked += r.workedHours;
      expected += r.expectedHours;
      overtime += r.overtimeHours;
      late += r.lateMinutes;
      if (r.shift) withShift += 1;
      else unconfigured += 1;
    }
    return { worked, expected, overtime, late, unconfigured, withShift };
  }, [rows]);

  const refetch = (nextMonth: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/working-hours?month=${nextMonth}`, { cache: "no-store" });
      if (!res.ok) {
        toast.error("Failed to load working hours");
        return;
      }
      const data = (await res.json()) as { rows: WorkingHoursRow[] };
      setRows(data.rows ?? []);
    });
  };

  const onMonthChange = (next: string) => {
    setMonth(next);
    refetch(next);
  };

  const scopeLabel =
    scope === "admin" ? "Showing all active employees" : "Showing your hours";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Period</p>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            disabled={isPending}
            className="mt-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{scopeLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Hours worked"
          value={`${fmtHours(totals.worked)} / ${fmtHours(totals.expected)}`}
          gradient="from-violet-500 to-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Overtime"
          value={`${fmtHours(totals.overtime)}h`}
          gradient="from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={Timer}
          label="Total late"
          value={fmtMinutesAsHM(totals.late)}
          gradient="from-amber-500 to-orange-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Without a shift"
          value={String(totals.unconfigured)}
          gradient="from-rose-500 to-pink-600"
        />
      </div>

      {totals.unconfigured > 0 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            {totals.unconfigured} employee{totals.unconfigured !== 1 ? "s" : ""} have no shift configured —
            their hours are skipped from this report. Set shift start/end on each employee&apos;s edit form to
            include them.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, position, or department"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={unconfigOnly}
            onChange={(e) => setUnconfigOnly(e.target.checked)}
            className="rounded border-slate-300 text-violet-600 focus:ring-violet-300"
          />
          Only employees without a shift
        </label>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Employee
                </th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Shift
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Days
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Expected
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Worked
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Late
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Early leave
                </th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">
                  Overtime
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>
                      {unconfigOnly
                        ? "Everyone has a shift configured."
                        : query
                        ? "No employees match your filter."
                        : "No employees found."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const shift = fmtShift(row);
                  const workedShort = row.shift && row.workedHours < row.expectedHours;
                  return (
                    <tr
                      key={row.employeeId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold">
                            {initials(row.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                              {row.name}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {row.position ?? "—"}
                              {row.department ? ` · ${row.department}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                        {shift ?? (
                          <span className="text-rose-500 dark:text-rose-400 text-xs italic">
                            not set
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                        {row.daysPresent}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">
                        {row.shift ? fmtHours(row.expectedHours) : "—"}
                      </td>
                      <td
                        className={`px-5 py-3 text-right tabular-nums font-semibold ${
                          workedShort
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {row.shift ? fmtHours(row.workedHours) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                        {row.shift ? fmtMinutesAsHM(row.lateMinutes) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                        {row.shift ? fmtMinutesAsHM(row.earlyLeaveMinutes) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {row.shift ? `${fmtHours(row.overtimeHours)}h` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Hours are computed from each day&apos;s check-in / check-out vs the employee&apos;s configured
        shift, treating the paid break as part of the expected window. Days marked Absent / On Leave / Weekly
        Off are excluded. Half-day attendance is credited at half the expected hours.
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{value}</p>
      </div>
    </div>
  );
}
