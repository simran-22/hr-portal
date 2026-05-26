import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { HomeTabs } from "@/components/shared/HomeTabs";
import { ProfileHeroBanner } from "@/components/shared/ProfileHeroBanner";
import { CheckInCard } from "@/components/shared/CheckInCard";
import { ReporteesCard } from "@/components/shared/ReporteesCard";
import { WeeklyScheduleCard } from "@/components/shared/WeeklyScheduleCard";
import { PendingTasksWidget } from "@/components/shared/PendingTasksWidget";
import Link from "next/link";
import { AlertCircle, FileText } from "lucide-react";

async function resolveEmployee(sessionEmployeeId: string | null, sessionEmail: string | null) {
  if (sessionEmployeeId) {
    const { data } = await supabase
      .from("employees")
      .select("id, position, avatar_url")
      .eq("id", sessionEmployeeId)
      .maybeSingle();
    if (data) return data;
  }
  if (sessionEmail) {
    const { data } = await supabase
      .from("employees")
      .select("id, position, avatar_url")
      .eq("email", sessionEmail)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

async function checkShiftAlert(employeeId: string | null) {
  if (!employeeId) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("attendance")
    .select("check_in")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .maybeSingle();
  // Show reminder if not checked in yet and shift has started
  const now = new Date();
  const shiftStart = new Date();
  shiftStart.setHours(9, 0, 0, 0);
  if (!data?.check_in && now > shiftStart) return true;
  return false;
}

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) return null;

  const emp = await resolveEmployee(session.employeeId ?? null, session.email ?? null);
  const employeeId = emp?.id ?? null;
  const shiftAlert = await checkShiftAlert(employeeId);

  // Fetch profile for cover + avatar
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, cover_url")
    .eq("id", session.id)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <HomeTabs />

      <ProfileHeroBanner
        name={session.name}
        role={session.role}
        avatarUrl={profile?.avatar_url ?? null}
        coverUrl={profile?.cover_url ?? null}
        position={emp?.position ?? null}
      />

      {/* Two-column layout: left sidebar + right activities */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        {/* LEFT — check-in + reportees */}
        <div className="space-y-5">
          <CheckInCard />
          <ReporteesCard managerEmployeeId={employeeId} />
        </div>

        {/* RIGHT — activities */}
        <div className="space-y-4">
          {/* Sub-tabs (links to existing pages for now) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <nav className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
              {[
                { label: "Activities", href: "/overview", active: true },
                { label: "Profile", href: "/settings", active: false },
                { label: "Leave", href: "/leaves", active: false },
                { label: "Attendance", href: "/attendance", active: false },
                { label: "Approvals", href: "/leaves?status=pending", active: false },
              ].map((t) => (
                <Link
                  key={t.label}
                  href={t.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
                    t.active
                      ? "bg-violet-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Check-in reminder */}
          {shiftAlert && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Check-in reminder</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your shift has already started.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">General</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">9:00 AM – 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weekly schedule */}
          <WeeklyScheduleCard employeeId={employeeId} />

          {/* Time logs reminder (only show if employee role) */}
          {session.role === "employee" && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                You are yet to submit your time logs today!
              </p>
              <Link
                href="/attendance"
                className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline shrink-0"
              >
                Submit →
              </Link>
            </div>
          )}

          {/* Pending tasks widget */}
          <PendingTasksWidget />
        </div>
      </div>
    </div>
  );
}
