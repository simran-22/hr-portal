import { supabase } from "@/lib/supabase";
import { UserPlus } from "lucide-react";

type Emp = {
  id: string;
  name: string;
  position: string | null;
  hire_date: string;
  departments: { name: string } | null;
};

export async function NewHiresWidget() {
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 30);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("employees")
    .select("id, name, position, hire_date, departments(name)")
    .neq("status", "terminated")
    .not("hire_date", "is", null)
    .gte("hire_date", cutoffIso)
    .order("hire_date", { ascending: false })
    .limit(5);

  const list = (data ?? []) as unknown as Emp[];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">New Hires</h3>
        <span className="ml-auto text-xs text-slate-400">Last 30 days</span>
      </div>
      {list.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No new joiners this month</div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {list.map((e) => {
            const joinDate = new Date(e.hire_date + "T00:00:00");
            const daysAgo = Math.round((today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <a key={e.id} href={`/employees/${e.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {e.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{e.name}</p>
                  <p className="text-xs text-slate-400 truncate">{e.position ?? e.departments?.name ?? "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {joinDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {daysAgo === 0 ? "joined today" : `${daysAgo}d ago`}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
