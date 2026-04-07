import { CalendarDays } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { AddHolidayButton } from "@/components/shared/AddHolidayButton";
import { DeleteHolidayButton } from "@/components/shared/DeleteHolidayButton";
import { HolidayYearSelector } from "@/components/shared/HolidayYearSelector";

const typeColor: Record<string, string> = {
  National: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Festival: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  Optional: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
};

export default async function HolidaysPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const year = params.year ? Number(params.year) : new Date().getFullYear();
  const isAdmin = session && ["admin"].includes(session.role);

  const { data: holidays } = await supabase
    .from("holidays")
    .select("*")
    .eq("year", year)
    .order("date", { ascending: true });

  const list = holidays ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Holidays</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{list.length} holidays in {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <HolidayYearSelector currentYear={year} />
          {isAdmin && <AddHolidayButton />}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Day</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Holiday</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
              {isAdmin && (
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {list.map((h) => {
              const dateObj = new Date(h.date + "T00:00:00");
              const formatted = dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              });
              return (
                <tr key={h.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-violet-600 dark:text-violet-400">{h.day}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{formatted}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      {h.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColor[h.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {h.type}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <DeleteHolidayButton id={h.id} />
                    </td>
                  )}
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                  No holidays found for {year}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
