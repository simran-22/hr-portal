import { supabase } from "@/lib/supabase";
import { ArrowDownRight, ArrowUpRight, DollarSign, Search, Filter } from "lucide-react";
import { GeneratePayrollButton } from "@/components/shared/GeneratePayrollButton";
import { PayrollRowActions } from "@/components/shared/PayrollRowActions";
import { getSession } from "@/lib/session";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type PayrollRow = {
  id: string;
  month: number;
  year: number;
  basic: number | null;
  allowances: number | null;
  deductions: number | null;
  net: number | null;
  status: string;
  employees: {
    name: string;
    email: string | null;
    position: string | null;
    departments: { name: string } | null;
  } | null;
};

async function getPayroll(month: number, year: number, search: string) {
  let query = supabase
    .from("payroll")
    .select(
      "id, month, year, basic, allowances, deductions, net, status, employees(name, email, position, departments(name))"
    )
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: false });

  const { data } = await query;
  let payrolls = (data ?? []) as unknown as PayrollRow[];

  if (search) {
    const q = search.toLowerCase();
    payrolls = payrolls.filter(
      (p) =>
        p.employees?.name?.toLowerCase().includes(q) ||
        p.employees?.email?.toLowerCase().includes(q) ||
        p.employees?.position?.toLowerCase().includes(q)
    );
  }

  // Previous month for trend
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const { data: prevData } = await supabase
    .from("payroll")
    .select("net, employees(position)")
    .eq("month", prevMonth)
    .eq("year", prevYear);

  return { payrolls, prevData: (prevData ?? []) as unknown as { net: number | null; employees: { position: string | null } | null }[] };
}

function buildRoleStats(
  current: PayrollRow[],
  previous: { net: number | null; employees: { position: string | null } | null }[]
) {
  const sumByRole = (records: { net: number | null; position: string | null }[]) => {
    const map = new Map<string, number>();
    for (const r of records) {
      const key = r.position?.trim() || "Unassigned";
      map.set(key, (map.get(key) ?? 0) + (Number(r.net) || 0));
    }
    return map;
  };
  const cur = sumByRole(current.map((p) => ({ net: p.net, position: p.employees?.position ?? null })));
  const prev = sumByRole(previous.map((p) => ({ net: p.net, position: p.employees?.position ?? null })));

  const roles = Array.from(cur.entries())
    .map(([role, total]) => {
      const prevTotal = prev.get(role) ?? 0;
      const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;
      return { role, total, change };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  return roles;
}

const statusBadge = (status: string) => {
  const isPaid = status === "paid";
  const isProcessing = status === "processing";
  const isCancelled = status === "cancelled";
  const cls = isPaid
    ? "bg-cyan-500 text-white"
    : isProcessing
      ? "bg-blue-500 text-white"
      : isCancelled
        ? "bg-red-500 text-white"
        : "bg-amber-400 text-white";
  const label = isPaid ? "Done" : isProcessing ? "Processing" : isCancelled ? "Cancelled" : "Pending";
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-md ${cls}`}>
      {label}
    </span>
  );
};

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const avatarColors = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-blue-500 to-cyan-600",
  "from-indigo-500 to-blue-600",
];

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; q?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));
  const year = parseInt(sp.year ?? String(now.getFullYear()));
  const search = sp.q ?? "";
  const activeTab = sp.tab ?? "salary";

  const session = await getSession();
  const canManage = session && ["admin"].includes(session.role);

  const { payrolls, prevData } = await getPayroll(month, year, search);
  const roleStats = buildRoleStats(payrolls, prevData);

  const years = [2023, 2024, 2025, 2026];

  return (
    <div className="space-y-5">
      {/* Top bar — title, year filter, search */}
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-xl font-bold text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500 pb-1">
          Payroll
        </h2>

        <form className="flex items-center gap-3 flex-1" method="get">
          {/* preserve other params */}
          <input type="hidden" name="tab" value={activeTab} />

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              name="month"
              defaultValue={month}
              className="text-sm bg-transparent focus:outline-none text-slate-700 dark:text-slate-300"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              name="year"
              defaultValue={year}
              className="text-sm bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 ml-2"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="q"
              defaultValue={search}
              placeholder="Search..."
              className="pl-9 pr-3 py-1.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </form>
      </div>

      {/* Sub-tabs + Add button */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <nav className="flex items-center gap-6">
          <a
            href={`?month=${month}&year=${year}&tab=salary`}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === "salary"
                ? "text-cyan-600 dark:text-cyan-400 border-cyan-500"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Employee Salary
          </a>
          <a
            href={`?month=${month}&year=${year}&tab=payslip`}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === "payslip"
                ? "text-cyan-600 dark:text-cyan-400 border-cyan-500"
                : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Payslip
          </a>
        </nav>
        {canManage && <div className="pb-2"><GeneratePayrollButton /></div>}
      </div>

      {/* Role stat cards */}
      {roleStats.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {roleStats.map(({ role, total, change }) => {
            const isUp = change != null && change >= 0;
            return (
              <div
                key={role}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800"
              >
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{role}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{formatCurrency(total)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                  {change == null ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <>
                      <span className={`inline-flex items-center gap-0.5 font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change).toFixed(2)}%
                      </span>
                      <span>Since last month</span>
                    </>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Employee table */}
      {activeTab === "salary" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Employee</p>
            <span className="text-xs text-slate-400">{payrolls.length} record{payrolls.length !== 1 ? "s" : ""}</span>
          </div>

          {payrolls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg">No payroll records</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {search ? `No results for "${search}"` : `No records for ${MONTHS[month - 1]} ${year}`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-semibold w-12">#</th>
                    <th className="text-left px-5 py-3 font-semibold">Employee</th>
                    <th className="text-left px-5 py-3 font-semibold">Role</th>
                    <th className="text-left px-5 py-3 font-semibold">Salary</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                    <th className="text-left px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p, i) => {
                    const initial = p.employees?.name?.charAt(0).toUpperCase() ?? "?";
                    const colorClass = avatarColors[i % avatarColors.length];
                    return (
                      <tr
                        key={p.id}
                        className={`${i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/30"} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition`}
                      >
                        <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 truncate">
                                {p.employees?.name ?? "Unknown"}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{p.employees?.email ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                          {p.employees?.position ?? "—"}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {formatCurrency(p.net ?? 0)}
                        </td>
                        <td className="px-5 py-3.5">{statusBadge(p.status)}</td>
                        <td className="px-5 py-3.5">
                          <PayrollRowActions
                            id={p.id}
                            email={p.employees?.email ?? null}
                            canDelete={!!canManage}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payslip tab placeholder */}
      {activeTab === "payslip" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm py-16 text-center">
          <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-700 dark:text-slate-200 font-semibold">Payslip view</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Per-employee printable payslips coming soon.</p>
        </div>
      )}
    </div>
  );
}
