import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react";

type Task = {
  label: string;
  count: number;
  href: string;
  color: string;
  bg: string;
  icon: typeof Clock;
};

export async function PendingTasksWidget() {
  const session = await getSession();
  if (!session) return null;

  const isAdmin = session.role === "admin";

  // Resolve employeeId with email fallback
  let myEmployeeId = session.employeeId ?? null;
  if (!myEmployeeId && session.email) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("email", session.email)
      .maybeSingle();
    myEmployeeId = emp?.id ?? null;
  }

  // Get direct report IDs (if user is manager)
  let directReportIds: string[] = [];
  if (myEmployeeId) {
    const { data: reports } = await supabase
      .from("employees")
      .select("id")
      .eq("reports_to", myEmployeeId);
    directReportIds = (reports ?? []).map((r) => r.id);
  }

  const tasks: Task[] = [];

  // Pending leaves I can approve
  if (isAdmin) {
    const { count } = await supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    if ((count ?? 0) > 0) {
      tasks.push({
        label: "Leave requests to review",
        count: count ?? 0,
        href: "/leaves?status=pending",
        color: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        icon: Clock,
      });
    }
  } else if (directReportIds.length > 0) {
    const { count } = await supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .in("employee_id", directReportIds);
    if ((count ?? 0) > 0) {
      tasks.push({
        label: "Team leave approvals",
        count: count ?? 0,
        href: "/leaves?status=pending",
        color: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        icon: Clock,
      });
    }
  }

  // Overdue probations (admin only)
  if (isAdmin) {
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "probation")
      .lt("probation_end_date", today);
    if ((count ?? 0) > 0) {
      tasks.push({
        label: "Probation periods overdue",
        count: count ?? 0,
        href: "/dashboard",
        color: "text-red-700 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-500/10",
        icon: AlertTriangle,
      });
    }
  }

  // Missing DOB nudge (admin only)
  if (isAdmin) {
    const { count } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .neq("status", "terminated")
      .is("date_of_birth", null);
    if ((count ?? 0) > 0) {
      tasks.push({
        label: "Employees missing date of birth",
        count: count ?? 0,
        href: "/employees",
        color: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-100 dark:bg-slate-800",
        icon: ListTodo,
      });
    }
  }

  // Own pending leave count (for self-awareness)
  if (myEmployeeId) {
    const { count } = await supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", myEmployeeId)
      .eq("status", "pending");
    if ((count ?? 0) > 0) {
      tasks.push({
        label: "Your leave requests awaiting approval",
        count: count ?? 0,
        href: "/leaves",
        color: "text-blue-700 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-500/10",
        icon: Clock,
      });
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
          <ListTodo className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">My Pending Tasks</h3>
        {tasks.length > 0 && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
            {tasks.reduce((sum, t) => sum + t.count, 0)}
          </span>
        )}
      </div>
      {tasks.length === 0 ? (
        <div className="py-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">All caught up!</p>
          <p className="text-xs text-slate-400 mt-0.5">No tasks need your attention.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {tasks.map((t) => {
            const Icon = t.icon;
            return (
              <a key={t.label} href={t.href} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                <div className={`w-9 h-9 rounded-xl ${t.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${t.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{t.label}</p>
                </div>
                <span className={`text-sm font-bold tabular-nums shrink-0 ${t.color}`}>{t.count}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
