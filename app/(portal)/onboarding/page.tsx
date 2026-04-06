import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AddOnboardingButton } from "@/components/shared/AddOnboardingButton";
import { OnboardingChecklist } from "@/components/shared/OnboardingChecklist";
import { ClipboardCheck, Clock, CheckCircle2, ListTodo } from "lucide-react";

type Task = {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
  phase: string;
};

type GroupedEmployee = {
  employeeId: string;
  employeeName: string;
  tasks: Task[];
};

async function getOnboardingTasks(employeeId?: string) {
  let query = supabase
    .from("onboarding_tasks")
    .select("*, employees(name)")
    .order("due_date", { ascending: true });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data } = await query;

  const grouped: Record<string, GroupedEmployee> = {};
  for (const task of data ?? []) {
    const eid = task.employee_id;
    if (!grouped[eid]) {
      grouped[eid] = {
        employeeId: eid,
        employeeName: (task.employees as any)?.name ?? "Unknown",
        tasks: [],
      };
    }
    grouped[eid].tasks.push(task);
  }

  return Object.values(grouped);
}

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canManage = ["admin", "hr"].includes(session.role);
  const groups = await getOnboardingTasks(canManage ? undefined : session.employeeId);

  const allTasks = groups.flatMap((g) => g.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;

  const stats = [
    { label: "Total Tasks", value: totalTasks, icon: ListTodo, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
    { label: "Completed", value: completedTasks, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Pending", value: pendingTasks, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Onboarding</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Track onboarding tasks and checklists for new hires
          </p>
        </div>
        {canManage && <AddOnboardingButton />}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checklists per employee */}
      {groups.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No onboarding tasks found.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <OnboardingChecklist
              key={group.employeeId}
              employeeName={group.employeeName}
              tasks={group.tasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
