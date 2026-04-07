import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InitiateSeparationButton } from "@/components/shared/InitiateSeparationButton";
import { OffboardingChecklist } from "@/components/shared/OffboardingChecklist";
import { UserMinus, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

async function getSeparations() {
  const { data } = await supabase
    .from("separations")
    .select("*, employees(name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

const STATUS_STYLES: Record<string, string> = {
  initiated: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  in_progress: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const TYPE_STYLES: Record<string, string> = {
  resignation: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  termination: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
  retirement: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

export default async function OffboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canManage = ["admin"].includes(session.role);

  if (!canManage) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-12 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">You do not have access to this page.</p>
      </div>
    );
  }

  const separations = await getSeparations();

  const totalCount = separations.length;
  const initiatedCount = separations.filter((s: any) => s.status === "initiated").length;
  const inProgressCount = separations.filter((s: any) => s.status === "in_progress").length;
  const completedCount = separations.filter((s: any) => s.status === "completed").length;

  const stats = [
    { label: "Total", value: totalCount, icon: UserMinus, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
    { label: "Initiated", value: initiatedCount, icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "In Progress", value: inProgressCount, icon: Clock, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Offboarding</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Manage employee separations and exit processes
          </p>
        </div>
        {canManage && <InitiateSeparationButton />}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {/* Separations list */}
      {separations.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-12 text-center">
          <UserMinus className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No separations found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {separations.map((sep: any) => (
            <div key={sep.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                    {(sep.employees as any)?.name ?? "Unknown"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${TYPE_STYLES[sep.type] ?? ""}`}>
                      {sep.type}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[sep.status] ?? ""}`}>
                      {sep.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400 dark:text-slate-500 space-y-1">
                  {sep.notice_date && (
                    <p>Notice: {new Date(sep.notice_date).toLocaleDateString()}</p>
                  )}
                  {sep.last_working_date && (
                    <p>Last Day: {new Date(sep.last_working_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              {sep.reason && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{sep.reason}</p>
              )}
              <OffboardingChecklist separation={sep} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
