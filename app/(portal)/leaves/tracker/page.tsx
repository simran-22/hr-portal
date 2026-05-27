import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CalendarDays, Search } from "lucide-react";
import Link from "next/link";
import { LeaveTrackerExport } from "@/components/shared/LeaveTrackerExport";
import { HRReportsTabs } from "@/components/shared/HRReportsTabs";

const DEFAULTS = {
  privilege: 15,
  sick: 7,
  casual: 7,
};

type Row = {
  id: string;
  serial: number;
  name: string;
  department: string | null;
  hire_date: string | null;
  privilege: { accumulated: number; balance: number };
  sick: { accumulated: number; balance: number };
  casual: { accumulated: number; balance: number };
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function fmt(n: number) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

// Months elapsed in current year (or since hire_date if joined this year)
// — fractional, capped at 12. Matches the HR sheet's incremental accrual.
function monthsAccrued(hireDate: string | null, asOf: Date): number {
  const year = asOf.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const startDate = hireDate && new Date(hireDate) > yearStart ? new Date(hireDate) : yearStart;
  if (asOf < startDate) return 0;
  const ms = asOf.getTime() - startDate.getTime();
  const days = ms / (1000 * 60 * 60 * 24);
  // 365 days = 12 months
  return Math.min(12, days * (12 / 365));
}

async function getData(search?: string, dept?: string) {
  const now = new Date();
  const year = now.getFullYear();

  // Fetch employees (active + on_leave + probation; skip terminated)
  let q = supabase
    .from("employees")
    .select("id, name, hire_date, department_id, departments(name)")
    .neq("status", "terminated")
    .order("name");

  if (search) q = q.ilike("name", `%${search}%`);
  if (dept && dept !== "all") q = q.eq("department_id", dept);

  const { data: employees } = await q;
  const emps = (employees ?? []) as unknown as {
    id: string;
    name: string;
    hire_date: string | null;
    department_id: string | null;
    departments: { name: string } | null;
  }[];

  // Fetch all approved leaves this year in one go
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const { data: leaves } = await supabase
    .from("leaves")
    .select("employee_id, type, days")
    .eq("status", "approved")
    .gte("from_date", yearStart)
    .lte("from_date", yearEnd);

  const usedByEmp = new Map<string, { privilege: number; sick: number; casual: number }>();
  for (const l of (leaves ?? []) as { employee_id: string; type: string; days: number | null }[]) {
    const cur = usedByEmp.get(l.employee_id) ?? { privilege: 0, sick: 0, casual: 0 };
    const d = Number(l.days ?? 0);
    if (l.type === "annual") cur.privilege += d;
    else if (l.type === "sick") cur.sick += d;
    else if (l.type === "casual") cur.casual += d;
    usedByEmp.set(l.employee_id, cur);
  }

  const rows: Row[] = emps.map((e, idx) => {
    const months = monthsAccrued(e.hire_date, now);
    const acc = {
      privilege: round2((DEFAULTS.privilege / 12) * months),
      sick: round2((DEFAULTS.sick / 12) * months),
      casual: round2((DEFAULTS.casual / 12) * months),
    };
    const used = usedByEmp.get(e.id) ?? { privilege: 0, sick: 0, casual: 0 };
    return {
      id: e.id,
      serial: idx + 1,
      name: e.name,
      department: e.departments?.name ?? null,
      hire_date: e.hire_date,
      privilege: { accumulated: acc.privilege, balance: round2(acc.privilege - used.privilege) },
      sick: { accumulated: acc.sick, balance: round2(acc.sick - used.sick) },
      casual: { accumulated: acc.casual, balance: round2(acc.casual - used.casual) },
    };
  });

  return { rows, asOf: now.toISOString().slice(0, 10), year };
}

async function getDepartments() {
  const { data } = await supabase.from("departments").select("id, name").order("name");
  return data ?? [];
}

export default async function LeaveTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; department?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const [{ rows, asOf, year }, departments] = await Promise.all([
    getData(sp.search, sp.department),
    getDepartments(),
  ]);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">HR Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pro-rated leave balance for all employees · As of {asOf} · Year {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LeaveTrackerExport rows={rows} year={year} asOf={asOf} />
        </div>
      </div>

      <HRReportsTabs />

      {/* Filters */}
      <form className="flex gap-2 flex-wrap" action="/leaves/tracker">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="search"
            defaultValue={sp.search ?? ""}
            placeholder="Search by employee name..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          name="department"
          defaultValue={sp.department ?? "all"}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
        >
          Filter
        </button>
      </form>

      {/* Annual quota legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 font-medium">
          Privilege Leave · {DEFAULTS.privilege}/year
        </span>
        <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-medium">
          Sick Leave · {DEFAULTS.sick}/year
        </span>
        <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 font-medium">
          Casual Leave · {DEFAULTS.casual}/year
        </span>
      </div>

      {/* Matrix table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              {/* Type group header */}
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th colSpan={2} className="px-4 py-2 text-left bg-slate-50 dark:bg-slate-800/50" />
                <th colSpan={2} className="px-2 py-2 text-center bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-200 font-bold border-l border-orange-200 dark:border-orange-500/30">
                  Privilege Leave
                </th>
                <th colSpan={2} className="px-2 py-2 text-center bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-l border-slate-200 dark:border-slate-700">
                  Sick Leave
                </th>
                <th colSpan={2} className="px-2 py-2 text-center bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-200 font-bold border-l border-red-200 dark:border-red-500/30">
                  Casual Leave
                </th>
              </tr>
              {/* Annual quota row */}
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px]">
                <th colSpan={2} className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/50" />
                <th colSpan={2} className="px-2 py-1.5 text-center bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 font-semibold border-l border-orange-200/50">
                  {DEFAULTS.privilege}
                </th>
                <th colSpan={2} className="px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 font-semibold border-l border-slate-200">
                  {DEFAULTS.sick}
                </th>
                <th colSpan={2} className="px-2 py-1.5 text-center bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 font-semibold border-l border-red-200/50">
                  {DEFAULTS.casual}
                </th>
              </tr>
              {/* Column headers */}
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                <th className="px-4 py-2 text-left bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold w-16">
                  S.No.
                </th>
                <th className="px-4 py-2 text-left bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold">
                  Employee Name
                </th>
                <th className="px-2 py-2 text-center bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 font-semibold border-l border-orange-200/50">
                  Accumulated
                </th>
                <th className="px-2 py-2 text-center bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 font-semibold">
                  Balance
                </th>
                <th className="px-2 py-2 text-center bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 font-semibold border-l border-slate-200">
                  Accumulated
                </th>
                <th className="px-2 py-2 text-center bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 font-semibold">
                  Balance
                </th>
                <th className="px-2 py-2 text-center bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 font-semibold border-l border-red-200/50">
                  Accumulated
                </th>
                <th className="px-2 py-2 text-center bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 font-semibold">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    No employees found
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                >
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 tabular-nums">
                    {r.serial}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/employees/${r.id}`}
                      className="font-medium text-slate-800 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      {r.name}
                    </Link>
                    {r.department && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {r.department}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums bg-orange-50/40 dark:bg-orange-500/[0.04] border-l border-orange-100 dark:border-orange-500/20">
                    {fmt(r.privilege.accumulated)}
                  </td>
                  <td className={`px-2 py-2.5 text-center tabular-nums bg-orange-50/40 dark:bg-orange-500/[0.04] font-semibold ${r.privilege.balance < 0 ? "text-red-600" : "text-orange-700 dark:text-orange-300"}`}>
                    {fmt(r.privilege.balance)}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums bg-slate-50/40 dark:bg-slate-800/20 border-l border-slate-100 dark:border-slate-700">
                    {fmt(r.sick.accumulated)}
                  </td>
                  <td className={`px-2 py-2.5 text-center tabular-nums bg-slate-50/40 dark:bg-slate-800/20 font-semibold ${r.sick.balance < 0 ? "text-red-600" : "text-slate-700 dark:text-slate-300"}`}>
                    {fmt(r.sick.balance)}
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums bg-red-50/40 dark:bg-red-500/[0.04] border-l border-red-100 dark:border-red-500/20">
                    {fmt(r.casual.accumulated)}
                  </td>
                  <td className={`px-2 py-2.5 text-center tabular-nums bg-red-50/40 dark:bg-red-500/[0.04] font-semibold ${r.casual.balance < 0 ? "text-red-600" : "text-red-700 dark:text-red-300"}`}>
                    {fmt(r.casual.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
        <CalendarDays className="w-3.5 h-3.5" />
        Accumulated = pro-rated accrual based on months worked this year (capped at annual quota). Balance = Accumulated − Approved leaves used.
      </div>
    </div>
  );
}
