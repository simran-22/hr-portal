import { supabase } from "@/lib/supabase";
import { UserCheck, UserX, CalendarOff, ClipboardList } from "lucide-react";
import { AttendanceActions } from "@/components/shared/AttendanceActions";
import { HoursSummary } from "@/components/shared/HoursSummary";
import { getSession } from "@/lib/session";

async function getTodayAttendance() {
  const today = new Date().toISOString().split("T")[0];

  const [{ data: records }, { count: present }, { count: absent }, { count: onLeave }] =
    await Promise.all([
      supabase
        .from("attendance")
        .select("id, date, check_in, check_out, status, hours_worked, employees(name, employee_id)")
        .eq("date", today)
        .order("check_in", { ascending: false }),
      supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "present"),
      supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "absent"),
      supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "on_leave"),
    ]);

  return {
    records: records ?? [],
    today,
    stats: { present: present ?? 0, absent: absent ?? 0, onLeave: onLeave ?? 0 },
  };
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    present: "bg-emerald-100 text-emerald-700",
    absent: "bg-red-100 text-red-700",
    on_leave: "bg-amber-100 text-amber-700",
    half_day: "bg-blue-100 text-blue-700",
    late: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

function formatTime(datetime: string | null) {
  if (!datetime) return "—";
  return new Date(datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AttendancePage() {
  const [{ records, today, stats }, session] = await Promise.all([
    getTodayAttendance(),
    getSession(),
  ]);
  const isAdmin = session?.role === "admin";

  const statCards = [
    {
      label: "Present Today",
      value: stats.present,
      icon: UserCheck,
      gradient: "from-emerald-400 to-teal-600",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Absent Today",
      value: stats.absent,
      icon: UserX,
      gradient: "from-red-400 to-rose-600",
      bg: "bg-red-50",
      text: "text-red-600",
    },
    {
      label: "On Leave",
      value: stats.onLeave,
      icon: CalendarOff,
      gradient: "from-amber-400 to-orange-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      label: "Total Records",
      value: records.length,
      icon: ClipboardList,
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance</h2>
          <p className="text-slate-500 mt-0.5">{formatDateLong(today)}</p>
        </div>
        <AttendanceActions />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(({ label, value, icon: Icon, gradient, bg, text }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">{label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hours Summary */}
      <HoursSummary isAdmin={isAdmin} />

      {/* Today's Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Today&apos;s Records</h3>
          <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
            {records.length} record{records.length !== 1 ? "s" : ""}
          </span>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-slate-800 font-semibold text-lg">No attendance records yet</h3>
            <p className="text-slate-500 text-sm mt-1">Records will appear here as employees check in</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check In</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Check Out</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((record: any) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {record.employees?.name?.charAt(0) ?? "?"}
                        </div>
                        <span className="text-sm font-medium text-slate-800">{record.employees?.name ?? "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {record.employees?.employee_id ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${record.check_in ? "text-emerald-600" : "text-slate-300"}`}>
                        {formatTime(record.check_in)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${record.check_out ? "text-slate-700" : "text-slate-300"}`}>
                        {formatTime(record.check_out)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {record.hours_worked ? (
                        <span className="text-sm font-semibold text-slate-700">
                          {Number(record.hours_worked).toFixed(1)}h
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">{statusBadge(record.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
