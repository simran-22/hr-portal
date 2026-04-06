import { supabase } from "@/lib/supabase";
import { GitBranch } from "lucide-react";
import { OrgChartView } from "@/components/shared/OrgChart";

async function getEmployeesForOrgChart() {
  const { data } = await supabase
    .from("employees")
    .select("id, name, position, manager_id, departments(name)")
    .eq("status", "active")
    .order("name");
  return data ?? [];
}

export default async function OrgChartPage() {
  const employees = await getEmployeesForOrgChart();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Organization Chart</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">Visual reporting structure of your organization</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 min-h-[400px]">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <GitBranch className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg">No employees found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Add employees and assign managers to build the org chart</p>
          </div>
        ) : (
          <OrgChartView employees={employees as any} />
        )}
      </div>
    </div>
  );
}
