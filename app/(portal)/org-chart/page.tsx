import { supabase } from "@/lib/supabase";
import { GitBranch, Building2, Users } from "lucide-react";

type Emp = {
  id: string;
  name: string;
  position: string | null;
  department_id: string | null;
  reports_to: string | null;
  departments: { name: string } | null;
};

type TreeNode = Emp & { children: TreeNode[] };

async function getOrgData(): Promise<{ roots: TreeNode[]; total: number; orphans: TreeNode[] }> {
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, position, department_id, reports_to, departments(name)")
    .eq("status", "active")
    .order("name");

  const list = (employees ?? []) as unknown as Emp[];
  const map = new Map<string, TreeNode>();
  for (const e of list) {
    map.set(e.id, { ...e, children: [] });
  }

  const roots: TreeNode[] = [];
  const orphans: TreeNode[] = [];
  for (const e of list) {
    const node = map.get(e.id)!;
    if (!e.reports_to) {
      roots.push(node);
    } else {
      const parent = map.get(e.reports_to);
      if (parent) {
        parent.children.push(node);
      } else {
        // Manager record missing or terminated — treat as orphan root
        orphans.push(node);
      }
    }
  }

  return { roots, total: list.length, orphans };
}

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function NodeCard({ node, depth }: { node: TreeNode; depth: number }) {
  const gradient = GRADIENTS[depth % GRADIENTS.length];
  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <a
        href={`/employees/${node.id}`}
        className="inline-flex flex-col items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow px-4 py-3 min-w-[180px] max-w-[200px]"
      >
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-md mb-2`}>
          {getInitials(node.name)}
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-center truncate w-full">
          {node.name}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center truncate w-full">
          {node.position ?? "—"}
        </p>
        {node.departments?.name && (
          <span className="mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-full">
            {node.departments.name}
          </span>
        )}
        {node.children.length > 0 && (
          <span className="mt-1 text-[10px] text-violet-600 dark:text-violet-400 font-medium">
            {node.children.length} report{node.children.length !== 1 ? "s" : ""}
          </span>
        )}
      </a>

      {/* Children */}
      {node.children.length > 0 && (
        <>
          {/* Vertical connector */}
          <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700" />
          {/* Horizontal connector spanning children */}
          {node.children.length > 1 && (
            <div className="relative w-full">
              <div className="absolute top-0 left-[calc(50%/var(--count))] right-[calc(50%/var(--count))] h-0.5 bg-slate-200 dark:bg-slate-700"
                style={{ ["--count" as string]: node.children.length } as React.CSSProperties}
              />
            </div>
          )}
          <div className="flex items-start gap-6 pt-4 mt-0.5">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center relative">
                {/* Per-child top connector */}
                <div className="absolute -top-4 w-0.5 h-4 bg-slate-200 dark:bg-slate-700" />
                <NodeCard node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default async function OrgChartPage() {
  const { roots, total, orphans } = await getOrgData();
  const allRoots = [...roots, ...orphans];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Organization Chart</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          {total} active employee{total !== 1 ? "s" : ""} · reporting hierarchy
        </p>
      </div>

      {total === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <GitBranch className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg">No employees yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Add employees and set their reporting line to see the chart.</p>
          </div>
        </div>
      ) : allRoots.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 text-sm text-amber-800 dark:text-amber-400">
          No top-level employees found. Every employee has someone they report to, which would create a cycle. Edit at least one employee and set <strong>Reports To</strong> to <em>— No manager —</em>.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 overflow-x-auto">
          {/* Company root */}
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl px-8 py-4 text-center shadow-lg">
              <Building2 className="w-7 h-7 text-white mx-auto mb-1" />
              <p className="text-white font-bold text-lg">HR Portal</p>
              <p className="text-white/70 text-xs">{total} employees</p>
            </div>

            {allRoots.length > 0 && (
              <>
                <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-start gap-8 flex-wrap justify-center">
                  {allRoots.map((node) => (
                    <NodeCard key={node.id} node={node} depth={0} />
                  ))}
                </div>
              </>
            )}
          </div>

          {orphans.length > 0 && (
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <Users className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-300">{orphans.length} orphan employee{orphans.length !== 1 ? "s" : ""}</p>
                <p className="mt-0.5">Their manager record was removed or marked terminated. Update their <strong>Reports To</strong> to fix the hierarchy.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
