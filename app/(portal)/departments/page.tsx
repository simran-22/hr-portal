import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { AddDepartmentButton } from "@/components/shared/AddDepartmentButton";
import { Building2, Users } from "lucide-react";
import Link from "next/link";

type Department = { id: string; name: string; description: string | null };

type Employee = {
  id: string;
  name: string;
  position: string | null;
  department_id: string | null;
  reports_to: string | null;
};

type TreeNode = Employee & { children: TreeNode[] };

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
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
    // If manager is also in this department, nest under them. Otherwise treat as root.
    if (e.reports_to && inDept.has(e.reports_to)) {
      map.get(e.reports_to)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function TreeRow({ node, depth, gradient }: { node: TreeNode; depth: number; gradient: string }) {
  const indent = depth * 24;
  return (
    <>
      <div
        className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
        style={{ paddingLeft: indent + 12 }}
      >
        {/* Tree connector lines */}
        {depth > 0 && (
          <>
            <span
              className="absolute top-0 bottom-1/2 border-l-2 border-slate-200 dark:border-slate-700"
              style={{ left: indent - 6 }}
            />
            <span
              className="absolute top-1/2 w-3 border-t-2 border-slate-200 dark:border-slate-700"
              style={{ left: indent - 6 }}
            />
          </>
        )}

        <Link href={`/employees/${node.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
            {getInitials(node.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
              {node.name}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {node.position ?? "—"}
            </p>
          </div>
          {node.children.length > 0 && (
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md shrink-0">
              {node.children.length} report{node.children.length !== 1 ? "s" : ""}
            </span>
          )}
        </Link>
      </div>
      {node.children.map((child) => (
        <TreeRow key={child.id} node={child} depth={depth + 1} gradient={gradient} />
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
            {departments.length} department{departments.length !== 1 ? "s" : ""} · {employees.length} active employees · hierarchy by reporting line
          </p>
        </div>
        {canManage && <AddDepartmentButton />}
      </div>

      {departments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-700 dark:text-slate-200 font-semibold">No departments yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create departments to organise your team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {departments.map((dept, i) => {
            const deptEmps = byDept.get(dept.id) ?? [];
            const tree = buildDeptTree(deptEmps);
            const gradient = GRADIENTS[i % GRADIENTS.length];

            return (
              <div
                key={dept.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Department header */}
                <div className={`bg-gradient-to-r ${gradient} px-5 py-4`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold truncate">{dept.name}</h3>
                      <p className="text-white/80 text-xs truncate">
                        {dept.description ?? `${deptEmps.length} member${deptEmps.length !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-md shrink-0">
                      {deptEmps.length}
                    </span>
                  </div>
                </div>

                {/* Tree */}
                <div className="p-3">
                  {deptEmps.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No employees in this department</p>
                  ) : tree.length === 0 ? (
                    <p className="text-sm text-amber-600 text-center py-6">
                      Cyclic reporting structure — review reports_to settings.
                    </p>
                  ) : (
                    <div className="relative">
                      {tree.map((root) => (
                        <TreeRow key={root.id} node={root} depth={0} gradient={gradient} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Unassigned employees (no department) */}
          {unassigned.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-400 to-slate-500 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold">Unassigned</h3>
                    <p className="text-white/80 text-xs">No department set</p>
                  </div>
                  <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-md shrink-0">
                    {unassigned.length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-1">
                {unassigned.map((e) => (
                  <Link
                    key={e.id}
                    href={`/employees/${e.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
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
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
