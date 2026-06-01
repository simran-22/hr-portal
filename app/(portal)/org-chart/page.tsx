import { supabase } from "@/lib/supabase";
import { GitBranch, Users } from "lucide-react";
import Link from "next/link";
import { OrgChartClient, type TreeNode } from "./OrgChartClient";

type Emp = {
  id: string;
  name: string;
  position: string | null;
  reports_to: string | null;
  departments: { name: string } | null;
};

async function getOrgData(): Promise<{ roots: TreeNode[]; orphans: TreeNode[]; total: number }> {
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, position, reports_to, departments(name)")
    .eq("status", "active")
    .order("name");

  const list = (employees ?? []) as unknown as Emp[];
  const map = new Map<string, TreeNode>();
  for (const e of list) {
    map.set(e.id, {
      id: e.id,
      name: e.name,
      position: e.position,
      departments: e.departments,
      children: [],
    });
  }

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
          No top-level employee found. Every employee has someone they report to, which creates a cycle. Edit at
          least one employee and set <strong>Reports To</strong> to <em>— No manager —</em>.
        </div>
      ) : (
        <OrgChartClient roots={allRoots} />
      )}

      {orphans.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
          <Users className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {orphans.length} orphan employee{orphans.length !== 1 ? "s" : ""}
            </p>
            <p className="mt-0.5">
              Their manager record was removed or marked terminated. Update their{" "}
              <strong>Reports To</strong> to fix the hierarchy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
