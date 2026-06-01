"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Sunrise, CalendarDays, Coins, Users, Clock, Check, X } from "lucide-react";
import { toast } from "react-hot-toast";
import type { IncentiveRow } from "@/lib/incentives";

type Props = {
  initialRows: IncentiveRow[];
  initialMonth: string;
  scope: "admin" | "manager" | "employee" | string;
};

type EditMode = "direct" | "propose";

function monthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString(undefined, { month: "long", year: "numeric" });
    opts.push({ value, label });
  }
  return opts;
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MorningShiftClient({ initialRows, initialMonth, scope }: Props) {
  const [rows, setRows] = useState<IncentiveRow[]>(initialRows);
  const [month, setMonth] = useState(initialMonth);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRate, setDraftRate] = useState("");
  const [draftNote, setDraftNote] = useState("");

  const isAdmin = scope === "admin";
  const isManager = scope === "manager";
  const editMode: EditMode = isAdmin ? "direct" : "propose";

  const months = useMemo(monthOptions, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.position ?? "").toLowerCase().includes(q) ||
        (r.department ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const totals = useMemo(() => {
    const amount = rows.reduce((s, r) => s + r.amount, 0);
    const days = rows.reduce((s, r) => s + r.morningDays, 0);
    const earners = rows.filter((r) => r.amount > 0).length;
    const pending = rows.filter((r) => r.pendingProposal).length;
    return { amount, days, earners, employees: rows.length, pending };
  }, [rows]);

  const refetch = (nextMonth: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/incentives/morning-shift?month=${nextMonth}`, { cache: "no-store" });
      if (!res.ok) {
        toast.error("Failed to load incentives");
        return;
      }
      const data = (await res.json()) as { rows: IncentiveRow[] };
      setRows(data.rows ?? []);
    });
  };

  const onMonthChange = (next: string) => {
    setMonth(next);
    refetch(next);
  };

  const beginEdit = (row: IncentiveRow) => {
    setEditingId(row.employeeId);
    setDraftRate(String(editMode === "propose" && row.pendingProposal ? row.pendingProposal.proposedRate : row.rate));
    setDraftNote("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftRate("");
    setDraftNote("");
  };

  const directSaveRate = async (employeeId: string) => {
    const rate = Number(draftRate);
    if (!Number.isFinite(rate) || rate < 0) {
      toast.error("Rate must be a non-negative number");
      return;
    }
    const res = await fetch(`/api/incentives/morning-shift/${employeeId}/rate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to update rate");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.employeeId === employeeId
          ? { ...r, rate, amount: Number((rate * r.morningDays).toFixed(2)) }
          : r
      )
    );
    toast.success("Rate updated");
    cancelEdit();
  };

  const submitProposal = async (employeeId: string) => {
    const rate = Number(draftRate);
    if (!Number.isFinite(rate) || rate < 0) {
      toast.error("Rate must be a non-negative number");
      return;
    }
    const res = await fetch(`/api/incentives/morning-shift/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, proposedRate: rate, note: draftNote }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to submit proposal");
      return;
    }
    refetch(month);
    toast.success("Proposal sent to HR");
    cancelEdit();
  };

  const decideProposal = async (proposalId: string, action: "approve" | "reject") => {
    const res = await fetch(`/api/incentives/morning-shift/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || `Failed to ${action}`);
      return;
    }
    refetch(month);
    toast.success(action === "approve" ? "Approved" : "Rejected");
  };

  const withdrawProposal = async (proposalId: string) => {
    const res = await fetch(`/api/incentives/morning-shift/proposals/${proposalId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to withdraw");
      return;
    }
    refetch(month);
    toast.success("Proposal withdrawn");
  };

  const scopeLabel =
    scope === "admin"
      ? "Showing all active employees"
      : scope === "manager"
      ? "Showing your direct reports"
      : "Showing your incentive";

  const pendingForAdmin = isAdmin ? rows.filter((r) => r.pendingProposal) : [];

  return (
    <div className="space-y-5">
      {/* Header row: month + scope hint */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Period</p>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            disabled={isPending}
            className="mt-1 px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{scopeLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Coins} label="Total payout" value={`₹${formatINR(totals.amount)}`} gradient="from-violet-500 to-purple-600" />
        <StatCard icon={CalendarDays} label="Morning-shift days" value={String(totals.days)} gradient="from-emerald-500 to-teal-600" />
        <StatCard icon={Sunrise} label="Earners" value={String(totals.earners)} gradient="from-amber-500 to-orange-600" />
        <StatCard icon={Users} label="Employees in view" value={String(totals.employees)} gradient="from-blue-500 to-cyan-600" />
      </div>

      {/* HR pending-approvals banner */}
      {isAdmin && pendingForAdmin.length > 0 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm mb-3">
            <Clock className="w-4 h-4" />
            {pendingForAdmin.length} rate proposal{pendingForAdmin.length !== 1 ? "s" : ""} awaiting review
          </div>
          <div className="space-y-2">
            {pendingForAdmin.map((r) => r.pendingProposal && (
              <div key={r.pendingProposal.id} className="flex flex-wrap items-center gap-3 bg-white/70 dark:bg-slate-900/40 rounded-xl px-3 py-2 text-sm">
                <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                  ₹{formatINR(r.rate)} <span className="text-slate-300">→</span> <span className="font-semibold text-slate-800 dark:text-slate-100">₹{formatINR(r.pendingProposal.proposedRate)}</span>
                </span>
                <span className="text-xs text-slate-400">
                  by {r.pendingProposal.proposedByName ?? "unknown"}
                </span>
                {r.pendingProposal.note && (
                  <span className="text-xs italic text-slate-500 truncate max-w-[260px]">
                    “{r.pendingProposal.note}”
                  </span>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => decideProposal(r.pendingProposal!.id, "approve")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decideProposal(r.pendingProposal!.id, "reject")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-rose-600 hover:border-rose-300"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {scope !== "employee" && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name, position, or department"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Department</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Rate / day</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Morning days</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <Sunrise className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>
                      {scope === "manager"
                        ? "No direct reports found."
                        : scope === "employee"
                        ? "No incentive recorded for you this month."
                        : query
                        ? "No employees match your filter."
                        : "No employees found."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const isEditing = editingId === row.employeeId;
                  const pending = row.pendingProposal;
                  return (
                    <tr key={row.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold">
                            {initials(row.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{row.name}</p>
                            <p className="text-xs text-slate-400 truncate">{row.position ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{row.department ?? "—"}</td>

                      {/* Rate cell */}
                      <td className="px-5 py-3 text-right">
                        {isEditing ? (
                          editMode === "direct" ? (
                            <DirectEdit
                              draftRate={draftRate}
                              setDraftRate={setDraftRate}
                              onSave={() => directSaveRate(row.employeeId)}
                              onCancel={cancelEdit}
                            />
                          ) : (
                            <ProposeEdit
                              draftRate={draftRate}
                              setDraftRate={setDraftRate}
                              draftNote={draftNote}
                              setDraftNote={setDraftNote}
                              onSubmit={() => submitProposal(row.employeeId)}
                              onCancel={cancelEdit}
                            />
                          )
                        ) : (
                          <RateDisplay
                            row={row}
                            scope={scope}
                            isAdmin={isAdmin}
                            isManager={isManager}
                            onBeginEdit={() => beginEdit(row)}
                            onWithdraw={pending ? () => withdrawProposal(pending.id) : undefined}
                          />
                        )}
                      </td>

                      <td className="px-5 py-3 text-right tabular-nums text-slate-700 dark:text-slate-200">
                        {row.morningDays}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                        ₹{formatINR(row.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Days are counted from attendance entries marked <span className="font-semibold">P-Morning</span> in the
        HR Reports grid. {isManager ? "Rate changes you submit go to HR for approval." : null}
      </p>
    </div>
  );
}

function RateDisplay({
  row,
  scope,
  isAdmin,
  isManager,
  onBeginEdit,
  onWithdraw,
}: {
  row: IncentiveRow;
  scope: string;
  isAdmin: boolean;
  isManager: boolean;
  onBeginEdit: () => void;
  onWithdraw?: () => void;
}) {
  const pending = row.pendingProposal;
  const canClickToEdit = isAdmin || isManager;

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={canClickToEdit ? onBeginEdit : undefined}
        disabled={!canClickToEdit}
        className={`tabular-nums ${
          canClickToEdit
            ? "text-slate-700 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer"
            : "text-slate-700 dark:text-slate-200 cursor-default"
        }`}
        title={
          isAdmin
            ? "Click to edit rate"
            : isManager
            ? pending
              ? "A proposal is already pending"
              : "Click to propose a new rate"
            : undefined
        }
      >
        ₹{formatINR(row.rate)}
      </button>

      {pending && (
        <div className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
          <Clock className="w-3 h-3" />
          <span>
            proposed ₹{formatINR(pending.proposedRate)}
            {pending.proposedByName ? ` by ${pending.proposedByName.split(" ")[0]}` : ""}
          </span>
          {onWithdraw && scope !== "employee" && (
            <button
              type="button"
              onClick={onWithdraw}
              className="ml-1 text-amber-700 hover:text-amber-900 dark:hover:text-amber-100"
              title="Withdraw proposal"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DirectEdit({
  draftRate,
  setDraftRate,
  onSave,
  onCancel,
}: {
  draftRate: string;
  setDraftRate: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 justify-end">
      <input
        type="number"
        min="0"
        step="1"
        value={draftRate}
        onChange={(e) => setDraftRate(e.target.value)}
        autoFocus
        className="w-24 px-2 py-1 text-right text-sm rounded-md border border-violet-300 dark:border-violet-500/50 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
      />
      <button
        type="button"
        onClick={onSave}
        className="px-2 py-1 text-xs font-medium rounded-md bg-violet-600 text-white hover:bg-violet-700"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-2 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
      >
        Cancel
      </button>
    </div>
  );
}

function ProposeEdit({
  draftRate,
  setDraftRate,
  draftNote,
  setDraftNote,
  onSubmit,
  onCancel,
}: {
  draftRate: string;
  setDraftRate: (v: string) => void;
  draftNote: string;
  setDraftNote: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="inline-flex flex-col items-end gap-1.5 max-w-[260px]">
      <div className="inline-flex items-center gap-1">
        <span className="text-[11px] text-slate-400">Propose ₹</span>
        <input
          type="number"
          min="0"
          step="1"
          value={draftRate}
          onChange={(e) => setDraftRate(e.target.value)}
          autoFocus
          className="w-24 px-2 py-1 text-right text-sm rounded-md border border-violet-300 dark:border-violet-500/50 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <span className="text-[11px] text-slate-400">/day</span>
      </div>
      <input
        type="text"
        value={draftNote}
        onChange={(e) => setDraftNote(e.target.value)}
        placeholder="Optional note for HR"
        className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
      />
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={onSubmit}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-violet-600 text-white hover:bg-violet-700"
        >
          Send to HR
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: typeof Sunrise;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{value}</p>
      </div>
    </div>
  );
}
