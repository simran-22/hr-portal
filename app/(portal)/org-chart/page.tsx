import { supabase } from "@/lib/supabase";
import { GitBranch, Users } from "lucide-react";
import Link from "next/link";

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

// Subtle accents per level — keep boxes clean, just dot the avatar
const LEVEL_ACCENTS = [
  { ring: "ring-slate-300 dark:ring-slate-600",       gradient: "from-slate-700 to-slate-900",       label: "Leadership" },
  { ring: "ring-emerald-300 dark:ring-emerald-500/40", gradient: "from-emerald-500 to-teal-600",       label: "Director" },
  { ring: "ring-blue-300 dark:ring-blue-500/40",       gradient: "from-blue-500 to-cyan-600",          label: "Manager" },
  { ring: "ring-orange-300 dark:ring-orange-500/40",   gradient: "from-orange-500 to-amber-600",       label: "Supervisor" },
  { ring: "ring-violet-300 dark:ring-violet-500/40",   gradient: "from-violet-500 to-purple-600",      label: "Team member" },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function NodeCard({ node, depth }: { node: TreeNode; depth: number }) {
  const theme = LEVEL_ACCENTS[Math.min(depth, LEVEL_ACCENTS.length - 1)];
  return (
    <Link
      href={`/employees/${node.id}`}
      className={`group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col items-center text-center w-[180px] p-3`}
    >
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white text-sm font-bold ring-4 ${theme.ring} ring-offset-2 ring-offset-white dark:ring-offset-slate-900 mb-2`}>
        {getInitials(node.name)}
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate w-full group-hover:text-violet-600 dark:group-hover:text-violet-400">
        {node.name}
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate w-full">
        {node.position ?? "—"}
      </p>
      {node.departments?.name && (
        <span className="mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-full">
          {node.departments.name}
        </span>
      )}
      {node.children.length > 0 && (
        <span className="mt-1 text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
          {node.children.length} report{node.children.length !== 1 ? "s" : ""}
        </span>
      )}
    </Link>
  );
}

function TreeBlock({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <div className="flex flex-col items-center">
      <NodeCard node={node} depth={depth} />

      {node.children.length > 0 && (
        <>
          {/* Vertical connector from parent down */}
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />

          {node.children.length === 1 ? (
            <TreeBlock node={node.children[0]} depth={depth + 1} />
          ) : (
            <div className="relative pt-2">
              {/* Horizontal bus line connecting siblings */}
              <div className="absolute top-0 left-[calc(180px/2-1px)] right-[calc(180px/2-1px)] h-px bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-start gap-5">
                {node.children.map((child) => (
                  <div key={child.id} className="flex flex-col items-center">
                    {/* Stem from bus line down to child */}
                    <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />
                    <TreeBlock node={child} depth={depth + 1} />
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

export default async function OrgChartPage() {
  const { roots, orphans, total } = await getOrgData();
  const allRoots = [...roots, ...orphans];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Organization Chart</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            {total} active employee{total !== 1 ? "s" : ""} · reporting hierarchy
          </p>
        </div>
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          View directory →
        </Link>
      </div>

      {/* Level legend */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-wrap items-center gap-4 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Levels:</span>
        {LEVEL_ACCENTS.map((a, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${a.gradient}`} />
            <span className="text-slate-500 dark:text-slate-400">{a.label}</span>
          </span>
        ))}
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
          No top-level employee found. Every employee has someone they report to, which creates a cycle.
          Edit at least one employee and set <strong>Reports To</strong> to <em>— No manager —</em>.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 overflow-x-auto">
          {/* Roots are siblings — render side by side (equal partners appear in same row) */}
          <div className="flex flex-row items-start justify-center gap-16 min-w-fit flex-wrap">
            {allRoots.map((root) => (
              <TreeBlock key={root.id} node={root} depth={0} />
            ))}
          </div>
        </div>
      )}

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
