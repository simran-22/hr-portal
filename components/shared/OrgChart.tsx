"use client";

import { Tree, TreeNode } from "react-organizational-chart";

interface Employee {
  id: string;
  name: string;
  position: string | null;
  departments: { name: string } | null;
  manager_id: string | null;
}

function EmployeeNode({ employee }: { employee: Employee }) {
  return (
    <div className="inline-flex flex-col items-center px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-[160px]">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mb-2">
        {employee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-center">{employee.name}</p>
      {employee.position && <p className="text-xs text-slate-500 dark:text-slate-400 text-center">{employee.position}</p>}
      {employee.departments?.name && <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">{employee.departments.name}</p>}
    </div>
  );
}

function buildTree(employees: Employee[]) {
  const map = new Map<string, Employee[]>();
  const roots: Employee[] = [];

  employees.forEach((emp) => {
    if (!emp.manager_id) {
      roots.push(emp);
    } else {
      const children = map.get(emp.manager_id) ?? [];
      children.push(emp);
      map.set(emp.manager_id, children);
    }
  });

  return { roots, map };
}

function OrgNode({ employee, childrenMap }: { employee: Employee; childrenMap: Map<string, Employee[]> }) {
  const children = childrenMap.get(employee.id) ?? [];

  if (children.length === 0) {
    return (
      <TreeNode label={<EmployeeNode employee={employee} />} />
    );
  }

  return (
    <TreeNode label={<EmployeeNode employee={employee} />}>
      {children.map((child) => (
        <OrgNode key={child.id} employee={child} childrenMap={childrenMap} />
      ))}
    </TreeNode>
  );
}

export function OrgChartView({ employees }: { employees: Employee[] }) {
  const { roots, map } = buildTree(employees);

  if (roots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400 text-sm">No org chart data available. Assign managers to employees to build the hierarchy.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-8">
      {roots.map((root) => (
        <Tree
          key={root.id}
          lineWidth="2px"
          lineColor="#c4b5fd"
          lineBorderRadius="12px"
          label={<EmployeeNode employee={root} />}
        >
          {(map.get(root.id) ?? []).map((child) => (
            <OrgNode key={child.id} employee={child} childrenMap={map} />
          ))}
        </Tree>
      ))}
    </div>
  );
}
