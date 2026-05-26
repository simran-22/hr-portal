import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { AddDepartmentButton } from "@/components/shared/AddDepartmentButton";
import { Building2, User, Users } from "lucide-react";

type Department = { id: string; name: string; description: string | null };

type Employee = {
  id: string;
  name: string;
  position: string | null;
  department_id: string | null;
  reports_to: string | null;
};

type TreeNode = Employee & { children: TreeNode[] };

const DEPT_GRADIENTS = [
  "from-slate-700 to-slate-900",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-cyan-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
  "from-violet-500 to-purple-600",
  "from-indigo-500 to-blue-600",
];

const LEVEL_THEMES = [
  { box: "bg-slate-800", text: "text-white", icon: "text-slate-700" },
  { box: "bg-emerald-500", text: "text-white", icon: "text-emerald-600" },
  { box: "bg-blue-500", text: "text-white", icon: "text-blue-600" },
  { box: "bg-orange-500", text: "text-white", icon: "text-orange-600" },
  { box: "bg-violet-500", text: "text-white", icon: "text-violet-600" },
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

function NodeBox({ node, depth }: { node: TreeNode; depth: number }) {
  const theme = LEVEL_THEMES[Math.min(depth, LEVEL_THEMES.length - 1)];
  return (
    <a
      href={`/employees/${node.id}`}
      className="inline-flex shrink-0 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition w-[190px]"
    >
      <div className="bg-white dark:bg-slate-100 flex items-center justify-center w-12 shrink-0 border-r border-slate-200">
        <User className={`w-6 h-6 ${theme.icon}`} />
      </div>
      <div className={`${theme.box} ${theme.text} flex-1 px-2.5 py-2 flex flex-col justify-center min-w-0`}>
        <p className="text-[12px] font-bold uppercase tracking-wide truncate">{node.name}</p>
        {node.position && (
          <p className="text-[9px] uppercase tracking-wider opacity-80 truncate">
            {node.position}
          </p>
        )}
      </div>
    </a>
  );
}

function TreeBlock({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <div className="flex flex-col items-center">
      <NodeBox node={node} depth={depth} />

      {node.children.length > 0 && (
        <>
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-600" />
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-300 dark:border-t-slate-600 -mt-1" />
          </div>

          {node.children.length === 1 ? (
            <TreeBlock node={node.children[0]} depth={depth + 1} />
          ) : (
            <div className="relative pt-1">
              <div className="flex items-start gap-4">
                {node.children.map((child, i) => (
                  <div key={child.id} className="relative flex flex-col items-center">
                    <div className="w-0.5 h-5 bg-slate-300 dark:bg-slate-600" />
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-300 dark:border-t-slate-600 -mt-1 mb-1.5" />
                    <TreeBlock node={child} depth={depth + 1} />
                    {i > 0 && (
                      <div className="absolute top-0 -left-4 w-4 h-0.5 bg-slate-300 dark:bg-slate-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {departments.map((dept, i) => {
            const deptEmps = byDept.get(dept.id) ?? [];
            const tree = buildDeptTree(deptEmps);
            const gradient = DEPT_GRADIENTS[i % DEPT_GRADIENTS.length];

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
                <div className="p-6 overflow-x-auto">
                  {deptEmps.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No employees in this department
                    </p>
                  ) : tree.length === 0 ? (
                    <p className="text-sm text-amber-600 text-center py-6">
                      Cyclic reporting structure — review reports_to settings.
                    </p>
                  ) : (
                    <div className="flex flex-col items-center gap-6 min-w-fit">
                      {tree.map((root) => (
                        <TreeBlock key={root.id} node={root} depth={0} />
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

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-4">
        <span className="font-medium">Reporting levels:</span>
        {LEVEL_THEMES.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded ${t.box}`} />
            Level {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
