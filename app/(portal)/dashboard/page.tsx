import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { Users, CalendarOff, Briefcase, DollarSign, TrendingUp, UserCheck, Clock, Target, Megaphone } from "lucide-react";
import { DashboardCharts } from "@/components/shared/DashboardCharts";
import { ProbationWidget } from "@/components/shared/ProbationWidget";
import { BirthdayWidget } from "@/components/shared/BirthdayWidget";
import { NewHiresWidget } from "@/components/shared/NewHiresWidget";
import { UpcomingHolidaysWidget } from "@/components/shared/UpcomingHolidaysWidget";
import { PendingTasksWidget } from "@/components/shared/PendingTasksWidget";

async function getDashboardData() {
  const [
    { count: totalEmployees },
    { count: activeEmployees },
    { count: onLeave },
    { count: pendingLeaves },
    { count: openJobs },
    { count: pendingAppraisals },
    { data: recentLeaves },
    { data: departments },
    { data: payrollData },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "on_leave"),
    supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("appraisals").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("leaves").select("id,type,from_date,to_date,status,employees(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("departments").select("id,name,employees(count)").limit(6),
    supabase.from("payroll").select("net").eq("month", new Date().getMonth() + 1).eq("year", new Date().getFullYear()),
  ]);

  const monthlyPayroll = payrollData?.reduce((sum, p) => sum + (p.net || 0), 0) ?? 0;
  const deptChartData = (departments ?? []).map((d: any, i: number) => ({
    name: d.name, employees: d.employees?.[0]?.count ?? 0,
    fill: ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"][i % 6],
  }));

  const { data: recentAnnouncements } = await supabase
    .from("announcements")
    .select("id, title, content, scope, published_at, expires_at, departments(name)")
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(5);

  return { totalEmployees: totalEmployees ?? 0, activeEmployees: activeEmployees ?? 0, onLeave: onLeave ?? 0,
    pendingLeaves: pendingLeaves ?? 0, openJobs: openJobs ?? 0, pendingAppraisals: pendingAppraisals ?? 0,
    recentLeaves: recentLeaves ?? [], deptChartData, monthlyPayroll, recentAnnouncements: recentAnnouncements ?? [] };
}

const statCards = (d: Awaited<ReturnType<typeof getDashboardData>>) => [
  { label: "Total Employees", value: d.totalEmployees, sub: `${d.activeEmployees} active`, icon: Users, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
  { label: "On Leave", value: d.onLeave, sub: `${d.pendingLeaves} pending`, icon: CalendarOff, gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  { label: "Open Positions", value: d.openJobs, sub: "Active postings", icon: Briefcase, gradient: "from-blue-500 to-cyan-600", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  { label: "Monthly Payroll", value: `$${d.monthlyPayroll.toLocaleString()}`, sub: "This month", icon: DollarSign, gradient: "from-emerald-400 to-teal-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

export default async function DashboardPage() {
  const session = await getSession();
  const d = await getDashboardData();
  const cards = statCards(d);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Good morning, {session?.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">Here&apos;s what&apos;s happening in your company today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map(({ label, value, sub, icon: Icon, gradient, bg, text }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts deptChartData={d.deptChartData} />

      {/* Probation Tracker — HR only */}
      {session?.role === "admin" && <ProbationWidget />}

      {/* My Pending Tasks + Upcoming Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PendingTasksWidget />
        <UpcomingHolidaysWidget />
      </div>

      {/* Birthdays + New Hires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BirthdayWidget />
        <NewHiresWidget />
      </div>

      {/* Recent + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Leaves */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Leave Requests</h3>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {d.recentLeaves.length === 0 ? (
              <p className="text-slate-400 text-sm px-5 py-6 text-center">No recent leave requests</p>
            ) : d.recentLeaves.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {l.employees?.name?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{l.employees?.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{l.type?.replace("_", " ")} · {l.from_date}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[l.status] ?? ""}`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Quick Stats</h3>
          </div>
          <div className="p-5 space-y-4">
            {[
              { icon: UserCheck, label: "Active Employees", value: d.activeEmployees, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
              { icon: Clock, label: "Pending Leave Approvals", value: d.pendingLeaves, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
              { icon: Target, label: "Pending Appraisals", value: d.pendingAppraisals, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
              { icon: TrendingUp, label: "Open Job Positions", value: d.openJobs, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Announcements */}
      {d.recentAnnouncements.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Announcements</h3>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {d.recentAnnouncements.map((a: any) => (
              <div key={a.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate">{a.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(a.published_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          a.scope === "company"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        }`}
                      >
                        {a.scope === "company" ? "Company" : a.departments?.name ?? "Department"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
