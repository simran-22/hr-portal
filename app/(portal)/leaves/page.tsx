import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { updateLeaveStatus } from "@/lib/actions/leaves";
import { CalendarDays, CheckCircle, XCircle, Clock, ListFilter } from "lucide-react";
import { LeaveRequestButton } from "@/components/shared/LeaveRequestButton";
import { LeaveBalanceCard } from "@/components/shared/LeaveBalanceCard";

async function getLeaves(status?: string) {
  let query = supabase
    .from("leaves")
    .select("id, type, from_date, to_date, days, reason, status, created_at, employees(name, employee_id)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  const [{ data: leaves }, { count: total }, { count: pending }, { count: approved }, { count: rejected }] =
    await Promise.all([
      query,
      supabase.from("leaves").select("*", { count: "exact", head: true }),
      supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    ]);

  return {
    leaves: leaves ?? [],
    stats: { total: total ?? 0, pending: pending ?? 0, approved: approved ?? 0, rejected: rejected ?? 0 },
  };
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  const canManage = session && ["admin", "hr"].includes(session.role);
  const { leaves, stats } = await getLeaves(sp.status);

  const statCards = [
    { label: "Total Requests", value: stats.total, gradient: "from-violet-500 to-purple-600", icon: CalendarDays },
    { label: "Pending", value: stats.pending, gradient: "from-amber-400 to-orange-500", icon: Clock },
    { label: "Approved", value: stats.approved, gradient: "from-emerald-400 to-teal-600", icon: CheckCircle },
    { label: "Rejected", value: stats.rejected, gradient: "from-red-400 to-rose-600", icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Leave Management</h2>
          <p className="text-slate-500 mt-0.5">Review and manage employee leave requests</p>
        </div>
        <LeaveRequestButton />
      </div>

      {/* Leave Balance */}
      <LeaveBalanceCard />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(({ label, value, gradient, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-slate-500 text-sm">{label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <ListFilter className="w-4 h-4 text-slate-400" />
        {(["all", "pending", "approved", "rejected"] as const).map((s) => {
          const isActive = (sp.status ?? "all") === s;
          const colors: Record<string, string> = {
            all: "from-slate-500 to-slate-600",
            pending: "from-amber-400 to-orange-500",
            approved: "from-emerald-500 to-teal-600",
            rejected: "from-red-500 to-rose-600",
          };
          const href = s === "all" ? "/leaves" : `/leaves?status=${s}`;
          return (
            <a
              key={s}
              href={href}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                isActive
                  ? `bg-gradient-to-r ${colors[s]} text-white shadow-sm`
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <CalendarDays className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-slate-800 font-semibold text-lg">No leave requests</h3>
            <p className="text-slate-500 text-sm mt-1">No requests match the current filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">From</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">To</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Days</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaves.map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {leave.employees?.name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{leave.employees?.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{leave.employees?.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 capitalize">
                      {leave.type?.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(leave.from_date)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(leave.to_date)}</td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-800">{leave.days}</span>
                      <span className="text-xs text-slate-400 ml-1">day{leave.days !== 1 ? "s" : ""}</span>
                    </td>
                    <td className="px-5 py-4">{statusBadge(leave.status)}</td>
                    <td className="px-5 py-4">
                      {leave.status === "pending" && canManage && (
                        <div className="flex items-center gap-2">
                          <form
                            action={async () => {
                              "use server";
                              await updateLeaveStatus(leave.id, "approved");
                            }}
                          >
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          </form>
                          <form
                            action={async () => {
                              "use server";
                              await updateLeaveStatus(leave.id, "rejected");
                            }}
                          >
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
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
