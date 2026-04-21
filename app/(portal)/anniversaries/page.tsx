import { supabase } from "@/lib/supabase";
import { Cake, PartyPopper, Calendar } from "lucide-react";

type Employee = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  hire_date: string | null;
  date_of_birth: string | null;
  departments: { name: string } | null;
};

type AnniversaryEntry = {
  employee: Employee;
  date: string;
  dayOfYear: number;
  daysUntil: number;
  yearsCompleted?: number;
  age?: number;
};

function getDayOfYear(month: number, day: number): number {
  return month * 32 + day;
}

function nextAnniversary(month: number, day: number, today: Date): { daysUntil: number; year: number } {
  const thisYear = today.getFullYear();
  const todayStart = new Date(thisYear, today.getMonth(), today.getDate());
  const thisYearDate = new Date(thisYear, month - 1, day);
  const rolledToNextYear = thisYearDate < todayStart;
  const upcoming = rolledToNextYear ? new Date(thisYear + 1, month - 1, day) : thisYearDate;
  const daysUntil = Math.round((upcoming.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  return { daysUntil, year: upcoming.getFullYear() };
}

function formatMonthDay(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

async function getAnniversaryData() {
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, email, position, hire_date, date_of_birth, status, departments(name)")
    .neq("status", "terminated");

  const today = new Date();
  const list = (employees ?? []) as unknown as Employee[];

  const birthdays: AnniversaryEntry[] = [];
  const workAnniversaries: AnniversaryEntry[] = [];

  for (const emp of list) {
    if (emp.date_of_birth) {
      const d = new Date(emp.date_of_birth + "T00:00:00");
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const next = nextAnniversary(month, day, today);
      birthdays.push({
        employee: emp,
        date: emp.date_of_birth,
        dayOfYear: getDayOfYear(month, day),
        daysUntil: next.daysUntil,
        age: next.year - d.getFullYear(),
      });
    }
    if (emp.hire_date) {
      const d = new Date(emp.hire_date + "T00:00:00");
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const next = nextAnniversary(month, day, today);
      workAnniversaries.push({
        employee: emp,
        date: emp.hire_date,
        dayOfYear: getDayOfYear(month, day),
        daysUntil: next.daysUntil,
        yearsCompleted: next.year - d.getFullYear(),
      });
    }
  }

  birthdays.sort((a, b) => a.daysUntil - b.daysUntil);
  workAnniversaries.sort((a, b) => a.daysUntil - b.daysUntil);

  const todayBirthdays = birthdays.filter((b) => b.daysUntil === 0);
  const todayWork = workAnniversaries.filter((w) => w.daysUntil === 0);
  const upcomingBirthdays = birthdays.filter((b) => b.daysUntil > 0 && b.daysUntil <= 30);
  const upcomingWork = workAnniversaries.filter((w) => w.daysUntil > 0 && w.daysUntil <= 30);

  return {
    todayBirthdays,
    todayWork,
    upcomingBirthdays,
    upcomingWork,
    totalWithDob: birthdays.length,
    totalWithHireDate: workAnniversaries.length,
    totalEmployees: list.length,
  };
}

export default async function AnniversariesPage() {
  const d = await getAnniversaryData();

  const stats = [
    {
      label: "Today's Birthdays",
      value: d.todayBirthdays.length,
      icon: Cake,
      gradient: "from-pink-500 to-rose-600",
    },
    {
      label: "Today's Work Anniversaries",
      value: d.todayWork.length,
      icon: PartyPopper,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      label: "Upcoming (30 days)",
      value: d.upcomingBirthdays.length + d.upcomingWork.length,
      icon: Calendar,
      gradient: "from-amber-400 to-orange-500",
    },
    {
      label: "Missing DOB",
      value: d.totalEmployees - d.totalWithDob,
      icon: Cake,
      gradient: "from-slate-400 to-slate-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Anniversaries</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
          Upcoming birthdays and work anniversaries across your team
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, gradient }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today highlights */}
      {(d.todayBirthdays.length > 0 || d.todayWork.length > 0) && (
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <PartyPopper className="w-5 h-5" /> Today&apos;s Celebrations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {d.todayBirthdays.map((b) => (
              <div key={`b-${b.employee.id}`} className="bg-white/15 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-3">
                <Cake className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold">{b.employee.name}</p>
                  <p className="text-sm text-white/80">Birthday today 🎂</p>
                </div>
              </div>
            ))}
            {d.todayWork.map((w) => (
              <div key={`w-${w.employee.id}`} className="bg-white/15 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-3">
                <PartyPopper className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold">{w.employee.name}</p>
                  <p className="text-sm text-white/80">
                    {w.yearsCompleted} {w.yearsCompleted === 1 ? "year" : "years"} with the team 🎉
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two columns — upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Birthdays */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Cake className="w-4 h-4 text-pink-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Upcoming Birthdays</h3>
            <span className="ml-auto text-xs text-slate-400">Next 30 days</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {d.upcomingBirthdays.length === 0 ? (
              <p className="text-slate-400 text-sm px-5 py-6 text-center">No birthdays in the next 30 days</p>
            ) : (
              d.upcomingBirthdays.map((b) => (
                <div key={b.employee.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {b.employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{b.employee.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {b.employee.departments?.name ?? b.employee.position ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">{formatMonthDay(b.date)}</p>
                    <p className="text-xs text-slate-400">in {b.daysUntil} {b.daysUntil === 1 ? "day" : "days"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Work Anniversaries */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Upcoming Work Anniversaries</h3>
            <span className="ml-auto text-xs text-slate-400">Next 30 days</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {d.upcomingWork.length === 0 ? (
              <p className="text-slate-400 text-sm px-5 py-6 text-center">No work anniversaries in the next 30 days</p>
            ) : (
              d.upcomingWork.map((w) => (
                <div key={w.employee.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {w.employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{w.employee.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {w.employee.departments?.name ?? w.employee.position ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">{formatMonthDay(w.date)}</p>
                    <p className="text-xs text-slate-400">
                      {w.yearsCompleted} {w.yearsCompleted === 1 ? "year" : "years"} · in {w.daysUntil} {w.daysUntil === 1 ? "day" : "days"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Missing data nudge */}
      {d.totalEmployees - d.totalWithDob > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-400">
          {d.totalEmployees - d.totalWithDob} employee(s) haven&apos;t set their date of birth yet. Ask them to fill it
          from their profile dropdown, or update it from the employee page.
        </div>
      )}
    </div>
  );
}
