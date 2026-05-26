import { supabase } from "@/lib/supabase";
import { GitBranch, User, Users } from "lucide-react";

type Emp = {
  id: string;
  name: string;
  position: string | null;
  reports_to: string | null;
  departments: { name: string } | null;
};

type TreeNode = Emp & { children: TreeNode[] };

async function getOrgData(): Promise<{ roots: TreeNode[]; orphans: TreeNode[]; total: number }> {
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, position, reports_to, departments(name)")
    .eq("status", "active")
    .order("name");

  const list = (employees ?? []) as unknown as Emp[];
  const map = new Map<string, TreeNode>();
  for (const e of list) map.set(e.id, { ...e, children: [] });

  const roots: TreeNode[] = [];
  const orphans: TreeNode[] = [];
  for (const e of list) {
    const node = map.get(e.id)!;
    if (!e.reports_to) {
      roots.push(node);
    } else {
      const parent = map.get(e.reports_to);
      if (parent) parent.children.push(node);
      else orphans.push(node);
    }
  }
  return { roots, orphans, total: list.length };
}

// Depth-based color palette (matches the reference design)
const LEVEL_THEMES = [
  { box: "bg-slate-800", text: "text-white",  icon: "text-slate-700" },   // Level 0 (top)
  { box: "bg-emerald-500", text: "text-white", icon: "text-emerald-600" }, // Level 1
  { box: "bg-blue-500",   text: "text-white",  icon: "text-blue-600" },    // Level 2
  { box: "bg-orange-500", text: "text-white",  icon: "text-orange-600" },  // Level 3
  { box: "bg-violet-500", text: "text-white",  icon: "text-violet-600" },  // Level 4+
];

function NodeBox({ node, depth }: { node: TreeNode; depth: number }) {
  const theme = LEVEL_THEMES[Math.min(depth, LEVEL_THEMES.length - 1)];

  return (
    <a
      href={`/employees/${node.id}`}
      className="inline-flex shrink-0 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition w-[220px] sm:w-[260px]"
    >
      {/* Icon panel (white bg) */}
      <div className="bg-white dark:bg-slate-100 flex items-center justify-center w-16 shrink-0 border-r border-slate-200">
        <User className={`w-8 h-8 ${theme.icon}`} />
      </div>
      {/* Label panel */}
      <div className={`${theme.box} ${theme.text} flex-1 px-3 py-3 flex flex-col justify-center min-w-0`}>
        <p className="text-sm font-bold uppercase tracking-wider truncate">{node.name}</p>
        {node.position && (
          <p className="text-[10px] uppercase tracking-wider opacity-80 truncate mt-0.5">
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
          {/* Vertical connector with arrow */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600" />
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-slate-300 dark:border-t-slate-600 -mt-1" />
          </div>

          {/* Children container */}
          {node.children.length === 1 ? (
            <TreeBlock node={node.children[0]} depth={depth + 1} />
          ) : (
            <>
              {/* Horizontal bus line connecting children */}
              <div className="relative pt-2">
                <div className="flex items-start gap-6">
                  {node.children.map((child, i) => (
                    <div key={child.id} className="relative flex flex-col items-center">
                      {/* Each child gets its own down connector + arrow */}
                      <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-600" />
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-slate-300 dark:border-t-slate-600 -mt-1 mb-2" />
                      <TreeBlock node={child} depth={depth + 1} />

                      {/* Horizontal lines connecting siblings (drawn between adjacent children) */}
                      {i > 0 && (
                        <div className="absolute top-0 -left-6 w-6 h-0.5 bg-slate-300 dark:bg-slate-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default async function OrgChartPage() {
  const { roots, orphans, total } = await getOrgData();
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
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Add employees and set their reporting line to see the chart.
            </p>
          </div>
        </div>
      ) : allRoots.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 text-sm text-amber-800 dark:text-amber-400">
          No top-level employee found. Every employee has someone they report to, which creates a cycle.
          Edit at least one employee and set <strong>Reports To</strong> to <em>— No manager —</em>.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 overflow-x-auto">
          <div className="flex flex-col items-center gap-12">
            {allRoots.map((root) => (
              <TreeBlock key={root.id} node={root} depth={0} />
            ))}
          </div>
        </div>
      )}

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">Hierarchy levels:</span>
        {LEVEL_THEMES.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className={`w-3.5 h-3.5 rounded ${t.box}`} />
            Level {i + 1}
          </span>
        ))}
      </div>

      {orphans.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
          <Users className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {orphans.length} orphan employee{orphans.length !== 1 ? "s" : ""}
            </p>
            <p className="mt-0.5">
              Their manager record was removed or marked terminated. Update their <strong>Reports To</strong> to fix the hierarchy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
