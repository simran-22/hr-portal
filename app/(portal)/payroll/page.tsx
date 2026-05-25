import { supabase } from "@/lib/supabase";
import { ArrowDownRight, ArrowUpRight, DollarSign, Search, Filter, FileText, ExternalLink, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Money } from "@/components/shared/Money";
import { CurrencyToggle } from "@/components/shared/CurrencyToggle";
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
  tax: number | null;
  reimbursement: number | null;
  benefits: number | null;
  post_tax_deductions: number | null;
  payment_method: string | null;
  net: number | null;
  status: string;
  employees: {
    id: string;
    name: string;
    email: string | null;
    position: string | null;
    departments: { name: string } | null;
  } | null;
};

const paymentMethodLabel = (method: string | null) => {
  const map: Record<string, string> = {
    direct_deposit: "Direct Deposit",
    cheque: "Cheque",
    cash: "Cash",
    upi: "UPI",
  };
  return map[method ?? "direct_deposit"] ?? "Direct Deposit";
};

async function getPayroll(month: number, year: number, search: string) {
  let query = supabase
    .from("payroll")
    .select(
      "id, month, year, basic, allowances, deductions, tax, reimbursement, benefits, post_tax_deductions, payment_method, net, status, employees(id, name, email, position, departments(name))"
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
    .select("net, basic, allowances, reimbursement, benefits, employee_id, employees(id, position)")
    .eq("month", prevMonth)
    .eq("year", prevYear);

  return {
    payrolls,
    prevData: (prevData ?? []) as unknown as {
      net: number | null;
      basic: number | null;
      allowances: number | null;
      reimbursement: number | null;
      benefits: number | null;
      employee_id: string;
      employees: { id: string; position: string | null } | null;
    }[],
  };
}

function earningsFor(p: PayrollRow): number {
  return Number(p.basic ?? 0) + Number(p.allowances ?? 0) + Number(p.reimbursement ?? 0) + Number(p.benefits ?? 0);
}

function buildEarningsChangeMap(
  previous: {
    net: number | null;
    basic: number | null;
    allowances: number | null;
    reimbursement: number | null;
    benefits: number | null;
    employee_id: string;
  }[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of previous) {
    const earn = Number(p.basic ?? 0) + Number(p.allowances ?? 0) + Number(p.reimbursement ?? 0) + Number(p.benefits ?? 0);
    map.set(p.employee_id, earn);
  }
  return map;
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
  const earningsChangeMap = buildEarningsChangeMap(prevData);

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

        <CurrencyToggle />
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
        {canManage && (
          <div className="pb-2 flex items-center gap-2">
            <Link
              href="/payroll/run"
              className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 rounded-md px-4 py-1.5 text-sm font-medium shadow-sm transition-all"
            >
              <PlayCircle className="w-4 h-4" /> Run Payroll
            </Link>
            <GeneratePayrollButton />
          </div>
        )}
      </div>

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
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="text-left px-4 py-3 font-semibold w-10">#</th>
                    <th className="text-left px-4 py-3 font-semibold">Employee</th>
                    <th className="text-right px-4 py-3 font-semibold">Earnings</th>
                    <th className="text-right px-4 py-3 font-semibold">Tax</th>
                    <th className="text-right px-4 py-3 font-semibold">Reimbursement</th>
                    <th className="text-right px-4 py-3 font-semibold">Benefits</th>
                    <th className="text-right px-4 py-3 font-semibold">Post-tax Ded.</th>
                    <th className="text-right px-4 py-3 font-semibold">Net Pay</th>
                    <th className="text-left px-4 py-3 font-semibold">Payment</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p, i) => {
                    const initial = p.employees?.name?.charAt(0).toUpperCase() ?? "?";
                    const colorClass = avatarColors[i % avatarColors.length];
                    const earnings = earningsFor(p);
                    const prevEarn = p.employees?.id ? earningsChangeMap.get(p.employees.id) : undefined;
                    const change = prevEarn && prevEarn > 0 ? ((earnings - prevEarn) / prevEarn) * 100 : null;
                    const isUp = change != null && change >= 0;
                    return (
                      <tr
                        key={p.id}
                        className={`${i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/30"} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-t border-slate-50 dark:border-slate-800`}
                      >
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-cyan-600 dark:text-cyan-400 truncate">
                                {p.employees?.name ?? "Unknown"}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{p.employees?.position ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <p className="font-medium text-violet-600 dark:text-violet-400"><Money amount={earnings} /></p>
                          {change != null ? (
                            <p className={`text-[10px] ${isUp ? "text-emerald-500" : "text-red-500"} flex items-center gap-0.5 justify-end`}>
                              {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              change {isUp ? "+" : ""}{change.toFixed(0)}%
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400">—</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-violet-600 dark:text-violet-400">
                          <Money amount={Number(p.tax ?? 0)} />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-violet-600 dark:text-violet-400">
                          <Money amount={Number(p.reimbursement ?? 0)} />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-violet-600 dark:text-violet-400">
                          <Money amount={Number(p.benefits ?? 0)} />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-violet-600 dark:text-violet-400">
                          <Money amount={Number(p.post_tax_deductions ?? 0)} />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800 dark:text-slate-100">
                          <Money amount={Number(p.net ?? 0)} />
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                          {paymentMethodLabel(p.payment_method)}
                        </td>
                        <td className="px-4 py-3">{statusBadge(p.status)}</td>
                        <td className="px-4 py-3">
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

      {/* Payslip tab — list with open links */}
      {activeTab === "payslip" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-500" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Payslips</p>
            <span className="ml-auto text-xs text-slate-400">{MONTHS[month - 1]} {year} · {payrolls.length} payslip{payrolls.length !== 1 ? "s" : ""}</span>
          </div>
          {payrolls.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-slate-700 dark:text-slate-200 font-semibold">No payslips for {MONTHS[month - 1]} {year}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Generate payroll first to view payslips here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {payrolls.map((p, i) => {
                const initial = p.employees?.name?.charAt(0).toUpperCase() ?? "?";
                const colorClass = avatarColors[i % avatarColors.length];
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {p.employees?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {p.employees?.position ?? "—"} · {p.employees?.email ?? ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 mr-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums"><Money amount={Number(p.net ?? 0)} /></p>
                      <p className="text-xs text-slate-400">{statusBadge(p.status)}</p>
                    </div>
                    <a
                      href={`/payroll/${p.id}/payslip`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/20 transition shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Payslip
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
