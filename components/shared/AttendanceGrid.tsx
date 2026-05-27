"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Emp = {
  id: string;
  name: string;
  status: string;
  reports_to: string | null;
  manager_name: string | null;
};
type Att = { employee_id: string; date: string; status: string };
type Leave = { employee_id: string; type: string; from_date: string; to_date: string };
type Holiday = { date: string; name: string };

// Status codes — single source of truth
type Code =
  | "P"
  | "WO"
  | "PL"
  | "SL"
  | "CL"
  | "LWP"
  | "Half-day"
  | "P-Morning"
  | "Absent"
  | "";

const STATUS_TO_CODE: Record<string, Code> = {
  present: "P",
  weekly_off: "WO",
  privilege_leave: "PL",
  sick_leave: "SL",
  casual_leave: "CL",
  unpaid_leave: "LWP",
  half_day: "Half-day",
  morning_only: "P-Morning",
  absent: "Absent",
  on_leave: "PL", // legacy fallback
  late: "P",      // legacy fallback
};

const CODE_TO_STATUS: Record<Code, string | null> = {
  "P": "present",
  "WO": "weekly_off",
  "PL": "privilege_leave",
  "SL": "sick_leave",
  "CL": "casual_leave",
  "LWP": "unpaid_leave",
  "Half-day": "half_day",
  "P-Morning": "morning_only",
  "Absent": "absent",
  "": null,
};

const LEAVE_TYPE_TO_CODE: Record<string, Code> = {
  annual: "PL",
  privilege: "PL",
  sick: "SL",
  casual: "CL",
  unpaid: "LWP",
  maternity: "PL",
  paternity: "PL",
};

const CELL_COLORS: Record<Code, string> = {
  "P":         "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  "WO":        "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  "PL":        "bg-orange-200 text-orange-900 dark:bg-orange-500/30 dark:text-orange-200",
  "SL":        "bg-pink-200 text-pink-900 dark:bg-pink-500/30 dark:text-pink-200",
  "CL":        "bg-purple-200 text-purple-900 dark:bg-purple-500/30 dark:text-purple-200",
  "LWP":       "bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-200",
  "Half-day":  "bg-blue-200 text-blue-900 dark:bg-blue-500/30 dark:text-blue-200",
  "P-Morning": "bg-green-300 text-green-900 dark:bg-green-500/40 dark:text-green-100",
  "Absent":    "bg-red-200 text-red-900 dark:bg-red-500/30 dark:text-red-200",
  "":          "bg-white dark:bg-slate-900 text-slate-400",
};

const CODE_OPTIONS: Code[] = ["P", "WO", "PL", "SL", "CL", "LWP", "Half-day", "P-Morning", "Absent"];

function daysInMonth(year: number, month1: number) {
  return new Date(year, month1, 0).getDate();
}

function weekdayLetter(year: number, month1: number, day: number) {
  const d = new Date(year, month1 - 1, day);
  return ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][d.getDay()];
}

function isWeekend(year: number, month1: number, day: number) {
  const d = new Date(year, month1 - 1, day).getDay();
  return d === 0 || d === 6;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function dateKey(year: number, month1: number, day: number) {
  return `${year}-${pad(month1)}-${pad(day)}`;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function AttendanceGrid({
  year,
  month1,
  employees,
  attendance,
  approvedLeaves,
  holidays,
}: {
  year: number;
  month1: number;
  employees: Emp[];
  attendance: Att[];
  approvedLeaves: Leave[];
  holidays: Holiday[];
}) {
  const router = useRouter();
  const dim = daysInMonth(year, month1);

  // Build (employeeId → date → code) map
  // Priority: attendance row > approved leave > weekend (WO)
  const initialMap = useMemo(() => {
    const m = new Map<string, Map<number, Code>>();
    for (const e of employees) m.set(e.id, new Map());

    // 1) Weekends pre-fill (no attendance row stored, just visual hint)
    for (const e of employees) {
      const days = m.get(e.id)!;
      for (let d = 1; d <= dim; d++) {
        if (isWeekend(year, month1, d)) days.set(d, "WO");
      }
    }

    // 2) Approved leaves
    for (const lv of approvedLeaves) {
      const days = m.get(lv.employee_id);
      if (!days) continue;
      const code = LEAVE_TYPE_TO_CODE[lv.type] ?? "PL";
      const from = new Date(lv.from_date + "T00:00:00");
      const to = new Date(lv.to_date + "T00:00:00");
      for (let d = 1; d <= dim; d++) {
        const cur = new Date(year, month1 - 1, d);
        if (cur >= from && cur <= to) days.set(d, code);
      }
    }

    // 3) Attendance rows (highest priority — explicit edits win)
    for (const a of attendance) {
      const days = m.get(a.employee_id);
      if (!days) continue;
      const d = new Date(a.date + "T00:00:00").getDate();
      days.set(d, STATUS_TO_CODE[a.status] ?? "");
    }

    return m;
  }, [employees, attendance, approvedLeaves, dim, year, month1]);

  const [gridMap, setGridMap] = useState(initialMap);
  const [open, setOpen] = useState<{ empId: string; day: number; x: number; y: number } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const holidayByDate = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of holidays) m.set(h.date, h.name);
    return m;
  }, [holidays]);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const monthLabel = `${MONTHS[month1 - 1]} ${year}`;
  const prev = month1 === 1 ? { y: year - 1, m: 12 } : { y: year, m: month1 - 1 };
  const next = month1 === 12 ? { y: year + 1, m: 1 } : { y: year, m: month1 + 1 };

  const handleCellClick = (e: React.MouseEvent, empId: string, day: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setError(null);
    setOpen({
      empId,
      day,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 4,
    });
  };

  const setCellCode = async (empId: string, day: number, code: Code) => {
    const cellKey = `${empId}-${day}`;
    setSaving(cellKey);
    setError(null);

    // Optimistic update
    const prevCode = gridMap.get(empId)?.get(day) ?? "";
    setGridMap((m) => {
      const copy = new Map(m);
      const days = new Map(copy.get(empId) ?? new Map());
      if (code === "") days.delete(day);
      else days.set(day, code);
      copy.set(empId, days);
      return copy;
    });
    setOpen(null);

    try {
      const res = await fetch("/api/attendance/cell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: empId,
          date: dateKey(year, month1, day),
          status: CODE_TO_STATUS[code],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
    } catch (err) {
      // Rollback
      setGridMap((m) => {
        const copy = new Map(m);
        const days = new Map(copy.get(empId) ?? new Map());
        if (prevCode === "") days.delete(day);
        else days.set(day, prevCode);
        copy.set(empId, days);
        return copy;
      });
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  };

  const goToMonth = (y: number, m: number) => {
    router.push(`/attendance/grid?year=${y}&month=${m}`);
  };

  const dayHeaderCells = [];
  for (let d = 1; d <= dim; d++) {
    const wkLet = weekdayLetter(year, month1, d);
    const wkend = isWeekend(year, month1, d);
    const hol = holidayByDate.get(dateKey(year, month1, d));
    dayHeaderCells.push(
      <th
        key={d}
        className={`px-1 py-1.5 text-center font-semibold min-w-[58px] sticky top-0 z-10 border-b border-r border-slate-200 dark:border-slate-700 ${
          hol ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" :
          wkend ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" :
          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }`}
        title={hol ?? (wkend ? "Weekend" : undefined)}
      >
        <div className="text-[11px] uppercase tracking-wider">{wkLet}</div>
        <div className="text-[13px] font-bold tabular-nums">{d}</div>
      </th>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(prev.y, prev.m)}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <select
            value={month1}
            onChange={(e) => goToMonth(year, parseInt(e.target.value, 10))}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => goToMonth(parseInt(e.target.value, 10), month1)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => goToMonth(next.y, next.m)}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            {monthLabel} · {employees.length} employees
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          {CODE_OPTIONS.map((c) => (
            <span key={c} className={`px-2 py-0.5 rounded ${CELL_COLORS[c]} font-medium`}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid-scroll bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-auto max-h-[calc(100vh-240px)]">
        <table className="border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-r border-b border-slate-200 dark:border-slate-700 w-12">
                #
              </th>
              <th className="sticky left-12 top-0 z-30 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-r border-b border-slate-200 dark:border-slate-700 min-w-[120px]">
                Manager
              </th>
              <th className="sticky left-[180px] top-0 z-30 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-r border-b border-slate-200 dark:border-slate-700 min-w-[160px]">
                Employee
              </th>
              {dayHeaderCells}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => {
              const terminated = emp.status === "terminated";
              const days = gridMap.get(emp.id) ?? new Map();
              return (
                <tr
                  key={emp.id}
                  className={terminated ? "bg-red-50/40 dark:bg-red-500/5" : ""}
                >
                  <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 px-3 py-1.5 border-r border-b border-slate-100 dark:border-slate-800 text-slate-400 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="sticky left-12 z-20 bg-white dark:bg-slate-900 px-3 py-1.5 border-r border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {emp.manager_name ?? "—"}
                  </td>
                  <td className="sticky left-[180px] z-20 bg-white dark:bg-slate-900 px-3 py-1.5 border-r border-b border-slate-100 dark:border-slate-800 max-w-[160px]">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="font-medium text-slate-700 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 truncate block"
                    >
                      {emp.name}
                    </Link>
                  </td>
                  {Array.from({ length: dim }, (_, idx) => {
                    const day = idx + 1;
                    const code = (days.get(day) ?? "") as Code;
                    const cellKey = `${emp.id}-${day}`;
                    const isSaving = saving === cellKey;
                    return (
                      <td
                        key={day}
                        className="p-0 border-r border-b border-slate-100 dark:border-slate-800"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleCellClick(e, emp.id, day)}
                          className={`w-full h-full min-w-[58px] min-h-[40px] px-1 text-[12px] font-bold leading-tight whitespace-nowrap transition hover:ring-2 hover:ring-violet-400 hover:z-10 relative ${CELL_COLORS[code]} ${isSaving ? "opacity-50" : ""}`}
                          title={`${emp.name} · ${dateKey(year, month1, day)} · ${code || "(empty)"}`}
                        >
                          {code || "·"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {employees.length === 0 && (
              <tr>
                <td colSpan={3 + dim} className="px-4 py-12 text-center text-slate-400">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status picker popover */}
      {open && (
        <div
          ref={popoverRef}
          style={{ position: "absolute", left: open.x, top: open.y }}
          className="z-50 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-2 grid grid-cols-3 gap-1 w-[260px]"
        >
          {CODE_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCellCode(open.empId, open.day, c)}
              className={`px-2 py-2 rounded text-[11px] font-semibold transition hover:scale-105 ${CELL_COLORS[c]}`}
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCellCode(open.empId, open.day, "")}
            className="col-span-3 mt-1 px-2 py-2 rounded text-[11px] font-medium border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear cell
          </button>
        </div>
      )}
    </div>
  );
}
