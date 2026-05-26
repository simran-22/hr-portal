import { supabase } from "@/lib/supabase";
import { GitBranch, User } from "lucide-react";
import Link from "next/link";

type Emp = {
  id: string;
  name: string;
  position: string | null;
  departments: { name: string } | null;
};

async function getEmployees() {
  const { data } = await supabase
    .from("employees")
    .select("id, name, position, departments(name)")
    .eq("status", "active")
    .order("name");
  return (data ?? []) as unknown as Emp[];
}

// Subtle icon accents — rotated per tile
const ICON_ACCENTS = [
  "text-violet-500",
  "text-emerald-500",
  "text-blue-500",
  "text-orange-500",
  "text-pink-500",
  "text-indigo-500",
  "text-cyan-500",
  "text-amber-500",
];

export default async function OrgChartPage() {
  const employees = await getEmployees();

  // Group by department for the headings
  const grouped = new Map<string, Emp[]>();
  for (const e of employees) {
    const key = e.departments?.name ?? "Unassigned";
    const list = grouped.get(key) ?? [];
    list.push(e);
    grouped.set(key, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Organization</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          {employees.length} active employee{employees.length !== 1 ? "s" : ""} across {grouped.size} department{grouped.size !== 1 ? "s" : ""}
        </p>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <GitBranch className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg">No employees yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Add employees to see them here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([deptName, emps]) => (
            <section key={deptName}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                {deptName}
                <span className="text-xs font-normal text-slate-400">·</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  {emps.length} {emps.length === 1 ? "person" : "people"}
                </span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {emps.map((emp, i) => {
                  const accent = ICON_ACCENTS[(emp.name.charCodeAt(0) + i) % ICON_ACCENTS.length];
                  return (
                    <Link
                      key={emp.id}
                      href={`/employees/${emp.id}`}
                      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-500/30 transition-all p-4 flex flex-col items-center text-center group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        <User className={`w-6 h-6 ${accent}`} strokeWidth={1.75} />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate w-full">
                        {emp.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate w-full mt-0.5">
                        {emp.position ?? "—"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
