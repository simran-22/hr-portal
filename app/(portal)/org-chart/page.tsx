import { supabase } from "@/lib/supabase";
import { GitBranch, Building2, Users } from "lucide-react";

async function getOrgData() {
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, position, department_id, departments(name)")
    .eq("status", "active")
    .order("name");

  // Group employees by department
  const deptMap = new Map<string, { name: string; employees: typeof employees }>();
  const unassigned: NonNullable<typeof employees> = [];

  (departments ?? []).forEach((d) => {
    deptMap.set(d.id, { name: d.name, employees: [] });
  });

  (employees ?? []).forEach((e: any) => {
    if (e.department_id && deptMap.has(e.department_id)) {
      deptMap.get(e.department_id)!.employees!.push(e);
    } else {
      unassigned.push(e);
    }
  });

  return { deptMap, unassigned, totalEmployees: employees?.length ?? 0 };
}

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default async function OrgChartPage() {
  const { deptMap, unassigned, totalEmployees } = await getOrgData();
  const depts = Array.from(deptMap.entries());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Organization Chart</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{totalEmployees} employees across {depts.length} departments</p>
      </div>

      {totalEmployees === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <GitBranch className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg">No employees found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Add employees to build the org chart</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Company node */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl px-8 py-4 text-center shadow-lg">
              <Building2 className="w-8 h-8 text-white mx-auto mb-1" />
              <p className="text-white font-bold text-lg">HR Portal</p>
              <p className="text-white/70 text-sm">{totalEmployees} employees · {depts.length} departments</p>
            </div>
          </div>

          {/* Connector line */}
          <div className="flex justify-center">
            <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Horizontal connector */}
          <div className="relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-0.5 bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Departments grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {depts.map(([deptId, dept], i) => (
              <div key={deptId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Department header */}
                <div className={`bg-gradient-to-r ${GRADIENTS[i % GRADIENTS.length]} px-5 py-4`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{dept.name}</h3>
                      <p className="text-white/70 text-xs">{dept.employees!.length} member{dept.employees!.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>

                {/* Employees */}
                <div className="p-4">
                  {dept.employees!.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No employees yet</p>
                  ) : (
                    <div className="space-y-2">
                      {(dept.employees as any[])!.map((emp: any, j: number) => (
                        <a
                          key={emp.id}
                          href={`/employees/${emp.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${GRADIENTS[(i + j) % GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                            {getInitials(emp.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                              {emp.name}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                              {emp.position ?? "No position"}
                            </p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Active" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Unassigned employees */}
            {unassigned.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-400 to-slate-500 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Unassigned</h3>
                      <p className="text-white/70 text-xs">{unassigned.length} member{unassigned.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {(unassigned as any[]).map((emp: any) => (
                    <a
                      key={emp.id}
                      href={`/employees/${emp.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {getInitials(emp.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                          {emp.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {emp.position ?? "No position"}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
