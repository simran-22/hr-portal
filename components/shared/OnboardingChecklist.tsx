"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Calendar, User, Loader2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
  phase: string;
};

type Props = {
  employeeName: string;
  tasks: Task[];
};

const PHASE_LABELS: Record<string, string> = {
  pre_join: "Pre-Join",
  first_day: "First Day",
  first_week: "First Week",
  first_month: "First Month",
};

const PHASE_ORDER = ["pre_join", "first_day", "first_week", "first_month"];

export function OnboardingChecklist({ employeeName, tasks }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const toggleStatus = async (task: Task) => {
    setLoading(task.id);
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      await fetch(`/api/onboarding/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  const grouped = PHASE_ORDER.reduce<Record<string, Task[]>>((acc, phase) => {
    const phaseTasks = tasks.filter((t) => t.phase === phase);
    if (phaseTasks.length > 0) acc[phase] = phaseTasks;
    return acc;
  }, {});

  const completed = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{employeeName}</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
          {completed}/{tasks.length} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-5">
        <div
          className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full transition-all"
          style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([phase, phaseTasks]) => (
          <div key={phase}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {PHASE_LABELS[phase] ?? phase}
            </h4>
            <div className="space-y-2">
              {phaseTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <button
                    onClick={() => toggleStatus(task)}
                    disabled={loading === task.id}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {loading === task.id ? (
                      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    ) : task.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-violet-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === "completed" ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      {task.assigned_to && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <User className="w-3 h-3" />
                          {task.assigned_to}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
