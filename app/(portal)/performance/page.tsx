import { supabase } from "@/lib/supabase";
import { Target, Star, TrendingUp, CheckCircle } from "lucide-react";
import { AddGoalButton } from "@/components/shared/AddGoalButton";
import { AddAppraisalButton } from "@/components/shared/AddAppraisalButton";
import { getSession } from "@/lib/session";

async function getPerformanceData() {
  const [{ data: goals }, { data: appraisals }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, title, category, progress_percent, status, quarter, year, employees(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("appraisals")
      .select(
        "id, year, quarter, overall_rating, status, rating_performance, rating_communication, rating_leadership, rating_teamwork, manager_comments, employees!appraisals_employee_id_fkey(name), reviewer:employees!appraisals_reviewer_id_fkey(name)"
      )
      .order("created_at", { ascending: false }),
  ]);

  return { goals: goals ?? [], appraisals: appraisals ?? [] };
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    draft: "bg-amber-100 text-amber-700",
    submitted: "bg-violet-100 text-violet-700",
    acknowledged: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-cyan-100 text-cyan-700",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

const categoryBadge = (category: string) => {
  const map: Record<string, string> = {
    individual: "bg-violet-100 text-violet-700",
    team: "bg-blue-100 text-blue-700",
    company: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${map[category] ?? "bg-slate-100 text-slate-600"}`}>
      {category}
    </span>
  );
};

function RatingStars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  const canManage = session && ["admin", "hr", "manager"].includes(session.role);

  const sp = await searchParams;
  const tab = sp.tab ?? "goals";
  const { goals, appraisals } = await getPerformanceData();

  const activeGoals = goals.filter((g: any) => g.status === "active" || g.status === "in_progress").length;
  const completedGoals = goals.filter((g: any) => g.status === "completed").length;
  const avgRating =
    appraisals.length > 0
      ? (appraisals.reduce((s: number, a: any) => s + (a.overall_rating ?? 0), 0) / appraisals.length).toFixed(1)
      : null;

  const statCards = [
    { label: "Active Goals", value: activeGoals, icon: Target, gradient: "from-blue-500 to-cyan-600" },
    { label: "Completed Goals", value: completedGoals, icon: CheckCircle, gradient: "from-emerald-400 to-teal-600" },
    { label: "Total Appraisals", value: appraisals.length, icon: Star, gradient: "from-amber-400 to-orange-500" },
    {
      label: "Avg Rating",
      value: avgRating ? `${avgRating}/5` : "—",
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Performance</h2>
          <p className="text-slate-500 mt-0.5">Track goals, progress, and appraisals across your team</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && tab === "goals" && <AddGoalButton />}
          {canManage && tab === "appraisals" && <AddAppraisalButton />}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(({ label, value, icon: Icon, gradient }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">{label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: "goals", label: "Goals", icon: Target },
          { key: "appraisals", label: "Appraisals", icon: Star },
        ].map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={`/performance?tab=${key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </a>
        ))}
      </div>

      {/* Goals Tab */}
      {tab === "goals" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-slate-800 font-semibold text-lg">No goals yet</h3>
              <p className="text-slate-500 text-sm mt-1">Create goals to track employee performance</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Goal</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">Progress</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {goals.map((goal: any) => (
                    <tr key={goal.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">{goal.title}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {goal.employees?.name?.charAt(0) ?? "?"}
                          </div>
                          <span className="text-sm text-slate-700">{goal.employees?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{categoryBadge(goal.category)}</td>
                      <td className="px-5 py-4 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all"
                              style={{ width: `${Math.min(goal.progress_percent ?? 0, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 shrink-0 w-8 text-right">
                            {goal.progress_percent ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{statusBadge(goal.status)}</td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-500">Q{goal.quarter} {goal.year}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Appraisals Tab */}
      {tab === "appraisals" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {appraisals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-slate-800 font-semibold text-lg">No appraisals yet</h3>
              <p className="text-slate-500 text-sm mt-1">Submit appraisals to review employee performance</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviewer</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Period</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Communication</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Leadership</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teamwork</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appraisals.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {a.employees?.name?.charAt(0) ?? "?"}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{a.employees?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{a.reviewer?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">Q{a.quarter} {a.year}</td>
                      <td className="px-5 py-4"><RatingStars value={a.rating_performance ?? 0} /></td>
                      <td className="px-5 py-4"><RatingStars value={a.rating_communication ?? 0} /></td>
                      <td className="px-5 py-4"><RatingStars value={a.rating_leadership ?? 0} /></td>
                      <td className="px-5 py-4"><RatingStars value={a.rating_teamwork ?? 0} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <RatingStars value={a.overall_rating ?? 0} />
                          <span className="text-sm font-bold text-slate-800">
                            {a.overall_rating?.toFixed(1) ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{statusBadge(a.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
