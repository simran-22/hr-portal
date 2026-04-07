import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { AddSalaryButton } from "@/components/shared/AddSalaryButton";
import { DollarSign } from "lucide-react";

async function getSalaryStructures(employeeId?: string) {
  let query = supabase
    .from("salary_structures")
    .select("*, employees(id, name)")
    .order("created_at", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data } = await query;
  return data ?? [];
}

export default async function SalaryPage() {
  const session = await getSession();
  const canManage = session && ["admin"].includes(session.role);
  const salaries = await getSalaryStructures(canManage ? undefined : session?.employeeId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Salary Structure</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            {salaries.length} salary structure{salaries.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        {canManage && <AddSalaryButton />}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Basic</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">HRA</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">DA</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Gross</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Deductions</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Net</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Effective Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No salary structures found</p>
                  </td>
                </tr>
              ) : (
                salaries.map((s: any) => {
                  const totalDeductions = (s.pf_deduction || 0) + (s.tax_deduction || 0) + (s.other_deductions || 0);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {s.employees?.name?.charAt(0) ?? "?"}
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{s.employees?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-600 dark:text-slate-400">${(s.basic || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600 dark:text-slate-400">${(s.hra || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600 dark:text-slate-400">${(s.da || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">${(s.gross || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-red-500 dark:text-red-400">${totalDeductions.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-violet-600 dark:text-violet-400">${(s.net || 0).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{s.effective_date ?? "N/A"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
