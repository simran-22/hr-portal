"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X, ArrowUpRight, ArrowDownRight, Search, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Check, Loader2, AlertCircle, Users as UsersIcon, Calendar, UserCheck,
} from "lucide-react";

export type EmployeeForRun = {
  id: string;
  employeeCode: string;
  name: string;
  email: string | null;
  position: string | null;
  status: string;
  isNew: boolean;
  isExit: boolean;
  alreadyPaid: boolean;
  prevEarnings: number | null;
  defaults: {
    basic: number;
    allowances: number;
    reimbursement: number;
    benefits: number;
    tax: number;
    deductions: number;
    postTaxDeductions: number;
    paymentMethod: string;
  };
};

type RowState = {
  selected: boolean;
  basic: number;
  allowances: number;
  reimbursement: number;
  benefits: number;
  tax: number;
  deductions: number;
  postTaxDeductions: number;
  paymentMethod: string;
};

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const earningsOf = (s: RowState) => s.basic + s.allowances + s.reimbursement + s.benefits;
const deductionsOf = (s: RowState) => s.tax + s.deductions + s.postTaxDeductions;
const netOf = (s: RowState) => earningsOf(s) - deductionsOf(s);

const PAYMENT_LABEL: Record<string, string> = {
  direct_deposit: "Direct Deposit",
  cheque: "Cheque",
  cash: "Cash",
  upi: "UPI",
};

export function RunPayrollWizard({
  employees,
  month,
  year,
  defaultPayDay,
  runByName,
}: {
  employees: EmployeeForRun[];
  month: number;
  year: number;
  defaultPayDay: string;
  runByName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [tab, setTab] = useState<"all" | "exit" | "new">("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [payDay, setPayDay] = useState(defaultPayDay);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialise per-row state with defaults; auto-deselect already-paid + exit
  const [rowState, setRowState] = useState<Record<string, RowState>>(() => {
    const map: Record<string, RowState> = {};
    for (const e of employees) {
      map[e.id] = {
        selected: !e.alreadyPaid && !e.isExit,
        basic: e.defaults.basic,
        allowances: e.defaults.allowances,
        reimbursement: e.defaults.reimbursement,
        benefits: e.defaults.benefits,
        tax: e.defaults.tax,
        deductions: e.defaults.deductions,
        postTaxDeductions: e.defaults.postTaxDeductions,
        paymentMethod: e.defaults.paymentMethod,
      };
    }
    return map;
  });

  const updateRow = (id: string, patch: Partial<RowState>) => {
    setRowState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  // Filter by tab
  const filtered = useMemo(() => {
    let list = employees;
    if (tab === "exit") list = list.filter((e) => e.isExit);
    else if (tab === "new") list = list.filter((e) => e.isNew);
    else list = list.filter((e) => !e.isExit);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.position?.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) =>
      sortDir === "asc"
        ? a.employeeCode.localeCompare(b.employeeCode)
        : b.employeeCode.localeCompare(a.employeeCode)
    );
    return list;
  }, [employees, tab, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [tab, search, pageSize]);

  // Counts for header summary
  const summary = useMemo(() => {
    const newCount = employees.filter((e) => e.isNew && !e.isExit).length;
    const exitCount = employees.filter((e) => e.isExit).length;
    return { total: employees.length, newCount, exitCount };
  }, [employees]);

  const selectedRows = useMemo(
    () => employees.filter((e) => rowState[e.id]?.selected && !rowState[e.id]?.selected === false),
    [employees, rowState]
  ).filter((e) => rowState[e.id]?.selected);

  const reviewTotals = useMemo(() => {
    let basic = 0, allow = 0, reimb = 0, benef = 0, tax = 0, ded = 0, postDed = 0, net = 0;
    for (const e of selectedRows) {
      const s = rowState[e.id];
      basic += s.basic;
      allow += s.allowances;
      reimb += s.reimbursement;
      benef += s.benefits;
      tax += s.tax;
      ded += s.deductions;
      postDed += s.postTaxDeductions;
      net += netOf(s);
    }
    return { basic, allow, reimb, benef, tax, ded, postDed, net, count: selectedRows.length };
  }, [selectedRows, rowState]);

  const pageAllSelected =
    pageRows.length > 0 && pageRows.every((e) => rowState[e.id]?.selected);

  const togglePageAll = () => {
    const newVal = !pageAllSelected;
    setRowState((prev) => {
      const next = { ...prev };
      for (const e of pageRows) {
        if (e.alreadyPaid) continue;
        next[e.id] = { ...next[e.id], selected: newVal };
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedRows.length === 0) {
      setError("Select at least one employee to process.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const items = selectedRows.map((e) => {
        const s = rowState[e.id];
        return {
          employeeId: e.id,
          basic: s.basic,
          allowances: s.allowances,
          reimbursement: s.reimbursement,
          benefits: s.benefits,
          tax: s.tax,
          deductions: s.deductions,
          postTaxDeductions: s.postTaxDeductions,
          paymentMethod: s.paymentMethod,
        };
      });
      const res = await fetch("/api/payroll/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, payDay, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to process payroll");
        return;
      }
      router.push(`/payroll?month=${month}&year=${year}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header — title + stepper + continue + close */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 shrink-0">Run payroll</h2>

        {/* Stepper */}
        <div className="flex-1 flex items-center justify-center gap-4">
          <StepIndicator num={1} label="Salaried" active={step === 1} done={step > 1} onClick={() => setStep(1)} />
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <StepIndicator num={2} label="Review & confirm" active={step === 2} done={false} onClick={() => selectedRows.length > 0 && setStep(2)} />
        </div>

        {step === 1 ? (
          <button
            onClick={() => {
              if (selectedRows.length === 0) {
                setError("Select at least one employee to continue.");
                return;
              }
              setError(null);
              setStep(2);
            }}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md px-5 py-1.5 text-sm font-medium shadow-sm transition shrink-0"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md px-5 py-1.5 text-sm font-medium shadow-sm transition shrink-0 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {submitting ? "Processing..." : "Confirm & Process"}
          </button>
        )}

        <button onClick={() => router.push("/payroll")} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary bar */}
      <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-8 text-sm">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Employees</p>
          <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {summary.total}
            {summary.newCount > 0 && (
              <span className="inline-flex items-center text-xs text-emerald-600">
                <ChevronUp className="w-3 h-3" />{summary.newCount}
              </span>
            )}
            {summary.exitCount > 0 && (
              <span className="inline-flex items-center text-xs text-red-500">
                <ChevronDown className="w-3 h-3" />{summary.exitCount}
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Run by</p>
          <p className="font-medium text-slate-700 dark:text-slate-200">{runByName} · {MONTHS[month - 1]} {year}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Pay day</p>
          <input
            type="date"
            value={payDay}
            onChange={(e) => setPayDay(e.target.value)}
            className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        {selectedRows.length > 0 && (
          <div className="ml-auto text-xs">
            <span className="font-semibold text-violet-700 dark:text-violet-400">{selectedRows.length} selected</span>
            <span className="text-slate-500"> · Net {inr(reviewTotals.net)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-6 py-2.5 text-sm border-b border-red-100 dark:border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* STEP 1 — Selection table */}
      {step === 1 && (
        <>
          {/* Tabs + search */}
          <div className="px-6 pt-4 flex flex-wrap items-center gap-4 border-b border-slate-100 dark:border-slate-800">
            <nav className="flex items-center gap-6">
              <TabBtn label="All employees" active={tab === "all"} count={employees.filter((e) => !e.isExit).length} onClick={() => setTab("all")} />
              <TabBtn label="Exit employees" active={tab === "exit"} count={summary.exitCount} onClick={() => setTab("exit")} />
              <TabBtn label="New employees" active={tab === "new"} count={summary.newCount} onClick={() => setTab("new")} />
            </nav>
            <div className="ml-auto relative pb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 -mt-1 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search and filter"
                className="pl-9 pr-3 py-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} className="w-4 h-4 rounded accent-violet-600" />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
                    Employee ID
                    {sortDir === "asc" ? <ChevronUp className="inline w-3 h-3 ml-1" /> : <ChevronDown className="inline w-3 h-3 ml-1" />}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">Employee name</th>
                  <th className="text-right px-4 py-3 font-semibold">Earnings</th>
                  <th className="text-right px-4 py-3 font-semibold">Taxes</th>
                  <th className="text-right px-4 py-3 font-semibold">Reimbursement</th>
                  <th className="text-right px-4 py-3 font-semibold">Benefits</th>
                  <th className="text-right px-4 py-3 font-semibold">Post tax deductions</th>
                  <th className="text-right px-4 py-3 font-semibold">Net pay</th>
                  <th className="text-left px-4 py-3 font-semibold">Payment method</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={10} className="py-12 text-center text-slate-400">No employees in this view.</td></tr>
                ) : pageRows.map((e) => {
                  const s = rowState[e.id];
                  const earn = earningsOf(s);
                  const change = e.prevEarnings && e.prevEarnings > 0 ? ((earn - e.prevEarnings) / e.prevEarnings) * 100 : null;
                  const isUp = change != null && change >= 0;
                  return (
                    <tr key={e.id} className={`border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${e.alreadyPaid ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={!!s.selected}
                          disabled={e.alreadyPaid}
                          onChange={(ev) => updateRow(e.id, { selected: ev.target.checked })}
                          className="w-4 h-4 rounded accent-violet-600 disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{e.employeeCode}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{e.name}</p>
                        <p className="text-[11px] text-slate-400">{e.position ?? "—"}{e.alreadyPaid && <span className="ml-2 text-amber-600">(already paid)</span>}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-violet-600 dark:text-violet-400 tabular-nums">{inr(earn)}</p>
                        {change != null ? (
                          <p className={`text-[10px] flex items-center gap-0.5 justify-end ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            change {isUp ? "+" : ""}{change.toFixed(0)}%
                          </p>
                        ) : <p className="text-[10px] text-slate-400">—</p>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <EditableAmount value={s.tax} onChange={(v) => updateRow(e.id, { tax: v })} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <EditableAmount value={s.reimbursement} onChange={(v) => updateRow(e.id, { reimbursement: v })} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <EditableAmount value={s.benefits} onChange={(v) => updateRow(e.id, { benefits: v })} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <EditableAmount value={s.postTaxDeductions} onChange={(v) => updateRow(e.id, { postTaxDeductions: v })} />
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{inr(netOf(s))}</td>
                      <td className="px-4 py-3">
                        <select
                          value={s.paymentMethod}
                          onChange={(ev) => updateRow(e.id, { paymentMethod: ev.target.value })}
                          className="text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        >
                          {Object.entries(PAYMENT_LABEL).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Showing</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-slate-500 dark:text-slate-400">of {filtered.length}</span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-md text-sm font-medium ${p === page ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && (
                <>
                  <span className="text-slate-400">…</span>
                  <button
                    onClick={() => setPage(totalPages)}
                    className={`w-8 h-8 rounded-md text-sm font-medium ${totalPages === page ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* STEP 2 — Review & confirm */}
      {step === 2 && (
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
            <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                Processing payroll for {selectedRows.length} employee{selectedRows.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                Period: {MONTHS[month - 1]} {year} · Pay Day: {new Date(payDay + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Totals grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <TotalCard label="Total Basic" value={reviewTotals.basic} />
            <TotalCard label="Allowances" value={reviewTotals.allow} />
            <TotalCard label="Reimbursement" value={reviewTotals.reimb} />
            <TotalCard label="Benefits" value={reviewTotals.benef} />
            <TotalCard label="Total Tax" value={reviewTotals.tax} color="red" />
            <TotalCard label="Other Deductions" value={reviewTotals.ded} color="red" />
            <TotalCard label="Post-tax Deductions" value={reviewTotals.postDed} color="red" />
            <TotalCard label="Net Payable" value={reviewTotals.net} color="violet" highlight />
          </div>

          {/* Per-employee summary */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Per-employee Summary</p>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
              {selectedRows.map((e) => {
                const s = rowState[e.id];
                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{e.name}</p>
                      <p className="text-[11px] text-slate-400">{e.position ?? "—"} · {PAYMENT_LABEL[s.paymentMethod]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">{inr(netOf(s))}</p>
                      <p className="text-[11px] text-slate-400">net pay</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={() => setStep(1)} className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md px-6 py-2 text-sm font-medium shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? "Processing..." : "Confirm & Process"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ num, label, active, done, onClick }: { num: number; label: string; active: boolean; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-2 text-sm">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-violet-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
        {done ? <Check className="w-3 h-3" /> : num}
      </span>
      <span className={`font-medium ${active ? "text-violet-700 dark:text-violet-400" : "text-slate-500 dark:text-slate-400"}`}>{label}</span>
    </button>
  );
}

function TabBtn({ label, active, count, onClick }: { label: string; active: boolean; count: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`pb-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${active ? "text-violet-700 dark:text-violet-400 border-violet-600" : "text-slate-500 border-transparent hover:text-slate-700"}`}>
      {label}
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>{count}</span>
    </button>
  );
}

function EditableAmount({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      className="w-24 text-right bg-transparent border border-transparent hover:border-slate-200 focus:border-violet-400 dark:hover:border-slate-700 rounded px-2 py-0.5 text-sm tabular-nums text-violet-600 dark:text-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
    />
  );
}

function TotalCard({ label, value, color = "slate", highlight }: { label: string; value: number; color?: "slate" | "red" | "violet"; highlight?: boolean }) {
  const colorClass = color === "red" ? "text-red-600 dark:text-red-400" : color === "violet" ? "text-violet-700 dark:text-violet-400" : "text-slate-800 dark:text-slate-100";
  return (
    <div className={`rounded-xl p-3 border ${highlight ? "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"}`}>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-base font-bold ${colorClass} mt-0.5 tabular-nums`}>{inr(value)}</p>
    </div>
  );
}
