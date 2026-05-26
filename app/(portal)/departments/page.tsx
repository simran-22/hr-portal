import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { AddDepartmentButton } from "@/components/shared/AddDepartmentButton";
import { DepartmentActions } from "@/components/shared/DepartmentActions";
import { Building2, Users } from "lucide-react";

type Department = { id: string; name: string; description: string | null };

type Employee = {
  id: string;
  name: string;
  position: string | null;
  department_id: string | null;
  reports_to: string | null;
};

type TreeNode = Employee & { children: TreeNode[] };

// Subtle accent colors for department icons (light tint + matching dot)
const DEPT_ACCENTS = [
  { bg: "bg-slate-100 dark:bg-slate-800",   icon: "text-slate-600 dark:text-slate-400",     dot: "bg-slate-500" },
  { bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  { bg: "bg-blue-50 dark:bg-blue-500/10",       icon: "text-blue-600 dark:text-blue-400",       dot: "bg-blue-500" },
  { bg: "bg-orange-50 dark:bg-orange-500/10",   icon: "text-orange-600 dark:text-orange-400",   dot: "bg-orange-500" },
  { bg: "bg-pink-50 dark:bg-pink-500/10",       icon: "text-pink-600 dark:text-pink-400",       dot: "bg-pink-500" },
  { bg: "bg-violet-50 dark:bg-violet-500/10",   icon: "text-violet-600 dark:text-violet-400",   dot: "bg-violet-500" },
  { bg: "bg-indigo-50 dark:bg-indigo-500/10",   icon: "text-indigo-600 dark:text-indigo-400",   dot: "bg-indigo-500" },
];

async function getData() {
  const [{ data: departments }, { data: employees }] = await Promise.all([
    supabase.from("departments").select("id, name, description").order("name"),
    supabase
      .from("employees")
      .select("id, name, position, department_id, reports_to, status")
      .neq("status", "terminated")
      .order("name"),
  ]);

  return {
    departments: (departments ?? []) as Department[],
    employees: (employees ?? []) as Employee[],
  };
}

function buildDeptTree(deptEmployees: Employee[]): TreeNode[] {
  const inDept = new Set(deptEmployees.map((e) => e.id));
  const map = new Map<string, TreeNode>();
  for (const e of deptEmployees) map.set(e.id, { ...e, children: [] });

  const roots: TreeNode[] = [];
  for (const e of deptEmployees) {
    const node = map.get(e.id)!;
    if (e.reports_to && inDept.has(e.reports_to)) {
      map.get(e.reports_to)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

const AVATAR_COLORS = [
  "bg-violet-500", "bg-emerald-500", "bg-blue-500",
  "bg-orange-500", "bg-pink-500", "bg-indigo-500",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const color = AVATAR_COLORS[depth % AVATAR_COLORS.length];
  return (
    <>
      <a
        href={`/employees/${node.id}`}
        className="flex items-center gap-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group relative"
        style={{ paddingLeft: depth * 20 + 8, paddingRight: 8 }}
      >
        {/* Tree connector lines for nested levels */}
        {depth > 0 && (
          <>
            <span
              className="absolute top-0 bottom-1/2 border-l-2 border-slate-200 dark:border-slate-700"
              style={{ left: depth * 20 - 8 }}
            />
            <span
              className="absolute top-1/2 w-2 border-t-2 border-slate-200 dark:border-slate-700"
              style={{ left: depth * 20 - 8 }}
            />
          </>
        )}
        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
          {getInitials(node.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
            {node.name}
          </p>
          {node.position && (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {node.position}
            </p>
          )}
        </div>
        {node.children.length > 0 && (
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
            {node.children.length}
          </span>
        )}
      </a>
      {node.children.map((child) => (
        <TreeRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default async function DepartmentsPage() {
  const session = await getSession();
  const canManage = session && ["admin"].includes(session.role);
  const { departments, employees } = await getData();

  const byDept = new Map<string, Employee[]>();
  const unassigned: Employee[] = [];
  for (const e of employees) {
    if (e.department_id) {
      const list = byDept.get(e.department_id) ?? [];
      list.push(e);
      byDept.set(e.department_id, list);
    } else {
      unassigned.push(e);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Departments</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            {departments.length} department{departments.length !== 1 ? "s" : ""} ·{" "}
            {employees.length} active employees · reporting hierarchy per team
          </p>
        </div>
        {canManage && <AddDepartmentButton />}
      </div>

      {departments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-700 dark:text-slate-200 font-semibold">No departments yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create departments to organise your team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {departments.map((dept, i) => {
            const deptEmps = byDept.get(dept.id) ?? [];
            const tree = buildDeptTree(deptEmps);
            const accent = DEPT_ACCENTS[i % DEPT_ACCENTS.length];

            return (
              <div
                key={dept.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Department header — clean, neutral */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${accent.bg} flex items-center justify-center shrink-0`}>
                    <Building2 className={`w-5 h-5 ${accent.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                      {dept.name}
                    </h3>
                    {dept.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {dept.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md shrink-0">
                    {deptEmps.length} {deptEmps.length === 1 ? "member" : "members"}
                  </span>
                  {canManage && (
                    <DepartmentActions
                      id={dept.id}
                      name={dept.name}
                      description={dept.description}
                      memberCount={deptEmps.length}
                    />
                  )}
                </div>

                {/* Tree — simple indented list */}
                <div className="p-3 relative">
                  {deptEmps.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No employees in this department
                    </p>
                  ) : tree.length === 0 ? (
                    <p className="text-sm text-amber-600 text-center py-6">
                      Cyclic reporting structure — review reports_to settings.
                    </p>
                  ) : (
                    <div className="relative">
                      {tree.map((root) => (
                        <TreeRow key={root.id} node={root} depth={0} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Unassigned employees */}
          {unassigned.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Unassigned
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">No department set</p>
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md shrink-0">
                  {unassigned.length} {unassigned.length === 1 ? "member" : "members"}
                </span>
              </div>
              <div className="p-4 space-y-2">
                {unassigned.map((e) => (
                  <a
                    key={e.id}
                    href={`/employees/${e.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                      {getInitials(e.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                        {e.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{e.position ?? "—"}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
