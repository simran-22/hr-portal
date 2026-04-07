import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { AddDepartmentButton } from "@/components/shared/AddDepartmentButton";
import { DepartmentCard } from "@/components/shared/DepartmentCard";

async function getDepartments() {
  const { data } = await supabase
    .from("departments")
    .select("id, name, description, employees(count)")
    .order("name");
  return data ?? [];
}

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

export default async function DepartmentsPage() {
  const session = await getSession();
  const canManage = session && ["admin"].includes(session.role);
  const departments = await getDepartments();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Departments</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{departments.length} departments in your organisation</p>
        </div>
        {canManage && <AddDepartmentButton />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {departments.map((dept: any, i: number) => (
          <DepartmentCard
            key={dept.id}
            department={dept}
            employeeCount={dept.employees?.[0]?.count ?? 0}
            gradient={GRADIENTS[i % GRADIENTS.length]}
            canManage={!!canManage}
          />
        ))}
      </div>
    </div>
  );
}
