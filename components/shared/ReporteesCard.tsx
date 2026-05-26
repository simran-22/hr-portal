import { supabase } from "@/lib/supabase";
import { Users } from "lucide-react";

type Reportee = {
  id: string;
  name: string;
  position: string | null;
  status: string;
};

export async function ReporteesCard({ managerEmployeeId }: { managerEmployeeId: string | null }) {
  if (!managerEmployeeId) return null;

  const { data: reportees } = await supabase
    .from("employees")
    .select("id, name, position, status")
    .eq("reports_to", managerEmployeeId)
    .neq("status", "terminated")
    .order("name")
    .limit(6);

  const list = (reportees ?? []) as Reportee[];
  if (list.length === 0) return null;

  // Today's check-ins for these reportees
  const today = new Date().toISOString().slice(0, 10);
  const { data: attendance } = await supabase
    .from("attendance")
    .select("employee_id, check_in")
    .eq("date", today)
    .in("employee_id", list.map((r) => r.id));

  const checkedInSet = new Set(
    (attendance ?? []).filter((a) => a.check_in).map((a) => a.employee_id)
  );

  const GRADIENTS = [
    "from-violet-500 to-purple-600",
    "from-pink-500 to-rose-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-500",
    "from-indigo-500 to-blue-600",
    "from-cyan-500 to-blue-600",
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Reportees</h3>
        <span className="ml-auto text-xs text-slate-400">{list.length}</span>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {list.map((r, i) => {
          const checkedIn = checkedInSet.has(r.id);
          return (
            <a
              key={r.id}
              href={`/employees/${r.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-white text-sm font-bold shrink-0 relative`}>
                {r.name.charAt(0).toUpperCase()}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                    checkedIn ? "bg-emerald-500" : "bg-red-400"
                  }`}
                  title={checkedIn ? "Checked in" : "Yet to check-in"}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{r.name}</p>
                <p className={`text-xs truncate ${checkedIn ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  {checkedIn ? "Checked in" : "Yet to check-in"}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
