import { supabase } from "@/lib/supabase";
import { BarChart3, Users, CalendarOff, DollarSign, Briefcase, Download } from "lucide-react";

async function getReportData() {
  const [
    { count: totalEmployees },
    { count: activeEmployees },
    { count: pendingLeaves },
    { count: approvedLeaves },
    { count: openJobs },
    { count: totalCandidates },
    { data: deptData },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("candidates").select("*", { count: "exact", head: true }),
    supabase.from("departments").select("id, name, employees(count)").order("name"),
  ]);
  return { totalEmployees: totalEmployees ?? 0, activeEmployees: activeEmployees ?? 0, pendingLeaves: pendingLeaves ?? 0, approvedLeaves: approvedLeaves ?? 0, openJobs: openJobs ?? 0, totalCandidates: totalCandidates ?? 0, deptData: deptData ?? [] };
}

const REPORT_CARDS = [
  { title: "Employee Report", desc: "Full employee directory with status and department breakdown", icon: Users, gradient: "from-violet-500 to-purple-600" },
  { title: "Leave Report", desc: "Leave requests, approvals and balance summary", icon: CalendarOff, gradient: "from-amber-400 to-orange-500" },
  { title: "Payroll Report", desc: "Monthly salary disbursement and deduction report", icon: DollarSign, gradient: "from-emerald-400 to-teal-600" },
  { title: "Recruitment Report", desc: "Job postings, candidate pipeline and hiring funnel", icon: Briefcase, gradient: "from-blue-500 to-cyan-600" },
];

export default async function ReportsPage() {
  const d = await getReportData();

  const summaryStats = [
    { label: "Total Employees", value: d.totalEmployees, sub: `${d.activeEmployees} active` },
    { label: "Leave Requests", value: d.approvedLeaves + d.pendingLeaves, sub: `${d.pendingLeaves} pending` },
    { label: "Open Positions", value: d.openJobs, sub: "Active job postings" },
    { label: "Candidates", value: d.totalCandidates, sub: "In pipeline" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Reports</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">Generate and download HR reports</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryStats.map(({ label, value, sub }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {REPORT_CARDS.map((r) => (
          <div key={r.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <r.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{r.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{r.desc}</p>
              <button className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Department Headcount */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Headcount by Department</h3>
        </div>
        <div className="p-5 space-y-3">
          {d.deptData.map((dept: any) => {
            const count = dept.employees?.[0]?.count ?? 0;
            const pct = d.totalEmployees > 0 ? Math.round((count / d.totalEmployees) * 100) : 0;
            return (
              <div key={dept.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{dept.name}</span>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{count} <span className="text-xs text-slate-400">({pct}%)</span></span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
