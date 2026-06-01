"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronRight, X, Maximize2, Minimize2 } from "lucide-react";

export type TreeNode = {
  id: string;
  name: string;
  position: string | null;
  departments: { name: string } | null;
  children: TreeNode[];
};

const LEVEL_STYLES = [
  {
    ring: "ring-slate-300 dark:ring-slate-600",
    gradient: "from-slate-700 to-slate-900",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-gradient-to-br from-slate-700 to-slate-900",
    label: "Leadership",
  },
  {
    ring: "ring-emerald-300 dark:ring-emerald-500/40",
    gradient: "from-emerald-500 to-teal-600",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-gradient-to-br from-emerald-500 to-teal-600",
    label: "Director",
  },
  {
    ring: "ring-blue-300 dark:ring-blue-500/40",
    gradient: "from-blue-500 to-cyan-600",
    chip: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    dot: "bg-gradient-to-br from-blue-500 to-cyan-600",
    label: "Manager",
  },
  {
    ring: "ring-orange-300 dark:ring-orange-500/40",
    gradient: "from-orange-500 to-amber-600",
    chip: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
    dot: "bg-gradient-to-br from-orange-500 to-amber-600",
    label: "Senior",
  },
  {
    ring: "ring-violet-300 dark:ring-violet-500/40",
    gradient: "from-violet-500 to-purple-600",
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    dot: "bg-gradient-to-br from-violet-500 to-purple-600",
    label: "Team member",
  },
] as const;

function detectLevel(position: string | null): number {
  if (!position) return 4;
  const p = position.toLowerCase();
  if (/(ceo|cto|cfo|coo|chief|president|founder)/.test(p)) return 0;
  if (/(\bvp\b|vice|general manager|head of|director)/.test(p)) return 1;
  if (/manager|\blead\b/.test(p)) return 2;
  if (/senior|sr\.|supervisor|principal/.test(p)) return 3;
  return 4;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function countDescendants(node: TreeNode): number {
  return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

function nodeMatches(node: TreeNode, lowerQuery: string): boolean {
  if (!lowerQuery) return false;
  return (
    node.name.toLowerCase().includes(lowerQuery) ||
    (node.position?.toLowerCase() ?? "").includes(lowerQuery) ||
    (node.departments?.name?.toLowerCase() ?? "").includes(lowerQuery)
  );
}

function subtreeMatches(node: TreeNode, lowerQuery: string): boolean {
  if (!lowerQuery) return true;
  return nodeMatches(node, lowerQuery) || node.children.some((c) => subtreeMatches(c, lowerQuery));
}

function NodeCard({
  node,
  compact = false,
  highlighted = false,
  collapsed,
  onToggle,
}: {
  node: TreeNode;
  compact?: boolean;
  highlighted?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const level = detectLevel(node.position);
  const theme = LEVEL_STYLES[level];
  const reports = node.children.length;
  const totalReports = reports > 0 ? countDescendants(node) : 0;

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 rounded-2xl border ${
        highlighted
          ? "border-violet-400 dark:border-violet-500 ring-2 ring-violet-200 dark:ring-violet-500/30"
          : "border-slate-200 dark:border-slate-800"
      } shadow-sm hover:shadow-md transition-all ${compact ? "w-[180px] p-2.5" : "w-[210px] p-3.5"}`}
    >
      {reports > 0 && onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? `Expand ${reports} reports` : `Collapse ${reports} reports`}
          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 z-10"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}
      <Link href={`/employees/${node.id}`} className="block">
        <div className="flex flex-col items-center text-center">
          <div
            className={`${
              compact ? "w-10 h-10 text-xs" : "w-12 h-12 text-sm"
            } rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-bold ring-4 ${theme.ring} ring-offset-2 ring-offset-white dark:ring-offset-slate-900 mb-2`}
          >
            {getInitials(node.name)}
          </div>
          <p
            className={`${
              compact ? "text-[13px]" : "text-sm"
            } font-semibold text-slate-800 dark:text-slate-100 truncate w-full`}
          >
            {node.name}
          </p>
          <p
            className={`${
              compact ? "text-[10px]" : "text-[11px]"
            } text-slate-500 dark:text-slate-400 truncate w-full mt-0.5`}
          >
            {node.position ?? "—"}
          </p>
          {!compact && node.departments?.name && (
            <span
              className={`mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${theme.chip} truncate max-w-full`}
            >
              {node.departments.name}
            </span>
          )}
          {reports > 0 && (
            <span className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              {reports} direct{reports !== 1 ? "" : ""}
              {totalReports > reports && ` · ${totalReports} total`}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

const GRID_THRESHOLD = 5;

function Subtree({
  node,
  query,
  collapsed,
  toggle,
  compact = false,
}: {
  node: TreeNode;
  query: string;
  collapsed: Set<string>;
  toggle: (id: string) => void;
  compact?: boolean;
}) {
  const lower = query.toLowerCase();
  const visibleChildren = query
    ? node.children.filter((c) => subtreeMatches(c, lower))
    : node.children;
  const isCollapsed = !query && collapsed.has(node.id);
  const showChildren = !isCollapsed && visibleChildren.length > 0;
  const allLeaves = visibleChildren.every((c) => c.children.length === 0);
  const useGrid = allLeaves && visibleChildren.length >= GRID_THRESHOLD;

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        node={node}
        compact={compact}
        highlighted={nodeMatches(node, lower)}
        collapsed={isCollapsed}
        onToggle={node.children.length > 0 ? () => toggle(node.id) : undefined}
      />

      {showChildren && (
        <>
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600" />

          {useGrid ? (
            <div className="relative rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 px-5 pt-7 pb-5">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {visibleChildren.length} direct report{visibleChildren.length !== 1 ? "s" : ""}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {visibleChildren.map((child) => (
                  <div key={child.id} className="flex justify-center">
                    <Subtree
                      node={child}
                      query={query}
                      collapsed={collapsed}
                      toggle={toggle}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : visibleChildren.length === 1 ? (
            <Subtree
              node={visibleChildren[0]}
              query={query}
              collapsed={collapsed}
              toggle={toggle}
            />
          ) : (
            <div className="relative pt-2">
              <div className="absolute top-0 left-[105px] right-[105px] h-px bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-start gap-5">
                {visibleChildren.map((child) => (
                  <div key={child.id} className="flex flex-col items-center">
                    <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />
                    <Subtree
                      node={child}
                      query={query}
                      collapsed={collapsed}
                      toggle={toggle}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {isCollapsed && node.children.length > 0 && (
        <button
          type="button"
          onClick={() => toggle(node.id)}
          className="mt-2 text-[11px] text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium"
        >
          + Show {countDescendants(node)} hidden
        </button>
      )}
    </div>
  );
}

export function OrgChartClient({ roots }: { roots: TreeNode[] }) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const allIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (n: TreeNode) => {
      if (n.children.length > 0) ids.push(n.id);
      n.children.forEach(walk);
    };
    roots.forEach(walk);
    return ids;
  }, [roots]);

  const visibleRoots = useMemo(() => {
    if (!query) return roots;
    const lower = query.toLowerCase();
    return roots.filter((r) => subtreeMatches(r, lower));
  }, [roots, query]);

  const matchCount = useMemo(() => {
    if (!query) return 0;
    const lower = query.toLowerCase();
    let n = 0;
    const walk = (node: TreeNode) => {
      if (nodeMatches(node, lower)) n++;
      node.children.forEach(walk);
    };
    roots.forEach(walk);
    return n;
  }, [roots, query]);

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseAll = () => setCollapsed(new Set(allIds));
  const expandAll = () => setCollapsed(new Set());
  const allCollapsed = allIds.length > 0 && collapsed.size === allIds.length;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, position, or department"
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {query && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {matchCount} match{matchCount !== 1 ? "es" : ""}
          </span>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={allCollapsed ? expandAll : collapseAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            title={allCollapsed ? "Expand all subtrees" : "Collapse all subtrees"}
          >
            {allCollapsed ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" /> Expand all
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5" /> Collapse all
              </>
            )}
          </button>
        </div>

        <div className="w-full flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Levels:</span>
          {LEVEL_STYLES.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${a.dot}`} />
              <span className="text-slate-500 dark:text-slate-400">{a.label}</span>
            </span>
          ))}
        </div>
      </div>

      {visibleRoots.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          No employees match <span className="font-semibold text-slate-700 dark:text-slate-200">&ldquo;{query}&rdquo;</span>.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-x-auto">
          <div className="flex flex-row items-start justify-center gap-16 min-w-fit flex-wrap">
            {visibleRoots.map((root) => (
              <Subtree
                key={root.id}
                node={root}
                query={query}
                collapsed={collapsed}
                toggle={toggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
