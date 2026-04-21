"use client";

import { useEffect, useState } from "react";
import { Download, AlertCircle, Loader2, Banknote, Users as UsersIcon, TrendingUp } from "lucide-react";

type Row = {
  id: string;
  name: string;
  uan: string | null;
  pfNumber: string | null;
  department: string | null;
  basic: number;
  employeePF: number;
  epsContribution: number;
  epfContribution: number;
  employerTotal: number;
  grandTotal: number;
};

type Report = {
  month: number;
  year: number;
  monthLabel: string;
  deadline: string;
  rows: Row[];
  totals: {
    basic: number;
    employeePF: number;
    epsContribution: number;
    epfContribution: number;
    employerTotal: number;
    grandTotal: number;
  };
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PFReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/payroll/pf?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((d) => setReport(d))
      .finally(() => setLoading(false));
  }, [month, year]);

  const deadline = report ? new Date(report.deadline + "T00:00:00") : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysToDeadline = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const deadlineColor =
    daysToDeadline == null
      ? "bg-slate-50 text-slate-600 border-slate-200"
      : daysToDeadline < 0
        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
        : daysToDeadline <= 3
          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
          : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i, 1).toLocaleDateString("en-US", { month: "long" }),
  }));
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const summary = [
    {
      label: "Employees",
      value: report?.rows.length ?? 0,
      icon: UsersIcon,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      label: "Total Basic",
      value: report ? inr(report.totals.basic) : "—",
      icon: Banknote,
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      label: "Employee PF",
      value: report ? inr(report.totals.employeePF) : "—",
      icon: TrendingUp,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      label: "Grand Total Payable",
      value: report ? inr(report.totals.grandTotal) : "—",
      icon: Banknote,
      gradient: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">PF Report</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Monthly Provident Fund deductions & employer contributions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <a
            href={`/api/payroll/pf?month=${month}&year=${year}&format=csv`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>
      </div>

      {/* Deadline banner */}
      {report && daysToDeadline != null && (
        <div className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${deadlineColor}`}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">
              {daysToDeadline < 0
                ? `Overdue by ${Math.abs(daysToDeadline)} day${Math.abs(daysToDeadline) === 1 ? "" : "s"}`
                : daysToDeadline === 0
                  ? "Due today"
                  : `Due in ${daysToDeadline} day${daysToDeadline === 1 ? "" : "s"}`}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              PF deposit deadline: {deadline?.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })} (15th of {report.monthLabel.split(" ")[0] === months[(month) % 12].label ? "next month" : "the following month"})
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {summary.map(({ label, value, icon: Icon, gradient }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4"
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-500 dark:text-slate-400 text-xs">{label}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Employee-wise Breakdown</h3>
          <span className="ml-auto text-xs text-slate-400">{report?.monthLabel}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          </div>
        ) : !report || report.rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">No PF-applicable employees found.</p>
            <p className="text-slate-400 text-xs mt-1">Make sure employees have <strong>basic salary</strong> set and <strong>PF Applicable</strong> is enabled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">UAN</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Basic</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee PF</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">EPS (8.33%)</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">EPF</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employer Total</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {report.rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <a href={`/employees/${r.id}`} className="text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-400">
                        {r.name}
                      </a>
                      {r.department && <p className="text-xs text-slate-400">{r.department}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600 dark:text-slate-400">
                      {r.uan ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {inr(r.basic)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {inr(r.employeePF)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {inr(r.epsContribution)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {inr(r.epfContribution)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 text-right tabular-nums">
                      {inr(r.employerTotal)}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 text-right tabular-nums">
                      {inr(r.grandTotal)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-800/50 font-semibold">
                  <td className="px-5 py-3.5 text-sm text-slate-800 dark:text-slate-100" colSpan={2}>
                    TOTAL
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-800 dark:text-slate-100 text-right tabular-nums">
                    {inr(report.totals.basic)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-800 dark:text-slate-100 text-right tabular-nums">
                    {inr(report.totals.employeePF)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-800 dark:text-slate-100 text-right tabular-nums">
                    {inr(report.totals.epsContribution)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-800 dark:text-slate-100 text-right tabular-nums">
                    {inr(report.totals.epfContribution)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-800 dark:text-slate-100 text-right tabular-nums">
                    {inr(report.totals.employerTotal)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-violet-700 dark:text-violet-400 text-right tabular-nums">
                    {inr(report.totals.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500 dark:text-slate-400">
              <p>Rates: Employee 12% · Employer 12% (EPS 8.33% on ₹15,000 ceiling + EPF remainder)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
