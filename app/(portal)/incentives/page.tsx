import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { AddIncentiveButton } from "@/components/shared/AddIncentiveButton";
import { IncentiveActions } from "@/components/shared/IncentiveActions";
import { Gift, Clock, CheckCircle, Banknote } from "lucide-react";

async function getIncentives(employeeId?: string) {
  let query = supabase
    .from("incentives")
    .select("*, employees(id, name)")
    .order("created_at", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data } = await query;
  return data ?? [];
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  paid: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
};

const typeLabels: Record<string, string> = {
  performance: "Performance",
  festival: "Festival",
  referral: "Referral",
  one_time: "One-time",
};

export default async function IncentivesPage() {
  const session = await getSession();
  const canManage = session && ["admin", "hr"].includes(session.role);
  const incentives = await getIncentives(canManage ? undefined : session?.employeeId);

  const totalAmount = incentives.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
  const pending = incentives.filter((i: any) => i.status === "pending");
  const approved = incentives.filter((i: any) => i.status === "approved");
  const paid = incentives.filter((i: any) => i.status === "paid");

  const stats = [
    { label: "Total Incentives", value: `$${totalAmount.toLocaleString()}`, count: incentives.length, icon: Gift, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-500/10" },
    { label: "Pending", value: `$${pending.reduce((s: number, i: any) => s + (i.amount || 0), 0).toLocaleString()}`, count: pending.length, icon: Clock, gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Approved", value: `$${approved.reduce((s: number, i: any) => s + (i.amount || 0), 0).toLocaleString()}`, count: approved.length, icon: CheckCircle, gradient: "from-emerald-400 to-teal-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Paid", value: `$${paid.reduce((s: number, i: any) => s + (i.amount || 0), 0).toLocaleString()}`, count: paid.length, icon: Banknote, gradient: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Incentives</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">Manage employee incentives and bonuses</p>
        </div>
        {canManage && <AddIncentiveButton />}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map(({ label, value, count, icon: Icon, gradient }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{count} incentive{count !== 1 ? "s" : ""}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Type</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Amount</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Reason</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                {canManage && <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {incentives.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="text-center py-12 text-slate-400">
                    <Gift className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No incentives found</p>
                  </td>
                </tr>
              ) : (
                incentives.map((inc: any) => (
                  <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {inc.employees?.name?.charAt(0) ?? "?"}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{inc.employees?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 capitalize">{typeLabels[inc.type] ?? inc.type}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-300">${(inc.amount || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{inc.reason || "-"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[inc.status] ?? ""}`}>
                        {inc.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5">
                        <IncentiveActions id={inc.id} status={inc.status} />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
