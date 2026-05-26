import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { updateLeaveStatus } from "@/lib/actions/leaves";
import { CalendarDays, CheckCircle, XCircle, Clock, ListFilter, Users } from "lucide-react";
import { LeaveRequestButton } from "@/components/shared/LeaveRequestButton";
import { LeaveBalanceCard } from "@/components/shared/LeaveBalanceCard";

type LeaveRow = {
  id: string;
  type: string;
  from_date: string;
  to_date: string;
  days: number;
  reason: string | null;
  status: string;
  created_at: string;
  employee_id: string;
  employees: { id: string; name: string; reports_to: string | null } | null;
  relation: "own" | "team" | "other";
};

async function getLeavesForUser(status?: string) {
  const session = await getSession();
  if (!session) return { leaves: [], stats: emptyStats(), isAdmin: false, isManager: false };

  const isAdmin = session.role === "admin";

  // Resolve employeeId — from session, or fall back to email lookup
  let myEmployeeId = session.employeeId ?? null;
  if (!myEmployeeId && session.email) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("email", session.email)
      .maybeSingle();
    myEmployeeId = emp?.id ?? null;
  }

  // Determine if user is a manager (has any direct reports)
  let directReportIds: string[] = [];
  if (myEmployeeId) {
    const { data: reports } = await supabase
      .from("employees")
      .select("id")
      .eq("reports_to", myEmployeeId);
    directReportIds = (reports ?? []).map((r) => r.id);
  }
  const isManager = directReportIds.length > 0;

  // Build query: admin sees all; manager sees own + team; employee sees own
  let baseQuery = supabase
    .from("leaves")
    .select("id, type, from_date, to_date, days, reason, status, created_at, employee_id, employees(id, name, reports_to)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") baseQuery = baseQuery.eq("status", status);

  if (!isAdmin) {
    const allowedIds = new Set<string>([...directReportIds]);
    if (myEmployeeId) allowedIds.add(myEmployeeId);
    if (allowedIds.size === 0) {
      return { leaves: [], stats: emptyStats(), isAdmin, isManager: false };
    }
    baseQuery = baseQuery.in("employee_id", Array.from(allowedIds));
  }

  const { data: raw } = await baseQuery;

  const leaves: LeaveRow[] = ((raw ?? []) as unknown as LeaveRow[]).map((l) => {
    let relation: "own" | "team" | "other" = "other";
    if (myEmployeeId && l.employee_id === myEmployeeId) relation = "own";
    else if (l.employees?.reports_to && l.employees.reports_to === myEmployeeId) relation = "team";
    else if (isAdmin) relation = "other";
    return { ...l, relation };
  });

  // Stats from visible leaves
  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  return { leaves, stats, isAdmin, isManager };
}

function emptyStats() {
  return { total: 0, pending: 0, approved: 0, rejected: 0 };
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

const TYPE_LABEL: Record<string, string> = {
  annual: "Privilege",
  sick: "Sick",
  casual: "Casual",
  unpaid: "Unpaid",
  maternity: "Maternity",
  paternity: "Paternity",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LeaveTable({
  leaves,
  showActions,
  emptyText,
}: {
  leaves: LeaveRow[];
  showActions: (l: LeaveRow) => boolean;
  emptyText: string;
}) {
  if (leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">From</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">To</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Days</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {leaves.map((leave) => (
            <tr key={leave.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {leave.employees?.name?.charAt(0) ?? "?"}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{leave.employees?.name}</p>
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                {TYPE_LABEL[leave.type] ?? leave.type}
              </td>
              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(leave.from_date)}</td>
              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDate(leave.to_date)}</td>
              <td className="px-5 py-4">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{leave.days}</span>
                <span className="text-xs text-slate-400 ml-1">day{leave.days !== 1 ? "s" : ""}</span>
              </td>
              <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={leave.reason ?? ""}>
                {leave.reason ?? "—"}
              </td>
              <td className="px-5 py-4">{statusBadge(leave.status)}</td>
              <td className="px-5 py-4">
                {leave.status === "pending" && showActions(leave) && (
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
  );
}

export default async function LeavesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const { leaves, stats, isAdmin, isManager } = await getLeavesForUser(sp.status);

  const teamLeaves = leaves.filter((l) => l.relation === "team");
  const myLeaves = leaves.filter((l) => l.relation === "own");
  const otherLeaves = leaves.filter((l) => l.relation === "other");
  const pendingTeam = teamLeaves.filter((l) => l.status === "pending").length;

  const canActOn = (l: LeaveRow) => isAdmin || l.relation === "team";

  const statCards = [
    { label: "Total Requests", value: stats.total, gradient: "from-violet-500 to-purple-600", icon: CalendarDays, filter: "all" as const },
    { label: "Pending", value: stats.pending, gradient: "from-amber-400 to-orange-500", icon: Clock, filter: "pending" as const },
    { label: "Approved", value: stats.approved, gradient: "from-emerald-400 to-teal-600", icon: CheckCircle, filter: "approved" as const },
    { label: "Rejected", value: stats.rejected, gradient: "from-red-400 to-rose-600", icon: XCircle, filter: "rejected" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Leave Management</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            {isAdmin
              ? "All company leave requests"
              : isManager
                ? "Your leaves and your team's requests"
                : "Your leave requests"}
          </p>
        </div>
        <LeaveRequestButton />
      </div>

      {/* Manager alert if pending team approvals */}
      {pendingTeam > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              {pendingTeam} pending {pendingTeam === 1 ? "approval" : "approvals"} from your team
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Review and action below.</p>
          </div>
        </div>
      )}

      {/* Leave Balance */}
      <LeaveBalanceCard />

      {/* Stat Cards — clickable to filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map(({ label, value, gradient, icon: Icon, filter }) => {
          const isActive = (sp.status ?? "all") === filter;
          const href = (filter === "all" ? "/leaves" : `/leaves?status=${filter}`) + "#leaves-list";
          return (
            <a
              key={label}
              href={href}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border flex items-start gap-4 hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer ${
                isActive
                  ? "border-violet-300 dark:border-violet-500/40 ring-2 ring-violet-200 dark:ring-violet-500/20"
                  : "border-slate-100 dark:border-slate-800"
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</p>
              </div>
            </a>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div id="leaves-list" className="flex items-center gap-2 flex-wrap scroll-mt-24">
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
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          );
        })}
      </div>

      {/* Team approvals section (manager only) */}
      {isManager && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Team Approvals</h3>
            <span className="ml-auto text-xs text-slate-400">{teamLeaves.length} request{teamLeaves.length !== 1 ? "s" : ""}</span>
          </div>
          <LeaveTable leaves={teamLeaves} showActions={canActOn} emptyText="No requests from your team yet." />
        </div>
      )}

      {/* My leaves section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">My Leaves</h3>
          <span className="ml-auto text-xs text-slate-400">{myLeaves.length} request{myLeaves.length !== 1 ? "s" : ""}</span>
        </div>
        <LeaveTable
          leaves={myLeaves}
          showActions={() => false}
          emptyText="You haven't requested any leave yet. Click Request Leave to start."
        />
      </div>

      {/* All other leaves (admin only) */}
      {isAdmin && otherLeaves.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Other Requests</h3>
            <span className="ml-auto text-xs text-slate-400">{otherLeaves.length} request{otherLeaves.length !== 1 ? "s" : ""}</span>
          </div>
          <LeaveTable leaves={otherLeaves} showActions={canActOn} emptyText="No other requests." />
        </div>
      )}
    </div>
  );
}
