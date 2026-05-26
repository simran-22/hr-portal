import { supabase } from "@/lib/supabase";
import { Cake } from "lucide-react";

type Emp = {
  id: string;
  name: string;
  position: string | null;
  date_of_birth: string | null;
  departments: { name: string } | null;
};

function nextOccurrence(month: number, day: number, today: Date): { date: Date; daysUntil: number } {
  const thisYear = today.getFullYear();
  const todayStart = new Date(thisYear, today.getMonth(), today.getDate());
  let next = new Date(thisYear, month - 1, day);
  if (next < todayStart) next = new Date(thisYear + 1, month - 1, day);
  const daysUntil = Math.round((next.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  return { date: next, daysUntil };
}

export async function BirthdayWidget() {
  const { data } = await supabase
    .from("employees")
    .select("id, name, position, date_of_birth, departments(name)")
    .neq("status", "terminated")
    .not("date_of_birth", "is", null);

  const today = new Date();
  const list = (data ?? []) as unknown as Emp[];

  const upcoming = list
    .filter((e) => e.date_of_birth)
    .map((e) => {
      const d = new Date(e.date_of_birth! + "T00:00:00");
      const { date, daysUntil } = nextOccurrence(d.getMonth() + 1, d.getDate(), today);
      return { ...e, dob: d, date, daysUntil };
    })
    .filter((e) => e.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center">
          <Cake className="w-4 h-4 text-pink-600 dark:text-pink-400" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Birthdays</h3>
        <span className="ml-auto text-xs text-slate-400">Next 14 days</span>
      </div>
      {upcoming.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No upcoming birthdays</div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {upcoming.map((e) => (
            <a key={e.id} href={`/employees/${e.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {e.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{e.name}</p>
                <p className="text-xs text-slate-400 truncate">{e.position ?? e.departments?.name ?? "—"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                  {e.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <p className="text-[10px] text-slate-400">
                  {e.daysUntil === 0 ? "Today 🎂" : `in ${e.daysUntil}d`}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
