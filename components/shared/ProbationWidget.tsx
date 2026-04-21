"use client";

import { useEffect, useState } from "react";
import { Clock, Check, Loader2, AlertTriangle } from "lucide-react";

type ProbationEmployee = {
  id: string;
  name: string;
  position: string | null;
  hire_date: string | null;
  probation_end_date: string;
  departments: { name: string } | null;
};

type EnrichedEmployee = ProbationEmployee & {
  daysLeft: number;
  bucket: "overdue" | "soon" | "ok";
};

function enrich(employees: ProbationEmployee[]): EnrichedEmployee[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return employees
    .map((emp) => {
      const end = new Date(emp.probation_end_date + "T00:00:00");
      const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const bucket: "overdue" | "soon" | "ok" = daysLeft < 0 ? "overdue" : daysLeft <= 7 ? "soon" : "ok";
      return { ...emp, daysLeft, bucket };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function ProbationWidget() {
  const [employees, setEmployees] = useState<EnrichedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/employees/probation");
      if (!res.ok) return;
      const data = await res.json();
      setEmployees(enrich(data.employees ?? []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfirm = async (id: string) => {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const overdueCount = employees.filter((e) => e.bucket === "overdue").length;
  const soonCount = employees.filter((e) => e.bucket === "soon").length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-500" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Probation Tracker</h3>
        <span className="ml-auto flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
              {overdueCount} overdue
            </span>
          )}
          {soonCount > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
              {soonCount} ending soon
            </span>
          )}
          <span className="text-xs text-slate-400">{employees.length} total</span>
        </span>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : employees.length === 0 ? (
          <p className="text-slate-400 text-sm px-5 py-6 text-center">No employees on probation</p>
        ) : (
          employees.slice(0, 5).map((emp) => {
            const dotColor =
              emp.bucket === "overdue"
                ? "bg-red-500"
                : emp.bucket === "soon"
                  ? "bg-amber-500"
                  : "bg-emerald-500";
            const labelColor =
              emp.bucket === "overdue"
                ? "text-red-600 dark:text-red-400"
                : emp.bucket === "soon"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-500 dark:text-slate-400";
            const daysLabel =
              emp.daysLeft < 0
                ? `Overdue by ${Math.abs(emp.daysLeft)} day${Math.abs(emp.daysLeft) === 1 ? "" : "s"}`
                : emp.daysLeft === 0
                  ? "Ends today"
                  : `${emp.daysLeft} day${emp.daysLeft === 1 ? "" : "s"} left`;

            return (
              <div key={emp.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <a href={`/employees/${emp.id}`} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 relative`}>
                    {emp.name.charAt(0).toUpperCase()}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${dotColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{emp.name}</p>
                    <p className={`text-xs truncate ${labelColor} flex items-center gap-1`}>
                      {emp.bucket === "overdue" && <AlertTriangle className="w-3 h-3 shrink-0" />}
                      {daysLabel}
                    </p>
                  </div>
                </a>
                <button
                  onClick={() => handleConfirm(emp.id)}
                  disabled={confirmingId === emp.id}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 transition disabled:opacity-50 shrink-0"
                  title="Mark as Active (probation complete)"
                >
                  {confirmingId === emp.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Confirm
                </button>
              </div>
            );
          })
        )}
        {employees.length > 5 && (
          <div className="px-5 py-2.5 text-center">
            <a href="/employees?status=probation" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all {employees.length} on probation →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
