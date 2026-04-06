import { CalendarDays, Plus, MapPin, Clock, Users } from "lucide-react";

const EVENTS = [
  { title: "Annual Company Meeting", date: "Apr 15, 2025", time: "10:00 AM", location: "Main Conference Hall", attendees: 120, type: "Company", color: "from-violet-500 to-purple-600" },
  { title: "Q2 Performance Review", date: "Apr 20, 2025", time: "2:00 PM", location: "HR Office", attendees: 45, type: "HR", color: "from-blue-500 to-cyan-600" },
  { title: "Team Building Workshop", date: "May 03, 2025", time: "9:00 AM", location: "Training Center", attendees: 60, type: "Training", color: "from-emerald-400 to-teal-600" },
  { title: "New Employee Orientation", date: "May 10, 2025", time: "11:00 AM", location: "Board Room", attendees: 15, type: "Onboarding", color: "from-amber-400 to-orange-500" },
  { title: "Leadership Summit", date: "May 22, 2025", time: "9:00 AM", location: "Executive Suite", attendees: 30, type: "Company", color: "from-pink-500 to-rose-600" },
  { title: "Health & Wellness Day", date: "Jun 05, 2025", time: "8:00 AM", location: "Company Grounds", attendees: 200, type: "Wellness", color: "from-indigo-500 to-blue-600" },
];

const typeColor: Record<string, string> = {
  Company:    "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  HR:         "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Training:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Onboarding: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Wellness:   "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400",
};

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Events</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">Upcoming company events and activities</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {EVENTS.map((event, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${event.color}`} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColor[event.type] ?? "bg-slate-100 text-slate-600"}`}>
                  {event.type}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${event.color} flex items-center justify-center shadow-sm`}>
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-3">{event.title}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>{event.attendees} attendees</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
