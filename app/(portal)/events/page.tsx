import { CalendarDays, MapPin, Clock, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { AddEventButton } from "@/components/shared/AddEventButton";
import { DeleteEventButton } from "@/components/shared/DeleteEventButton";

const typeColor: Record<string, string> = {
  Company:    "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  HR:         "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Training:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Onboarding: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Wellness:   "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400",
};

const typeGradient: Record<string, string> = {
  Company:    "from-violet-500 to-purple-600",
  HR:         "from-blue-500 to-cyan-600",
  Training:   "from-emerald-400 to-teal-600",
  Onboarding: "from-amber-400 to-orange-500",
  Wellness:   "from-indigo-500 to-blue-600",
};

export default async function EventsPage() {
  const session = await getSession();
  const isAdmin = session && ["admin", "hr"].includes(session.role);

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  const list = events ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Events</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">Upcoming company events and activities</p>
        </div>
        {isAdmin && <AddEventButton />}
      </div>

      {list.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center text-sm text-slate-400 dark:text-slate-500">
          No events found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {list.map((event) => {
          const color = typeGradient[event.type] ?? "from-pink-500 to-rose-600";
          const dateObj = new Date(event.date + "T00:00:00");
          const formatted = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          });
          return (
            <div key={event.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeColor[event.type] ?? "bg-slate-100 text-slate-600"}`}>
                    {event.type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isAdmin && <DeleteEventButton id={event.id} />}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-3">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{event.description}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <CalendarDays className="w-4 h-4 shrink-0" />
                    <span>{formatted}</span>
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.attendees != null && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Users className="w-4 h-4 shrink-0" />
                      <span>{event.attendees} attendees</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
