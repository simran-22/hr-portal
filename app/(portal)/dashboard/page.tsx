import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import {
  Users, CalendarOff, Briefcase, DollarSign, TrendingUp, UserCheck, Clock, Target,
  Megaphone, CalendarDays, Cake,
} from "lucide-react";
import { DashboardCharts } from "@/components/shared/DashboardCharts";
import { ProbationWidget } from "@/components/shared/ProbationWidget";
import { BirthdayWidget } from "@/components/shared/BirthdayWidget";
import { NewHiresWidget } from "@/components/shared/NewHiresWidget";
import { UpcomingHolidaysWidget } from "@/components/shared/UpcomingHolidaysWidget";
import { PendingTasksWidget } from "@/components/shared/PendingTasksWidget";
import { DashboardWidget } from "@/components/shared/DashboardWidget";
import { CustomizeWidgetsButton } from "@/components/shared/CustomizeWidgetsButton";
import { FavoritesWidget } from "@/components/shared/FavoritesWidget";
import { HomeTabs } from "@/components/shared/HomeTabs";

// ----- HR (admin) data fetch -----
async function getAdminData() {
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
  const deptChartData = (departments ?? []).map((d: { id: string; name: string; employees: { count: number }[] }, i: number) => ({
    name: d.name, employees: d.employees?.[0]?.count ?? 0,
    fill: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"][i % 6],
  }));

  return {
    totalEmployees: totalEmployees ?? 0,
    activeEmployees: activeEmployees ?? 0,
    onLeave: onLeave ?? 0,
    pendingLeaves: pendingLeaves ?? 0,
    openJobs: openJobs ?? 0,
    pendingAppraisals: pendingAppraisals ?? 0,
    recentLeaves: (recentLeaves ?? []) as unknown as { id: string; type: string; from_date: string; status: string; employees: { name: string } | null }[],
    deptChartData,
    monthlyPayroll,
  };
}

// ----- Employee personal data fetch -----
async function getEmployeeData(sessionEmployeeId: string | null, sessionEmail: string | null) {
  // Resolve employee id
  let employeeId = sessionEmployeeId;
  if (!employeeId && sessionEmail) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("email", sessionEmail)
      .maybeSingle();
    employeeId = emp?.id ?? null;
  }
  if (!employeeId) {
    return { hasEmployee: false as const };
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate().toString().padStart(2, "0")}`;

  const [
    { count: myAttendanceDays },
    { count: myPendingLeaves },
    { count: myApprovedLeaves },
    { data: myLatestPayroll },
    { data: nextHoliday },
  ] = await Promise.all([
    // attendance days this month (present or half_day)
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .in("status", ["present", "half_day", "late"]),
    supabase.from("leaves").select("*", { count: "exact", head: true }).eq("employee_id", employeeId).eq("status", "pending"),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .eq("status", "approved")
      .gte("from_date", `${year}-01-01`),
    supabase
      .from("payroll")
      .select("month, year, net")
      .eq("employee_id", employeeId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(1),
    supabase
      .from("holidays")
      .select("name, date")
      .gte("date", now.toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .limit(1),
  ]);

  const lastPay = (myLatestPayroll ?? [])[0] as { net: number; month: number; year: number } | undefined;
  const upcoming = (nextHoliday ?? [])[0] as { name: string; date: string } | undefined;
  const daysInMonth = new Date(year, month, 0).getDate();

  return {
    hasEmployee: true as const,
    myAttendanceDays: myAttendanceDays ?? 0,
    daysInMonth,
    myPendingLeaves: myPendingLeaves ?? 0,
    myApprovedLeaves: myApprovedLeaves ?? 0,
    latestPayrollNet: lastPay?.net ?? 0,
    nextHoliday: upcoming ?? null,
  };
}

async function getRecentAnnouncements() {
  const { data } = await supabase
    .from("announcements")
    .select("id, title, content, scope, published_at, expires_at, departments(name)")
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(5);
  return (data ?? []) as unknown as { id: string; title: string; content: string; scope: string; published_at: string; departments: { name: string } | null }[];
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

export default async function DashboardPage() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const recentAnnouncements = await getRecentAnnouncements();

  // Fetch data based on role
  const adminData = isAdmin ? await getAdminData() : null;
  const empData = !isAdmin ? await getEmployeeData(session?.employeeId ?? null, session?.email ?? null) : null;

  const adminStatCards = adminData ? [
    { label: "Total Employees", value: adminData.totalEmployees, sub: `${adminData.activeEmployees} active`, icon: Users, gradient: "from-violet-500 to-purple-600" },
    { label: "On Leave", value: adminData.onLeave, sub: `${adminData.pendingLeaves} pending`, icon: CalendarOff, gradient: "from-amber-400 to-orange-500" },
    { label: "Open Positions", value: adminData.openJobs, sub: "Active postings", icon: Briefcase, gradient: "from-blue-500 to-cyan-600" },
    { label: "Monthly Payroll", value: `$${adminData.monthlyPayroll.toLocaleString()}`, sub: "This month", icon: DollarSign, gradient: "from-emerald-400 to-teal-600" },
  ] : [];

  const empStatCards = empData?.hasEmployee ? [
    { label: "Attendance This Month", value: `${empData.myAttendanceDays}`, sub: `of ~${empData.daysInMonth} days`, icon: UserCheck, gradient: "from-emerald-400 to-teal-600" },
    { label: "My Pending Leaves", value: empData.myPendingLeaves, sub: "Awaiting approval", icon: Clock, gradient: "from-amber-400 to-orange-500" },
    { label: "Approved Leaves (Year)", value: empData.myApprovedLeaves, sub: "This year", icon: CalendarOff, gradient: "from-blue-500 to-cyan-600" },
    { label: "Last Payslip", value: empData.latestPayrollNet > 0 ? `₹${empData.latestPayrollNet.toLocaleString("en-IN")}` : "—", sub: empData.latestPayrollNet > 0 ? "Net pay" : "Not generated", icon: DollarSign, gradient: "from-violet-500 to-purple-600" },
  ] : [];

  const cards = isAdmin ? adminStatCards : empStatCards;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Good morning, {session?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            {isAdmin
              ? "Here's what's happening in your company today."
              : "Here's your personal overview."}
          </p>
        </div>
        <CustomizeWidgetsButton />
      </div>

      <HomeTabs />

      {/* Stat Cards */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {cards.map(({ label, value, sub, icon: Icon, gradient }) => (
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
      )}

      {/* Department Charts — HR only */}
      {isAdmin && adminData && (
        <DashboardWidget widgetKey="charts">
          <DashboardCharts deptChartData={adminData.deptChartData} />
        </DashboardWidget>
      )}

      {/* Probation Tracker — HR only */}
      {isAdmin && (
        <DashboardWidget widgetKey="probation">
          <ProbationWidget />
        </DashboardWidget>
      )}

      {/* Common widgets — visible to everyone */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <DashboardWidget widgetKey="birthdays">
          <BirthdayWidget />
        </DashboardWidget>
        <DashboardWidget widgetKey="newHires">
          <NewHiresWidget />
        </DashboardWidget>
        <DashboardWidget widgetKey="favorites">
          <FavoritesWidget />
        </DashboardWidget>
        <DashboardWidget widgetKey="upcomingHolidays">
          <UpcomingHolidaysWidget />
        </DashboardWidget>
        <DashboardWidget widgetKey="pendingTasks">
          <PendingTasksWidget />
        </DashboardWidget>
      </div>

      {/* Recent Leaves + Quick Stats — HR only (shows everyone's data) */}
      {isAdmin && adminData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DashboardWidget widgetKey="recentLeaves">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Leave Requests</h3>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {adminData.recentLeaves.length === 0 ? (
                  <p className="text-slate-400 text-sm px-5 py-6 text-center">No recent leave requests</p>
                ) : adminData.recentLeaves.map((l: { id: string; type: string; from_date: string; status: string; employees: { name: string } | null }) => (
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
          </DashboardWidget>

          <DashboardWidget widgetKey="quickStats">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Quick Stats</h3>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { icon: UserCheck, label: "Active Employees", value: adminData.activeEmployees, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                  { icon: Clock, label: "Pending Leave Approvals", value: adminData.pendingLeaves, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
                  { icon: Target, label: "Pending Appraisals", value: adminData.pendingAppraisals, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
                  { icon: TrendingUp, label: "Open Job Positions", value: adminData.openJobs, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
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
          </DashboardWidget>
        </div>
      )}

      {/* Employee next-holiday quick info */}
      {!isAdmin && empData?.hasEmployee && empData.nextHoliday && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Next holiday: {empData.nextHoliday.name}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {new Date(empData.nextHoliday.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      )}

      {/* Recent Announcements — everyone */}
      {recentAnnouncements.length > 0 && (
        <DashboardWidget widgetKey="announcements">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-violet-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Announcements</h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentAnnouncements.map((a: { id: string; title: string; content: string; scope: string; published_at: string; departments: { name: string } | null }) => (
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
        </DashboardWidget>
      )}
    </div>
  );
}
