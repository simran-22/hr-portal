import { supabase } from "@/lib/supabase";
import { Clock } from "lucide-react";

type AttendanceRow = {
  date: string;
  status: string;
  check_in: string | null;
};

function startOfWeek(today: Date): Date {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Mon = 0
  d.setDate(d.getDate() + diff);
  return d;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function WeeklyScheduleCard({ employeeId }: { employeeId: string | null }) {
  const today = new Date();
  const start = startOfWeek(today);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);

  let attendance: AttendanceRow[] = [];
  let approvedLeaves: { from_date: string; to_date: string }[] = [];

  if (employeeId) {
    const { data: att } = await supabase
      .from("attendance")
      .select("date, status, check_in")
      .eq("employee_id", employeeId)
      .gte("date", startIso)
      .lte("date", endIso);
    attendance = (att ?? []) as AttendanceRow[];

    const { data: lv } = await supabase
      .from("leaves")
      .select("from_date, to_date")
      .eq("employee_id", employeeId)
      .eq("status", "approved")
      .lte("from_date", endIso)
      .gte("to_date", startIso);
    approvedLeaves = (lv ?? []) as { from_date: string; to_date: string }[];
  }

  const { data: holidaysData } = await supabase
    .from("holidays")
    .select("date, name")
    .gte("date", startIso)
    .lte("date", endIso);
  const holidayMap = new Map<string, string>();
  for (const h of (holidaysData ?? []) as { date: string; name: string }[]) {
    holidayMap.set(h.date, h.name);
  }

  const attendanceMap = new Map<string, AttendanceRow>();
  for (const a of attendance) attendanceMap.set(a.date, a);

  const isLeaveDay = (iso: string) => {
    const d = new Date(iso + "T00:00:00").getTime();
    return approvedLeaves.some((l) => {
      const f = new Date(l.from_date.slice(0, 10) + "T00:00:00").getTime();
      const t = new Date(l.to_date.slice(0, 10) + "T00:00:00").getTime();
      return d >= f && d <= t;
    });
  };

  // Build 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const dayLabel = DAY_LABELS[d.getDay()];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isToday = iso === today.toISOString().slice(0, 10);
    const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isHoliday = holidayMap.get(iso);
    const att = attendanceMap.get(iso);
    const onLeave = isLeaveDay(iso);

    let status: { label: string; color: string } | null = null;
    if (isHoliday) status = { label: "Holiday", color: "text-amber-500" };
    else if (isWeekend) status = { label: "Weekend", color: "text-amber-500" };
    else if (onLeave) status = { label: "On Leave", color: "text-blue-500" };
    else if (att?.check_in) status = { label: "Present", color: "text-emerald-500" };
    else if (isPast && !att) status = { label: "Absent", color: "text-red-500" };
    else if (isToday && !att?.check_in) status = { label: "Pending", color: "text-slate-400" };

    return { date: d, iso, dayLabel, isToday, isWeekend, status };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Work Schedule</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – {end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
          9:00 AM – 6:00 PM
        </span>
      </div>

      {/* Day grid */}
      <div className="p-5">
        <div className="relative flex items-start justify-between gap-2">
          {days.map((d) => (
            <div key={d.iso} className="flex-1 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium">{d.dayLabel}</p>
              <p
                className={`inline-flex items-center justify-center mt-1 text-sm font-bold w-8 h-8 rounded-full ${
                  d.isToday
                    ? "bg-violet-600 text-white"
                    : d.isWeekend
                      ? "text-slate-400"
                      : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {d.date.getDate()}
              </p>
              {d.status && (
                <p className={`text-[10px] font-medium mt-1 ${d.status.color}`}>{d.status.label}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
