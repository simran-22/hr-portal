import { supabase } from "@/lib/supabase";
import { CalendarDays } from "lucide-react";

type Holiday = {
  id: string;
  name: string;
  date: string;
  type: string | null;
  day: string | null;
};

export async function UpcomingHolidaysWidget() {
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() + 60);
  const todayIso = today.toISOString().slice(0, 10);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("holidays")
    .select("id, name, date, type, day")
    .gte("date", todayIso)
    .lte("date", cutoffIso)
    .order("date", { ascending: true })
    .limit(5);

  const list = (data ?? []) as Holiday[];

  const typeColors: Record<string, string> = {
    national: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    festival: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400",
    regional: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    optional: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
          <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Upcoming Holidays</h3>
        <a href="/holidays" className="ml-auto text-xs text-violet-600 dark:text-violet-400 hover:underline">View all</a>
      </div>
      {list.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No holidays in the next 60 days</div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {list.map((h) => {
            const d = new Date(h.date + "T00:00:00");
            const daysUntil = Math.round((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={h.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <p className="text-[9px] text-white/90 uppercase font-bold leading-none">
                    {d.toLocaleDateString("en-US", { month: "short" })}
                  </p>
                  <p className="text-base font-bold text-white leading-none mt-0.5">{d.getDate()}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{h.name}</p>
                  <p className="text-xs text-slate-400">
                    {h.day ?? d.toLocaleDateString("en-US", { weekday: "long" })}
                    {" · "}
                    {daysUntil === 0 ? "today" : daysUntil === 1 ? "tomorrow" : `in ${daysUntil}d`}
                  </p>
                </div>
                {h.type && (
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-md capitalize shrink-0 ${typeColors[h.type] ?? typeColors.optional}`}>
                    {h.type}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
