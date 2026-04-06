import { CalendarDays, Plus } from "lucide-react";

const HOLIDAYS = [
  { day: "Wednesday", date: "Jan 01, 2025", name: "New Year's Day", type: "National" },
  { day: "Friday",    date: "Jan 26, 2025", name: "Republic Day",   type: "National" },
  { day: "Friday",    date: "Mar 14, 2025", name: "Holi",           type: "Festival" },
  { day: "Friday",    date: "Apr 18, 2025", name: "Good Friday",    type: "National" },
  { day: "Monday",    date: "Apr 14, 2025", name: "Dr. Ambedkar Jayanti", type: "National" },
  { day: "Sunday",    date: "May 01, 2025", name: "Labour Day",     type: "National" },
  { day: "Thursday",  date: "Jun 05, 2025", name: "Eid-ul-Fitr",    type: "Festival" },
  { day: "Friday",    date: "Aug 15, 2025", name: "Independence Day", type: "National" },
  { day: "Thursday",  date: "Aug 28, 2025", name: "Janmashtami",    type: "Festival" },
  { day: "Friday",    date: "Oct 02, 2025", name: "Gandhi Jayanti", type: "National" },
  { day: "Thursday",  date: "Oct 23, 2025", name: "Diwali",         type: "Festival" },
  { day: "Thursday",  date: "Dec 25, 2025", name: "Christmas",      type: "National" },
];

const typeColor: Record<string, string> = {
  National: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Festival: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
};

export default function HolidaysPage() {
  const year = new Date().getFullYear();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Holidays</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{HOLIDAYS.length} holidays in {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20">
            <option>{year}</option>
            <option>{year - 1}</option>
          </select>
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
            <Plus className="w-4 h-4" />
            Add Holiday
          </button>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {HOLIDAYS.map((h, i) => (
              <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-violet-600 dark:text-violet-400">{h.day}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{h.date}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    {h.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColor[h.type]}`}>
                    {h.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
