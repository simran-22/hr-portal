import { supabase } from "@/lib/supabase";
import { DollarSign, CheckCircle, FileText, TrendingUp } from "lucide-react";
import { GeneratePayrollButton } from "@/components/shared/GeneratePayrollButton";
import { getSession } from "@/lib/session";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function getPayroll(month: number, year: number) {
  const { data, error } = await supabase
    .from("payroll")
    .select(
      "id, month, year, basic, allowances, deductions, net, status, employees(name, employee_id, department_id, departments(name))"
    )
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: false });

  const payrolls = data ?? [];
  const totalNet = payrolls.reduce((sum: number, p: any) => sum + (p.net ?? 0), 0);
  const totalPaid = payrolls.filter((p: any) => p.status === "paid").length;
  const totalDraft = payrolls.filter((p: any) => p.status === "draft").length;

  return { payrolls, stats: { totalNet, totalPaid, totalDraft, total: payrolls.length }, error };
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    draft: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);
}

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));
  const year = parseInt(sp.year ?? String(now.getFullYear()));

  const session = await getSession();
  const canManage = session && ["admin"].includes(session.role);

  const { payrolls, stats } = await getPayroll(month, year);

  const statCards = [
    {
      label: "Total Payroll",
      value: formatCurrency(stats.totalNet),
      icon: DollarSign,
      gradient: "from-emerald-400 to-teal-600",
      sub: `${stats.total} records`,
    },
    {
      label: "Total Paid",
      value: stats.totalPaid,
      icon: CheckCircle,
      gradient: "from-blue-500 to-cyan-600",
      sub: "processed entries",
    },
    {
      label: "Total Draft",
      value: stats.totalDraft,
      icon: FileText,
      gradient: "from-amber-400 to-orange-500",
      sub: "pending review",
    },
  ];

  const years = [2023, 2024, 2025, 2026];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Payroll</h2>
          <p className="text-slate-500 mt-0.5">
            {MONTHS[month - 1]} {year} — {stats.total} record{stats.total !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && <GeneratePayrollButton />}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map(({ label, value, icon: Icon, gradient, sub }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">{label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Period Filter */}
      <form className="flex items-center gap-3" method="get">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <select
            name="month"
            defaultValue={month}
            className="text-sm bg-transparent focus:outline-none text-slate-700"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <select
          name="year"
          defaultValue={year}
          className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none text-slate-700"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {payrolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-4 shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-slate-800 font-semibold text-lg">No payroll records</h3>
            <p className="text-slate-500 text-sm mt-1">
              No records found for {MONTHS[month - 1]} {year}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Basic</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Allowances</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deductions</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Pay</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payrolls.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {p.employees?.name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p.employees?.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{p.employees?.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {p.employees?.departments?.name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700 text-right font-medium">
                      {formatCurrency(p.basic ?? 0)}
                    </td>
                    <td className="px-5 py-4 text-sm text-emerald-600 text-right font-medium">
                      +{formatCurrency(p.allowances ?? 0)}
                    </td>
                    <td className="px-5 py-4 text-sm text-red-500 text-right font-medium">
                      -{formatCurrency(p.deductions ?? 0)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(p.net ?? 0)}</span>
                    </td>
                    <td className="px-5 py-4">{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={2} className="px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase">
                    Totals
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-700 text-right">
                    {formatCurrency(payrolls.reduce((s: number, p: any) => s + (p.basic ?? 0), 0))}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-emerald-600 text-right">
                    +{formatCurrency(payrolls.reduce((s: number, p: any) => s + (p.allowances ?? 0), 0))}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-red-500 text-right">
                    -{formatCurrency(payrolls.reduce((s: number, p: any) => s + (p.deductions ?? 0), 0))}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-800 text-right">
                    {formatCurrency(stats.totalNet)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
