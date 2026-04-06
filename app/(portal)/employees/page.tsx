import { supabase } from "@/lib/supabase";
import { Users, Plus, Eye } from "lucide-react";
import { EmployeeFilters } from "@/components/shared/EmployeeFilters";

async function getEmployees(search?: string, status?: string, department?: string) {
  let query = supabase
    .from("employees")
    .select("id, name, employee_id, position, status, employment_type, join_date, departments(name), profiles(role)")
    .order("name");

  if (search) query = query.ilike("name", `%${search}%`);
  if (status && status !== "all") query = query.eq("status", status);
  if (department && department !== "all") query = query.eq("department_id", department);

  const { data, error } = await query;
  return { employees: data ?? [], error };
}

async function getDepartments() {
  const { data } = await supabase.from("departments").select("id, name").order("name");
  return data ?? [];
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    on_leave: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    terminated: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    probation: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    full_time: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
    part_time: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
    contract: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    intern: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[type] ?? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"}`}>
      {type?.replace(/_/g, " ")}
    </span>
  );
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const GRADIENT_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; department?: string }>;
}) {
  const sp = await searchParams;
  const { employees } = await getEmployees(sp.search, sp.status, sp.department);
  const departments = await getDepartments();

  const statusCounts = {
    all: employees.length,
    active: employees.filter((e: any) => e.status === "active").length,
    on_leave: employees.filter((e: any) => e.status === "on_leave").length,
    terminated: employees.filter((e: any) => e.status === "terminated").length,
    probation: employees.filter((e: any) => e.status === "probation").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Employees</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            {employees.length} total employee{employees.length !== 1 ? "s" : ""} across all departments
          </p>
        </div>
        <a
          href="/employees/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </a>
      </div>

      {/* Status Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "active", "on_leave", "terminated", "probation"] as const).map((s) => {
          const isActive = (sp.status ?? "all") === s;
          const colors: Record<string, string> = {
            all: "from-slate-500 to-slate-600",
            active: "from-emerald-500 to-teal-600",
            on_leave: "from-amber-400 to-orange-500",
            terminated: "from-red-500 to-rose-600",
            probation: "from-blue-500 to-cyan-600",
          };
          const params = new URLSearchParams(sp as Record<string, string>);
          if (s === "all") params.delete("status"); else params.set("status", s);
          return (
            <a
              key={s}
              href={`/employees?${params.toString()}`}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                isActive
                  ? `bg-gradient-to-r ${colors[s]} text-white shadow-sm`
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              <span className={`ml-1.5 ${isActive ? "opacity-80" : "text-slate-400 dark:text-slate-500"}`}>
                ({statusCounts[s]})
              </span>
            </a>
          );
        })}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <EmployeeFilters
          departments={departments}
          search={sp.search}
          department={sp.department}
          status={sp.status}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg">No employees found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Position</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {employees.map((emp: any, idx: number) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${GRADIENT_COLORS[idx % GRADIENT_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                          {getInitials(emp.name ?? "?")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{emp.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{emp.profiles?.role ?? "employee"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                        {emp.employee_id ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {emp.departments?.name ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {emp.position ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-4">{statusBadge(emp.status)}</td>
                    <td className="px-5 py-4">{typeBadge(emp.employment_type)}</td>
                    <td className="px-5 py-4">
                      <a
                        href={`/employees/${emp.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {employees.length > 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center">
          Showing {employees.length} employee{employees.length !== 1 ? "s" : ""}
          {sp.search ? ` matching "${sp.search}"` : ""}
        </p>
      )}
    </div>
  );
}
