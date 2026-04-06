import { supabase } from "@/lib/supabase";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react";

async function getPayrollSummary() {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("payroll")
    .select("month, basic, allowances, deductions, net, status")
    .eq("year", year)
    .order("month");
  return data ?? [];
}

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function AccountsPage() {
  const payroll = await getPayrollSummary();

  const totalNet = payroll.reduce((s, p) => s + (p.net ?? 0), 0);
  const totalBasic = payroll.reduce((s, p) => s + (p.basic ?? 0), 0);
  const totalDeductions = payroll.reduce((s, p) => s + (p.deductions ?? 0), 0);
  const totalAllowances = payroll.reduce((s, p) => s + (p.allowances ?? 0), 0);

  const stats = [
    { label: "Total Disbursed", value: `$${totalNet.toLocaleString()}`, icon: Wallet, gradient: "from-violet-500 to-purple-600", sub: `${new Date().getFullYear()} YTD` },
    { label: "Total Basic", value: `$${totalBasic.toLocaleString()}`, icon: DollarSign, gradient: "from-blue-500 to-cyan-600", sub: "Gross salary" },
    { label: "Total Allowances", value: `$${totalAllowances.toLocaleString()}`, icon: TrendingUp, gradient: "from-emerald-400 to-teal-600", sub: "Benefits & extras" },
    { label: "Total Deductions", value: `$${totalDeductions.toLocaleString()}`, icon: TrendingDown, gradient: "from-red-400 to-rose-600", sub: "Tax & others" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Accounts</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">Financial overview for {new Date().getFullYear()}</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, gradient, sub }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Monthly Payroll Breakdown</h3>
        </div>
        {payroll.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No payroll records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  {["Month","Basic","Allowances","Deductions","Net Pay","Status"].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {payroll.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">{months[(p.month ?? 1) - 1]} {new Date().getFullYear()}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">${(p.basic ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-emerald-600 dark:text-emerald-400">+${(p.allowances ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-red-500 dark:text-red-400">-${(p.deductions ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">${(p.net ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        p.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                        p.status === "processed" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
