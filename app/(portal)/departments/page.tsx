import { supabase } from "@/lib/supabase";
import { Building2, Plus, Users, Briefcase } from "lucide-react";

async function getDepartments() {
  const { data } = await supabase
    .from("departments")
    .select("id, name, description, employees(count)")
    .order("name");
  return data ?? [];
}

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Departments</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{departments.length} departments in your organisation</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {departments.map((dept: any, i: number) => {
          const count = dept.employees?.[0]?.count ?? 0;
          return (
            <div key={dept.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center shadow-lg`}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  Active
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{dept.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4 line-clamp-2">
                {dept.description ?? "No description provided."}
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>{count} employee{count !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Briefcase className="w-4 h-4" />
                  <span>0 open roles</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
