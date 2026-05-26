import { supabase } from "@/lib/supabase";
import { HomeTabs } from "@/components/shared/HomeTabs";
import { Cake, PartyPopper, CalendarOff, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

type DayEvent = {
  type: "holiday" | "birthday" | "anniversary" | "leave";
  label: string;
  href?: string;
};

async function getCalendarData(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);

  const [{ data: holidays }, { data: employees }, { data: leaves }] = await Promise.all([
    supabase.from("holidays").select("name, date, type").gte("date", startIso).lte("date", endIso),
    supabase.from("employees").select("id, name, date_of_birth, hire_date").neq("status", "terminated"),
    supabase
      .from("leaves")
      .select("from_date, to_date, type, employees(name)")
      .in("status", ["approved", "pending"])
      .or(`and(from_date.lte.${endIso},to_date.gte.${startIso})`),
  ]);

  // Build per-day event map keyed by 'YYYY-MM-DD'
  const dayMap = new Map<string, DayEvent[]>();

  const push = (key: string, ev: DayEvent) => {
    const list = dayMap.get(key) ?? [];
    list.push(ev);
    dayMap.set(key, list);
  };

  // Holidays
  for (const h of (holidays ?? []) as { name: string; date: string; type: string | null }[]) {
    push(h.date, { type: "holiday", label: h.name, href: "/holidays" });
  }

  // Birthdays + anniversaries (recurrence — match month/day in any year)
  for (const e of (employees ?? []) as { id: string; name: string; date_of_birth: string | null; hire_date: string | null }[]) {
    if (e.date_of_birth) {
      const d = new Date(e.date_of_birth + "T00:00:00");
      if (d.getMonth() === month - 1) {
        const key = `${year}-${String(month).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        push(key, { type: "birthday", label: `🎂 ${e.name}`, href: `/employees/${e.id}` });
      }
    }
    if (e.hire_date) {
      const d = new Date(e.hire_date + "T00:00:00");
      if (d.getMonth() === month - 1 && d.getFullYear() < year) {
        const years = year - d.getFullYear();
        const key = `${year}-${String(month).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        push(key, { type: "anniversary", label: `🎉 ${e.name} · ${years}y`, href: `/employees/${e.id}` });
      }
    }
  }

  // Leaves (for each leave, add to every day in range that falls in this month)
  for (const l of (leaves ?? []) as { from_date: string; to_date: string; type: string; employees: { name: string } | null }[]) {
    const from = new Date(l.from_date.slice(0, 10) + "T00:00:00");
    const to = new Date(l.to_date.slice(0, 10) + "T00:00:00");
    const cursor = new Date(from);
    while (cursor <= to) {
      if (cursor.getFullYear() === year && cursor.getMonth() === month - 1) {
        const key = cursor.toISOString().slice(0, 10);
        push(key, { type: "leave", label: `${l.employees?.name ?? "—"} (${l.type})`, href: "/leaves" });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return { dayMap, monthEnd: end };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = parseInt(sp.year ?? String(now.getFullYear()));
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));

  const { dayMap, monthEnd } = await getCalendarData(year, month);

  // Build calendar grid (Mon-Sun weeks)
  const firstDay = new Date(year, month - 1, 1);
  const firstDayWeek = (firstDay.getDay() + 6) % 7; // 0 = Mon
  const daysInMonth = monthEnd.getDate();

  const cells: ({ date: Date; key: string; isCurrentMonth: boolean } | null)[] = [];
  // Leading days from previous month
  const prevMonth = new Date(year, month - 1, 0);
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const d = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i);
    cells.push({ date: d, key: d.toISOString().slice(0, 10), isCurrentMonth: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month - 1, d);
    cells.push({ date: dt, key: dt.toISOString().slice(0, 10), isCurrentMonth: true });
  }
  // Trailing days
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!.date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, key: next.toISOString().slice(0, 10), isCurrentMonth: false });
  }

  // Prev/Next month links
  const prev = { y: month === 1 ? year - 1 : year, m: month === 1 ? 12 : month - 1 };
  const next = { y: month === 12 ? year + 1 : year, m: month === 12 ? 1 : month + 1 };
  const todayKey = new Date().toISOString().slice(0, 10);

  const colorByType: Record<DayEvent["type"], string> = {
    holiday: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    birthday: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400",
    anniversary: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
    leave: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Calendar</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">Holidays, leaves, birthdays and work anniversaries</p>
        </div>
      </div>

      <HomeTabs />

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-5 py-3">
        <Link
          href={`/calendar?year=${prev.y}&month=${prev.m}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Link>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {MONTH_NAMES[month - 1]} {year}
        </h3>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`}
            className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
          >
            Today
          </Link>
          <Link
            href={`/calendar?year=${next.y}&month=${next.m}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" /> Holiday</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pink-400" /> Birthday</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-500" /> Work Anniversary</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-400" /> Leave</span>
      </div>

      {/* Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} className="min-h-[100px]" />;
            const events = dayMap.get(cell.key) ?? [];
            const isToday = cell.key === todayKey;
            const isWeekend = [5, 6].includes((cell.date.getDay() + 6) % 7);
            return (
              <div
                key={i}
                className={`min-h-[100px] p-2 ${cell.isCurrentMonth ? "" : "opacity-40"} ${isWeekend ? "bg-slate-50/30 dark:bg-slate-800/20" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${isToday ? "bg-violet-600 text-white w-6 h-6 rounded-full flex items-center justify-center" : "text-slate-700 dark:text-slate-300"}`}>
                    {cell.date.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {events.slice(0, 3).map((ev, j) => (
                    <Link
                      key={j}
                      href={ev.href ?? "#"}
                      className={`block text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${colorByType[ev.type]}`}
                      title={ev.label}
                    >
                      {ev.label}
                    </Link>
                  ))}
                  {events.length > 3 && (
                    <p className="text-[10px] text-slate-400 pl-1">+{events.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CalendarOff, label: "Holidays", count: countByType(dayMap, "holiday"), color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
          { icon: Cake,         label: "Birthdays", count: countByType(dayMap, "birthday"), color: "text-pink-600 bg-pink-50 dark:bg-pink-500/10" },
          { icon: PartyPopper,  label: "Work Anniversaries", count: countByType(dayMap, "anniversary"), color: "text-violet-600 bg-violet-50 dark:bg-violet-500/10" },
          { icon: CalendarDays, label: "Leave days", count: countByType(dayMap, "leave"), color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
        ].map(({ icon: Icon, label, count, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">{count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function countByType(map: Map<string, DayEvent[]>, type: DayEvent["type"]): number {
  let total = 0;
  for (const events of map.values()) {
    for (const ev of events) if (ev.type === type) total++;
  }
  return total;
}
