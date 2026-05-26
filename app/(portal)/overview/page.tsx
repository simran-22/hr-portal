import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { HomeTabs } from "@/components/shared/HomeTabs";
import { Users, Clock, CalendarDays, Cake, Briefcase, UserCheck } from "lucide-react";
import Link from "next/link";

async function getOverview() {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const monthEnd = new Date(today);
  monthEnd.setDate(monthEnd.getDate() + 30);

  const [
    { count: totalEmployees },
    { count: presentToday },
    { count: pendingLeaves },
    { count: onLeaveToday },
    { count: upcomingHolidays },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }).neq("status", "terminated"),
    supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", todayIso).in("status", ["present", "late", "half_day"]),
    supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "approved").lte("from_date", todayIso).gte("to_date", todayIso),
    supabase.from("holidays").select("*", { count: "exact", head: true }).gte("date", todayIso).lte("date", monthEnd.toISOString().slice(0, 10)),
  ]);

  return {
    totalEmployees: totalEmployees ?? 0,
    presentToday: presentToday ?? 0,
    pendingLeaves: pendingLeaves ?? 0,
    onLeaveToday: onLeaveToday ?? 0,
    upcomingHolidays: upcomingHolidays ?? 0,
  };
}

const quickLinks = [
  { label: "Check-in / Attendance", href: "/attendance", icon: UserCheck, color: "from-emerald-500 to-teal-600" },
  { label: "Apply for Leave",       href: "/leaves",     icon: CalendarDays, color: "from-amber-500 to-orange-500" },
  { label: "Employee Directory",    href: "/employees",  icon: Users,         color: "from-violet-500 to-purple-600" },
  { label: "Anniversaries",         href: "/anniversaries", icon: Cake,       color: "from-pink-500 to-rose-600" },
  { label: "Payroll",               href: "/payroll",    icon: Briefcase,     color: "from-indigo-500 to-blue-600" },
  { label: "Org Chart",             href: "/org-chart",  icon: Users,         color: "from-cyan-500 to-blue-600" },
];

export default async function OverviewPage() {
  const session = await getSession();
  const stats = await getOverview();

  const cards = [
    { label: "Total Employees", value: stats.totalEmployees, icon: Users,        gradient: "from-violet-500 to-purple-600" },
    { label: "Present Today",   value: stats.presentToday,   icon: UserCheck,    gradient: "from-emerald-500 to-teal-600" },
    { label: "On Leave Today",  value: stats.onLeaveToday,   icon: CalendarDays, gradient: "from-amber-500 to-orange-500" },
    { label: "Pending Leaves",  value: stats.pendingLeaves,  icon: Clock,        gradient: "from-blue-500 to-cyan-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Welcome, {session?.name?.split(" ")[0] ?? "there"}!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">Today at a glance.</p>
      </div>

      <HomeTabs />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, gradient }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Quick Actions</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Jump to common tasks</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-5">
          {quickLinks.map(({ label, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm group-hover:shadow-md transition`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium text-center text-slate-700 dark:text-slate-300">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming reminder */}
      {stats.upcomingHolidays > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              {stats.upcomingHolidays} holiday{stats.upcomingHolidays !== 1 ? "s" : ""} in the next 30 days
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Plan your time off accordingly.</p>
          </div>
          <Link href="/holidays" className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline shrink-0">
            View calendar →
          </Link>
        </div>
      )}
    </div>
  );
}
