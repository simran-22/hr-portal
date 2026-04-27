"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, DollarSign } from "lucide-react";

export function GeneratePayrollButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const now = new Date();
  const [form, setForm] = useState({
    employeeId: "", month: (now.getMonth() + 1).toString(), year: now.getFullYear().toString(),
    basic: "", allowances: "0", deductions: "0",
  });

  const net = Math.max(0, (Number(form.basic) || 0) + (Number(form.allowances) || 0) - (Number(form.deductions) || 0));

  useEffect(() => {
    if (open) {
      fetch("/api/employees").then((r) => r.json()).then((d) => setEmployees(d.employees ?? [])).catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId) { setError("Select an employee."); return; }
    if (!form.basic) { setError("Basic salary is required."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId,
          month: Number(form.month),
          year: Number(form.year),
          basic: Number(form.basic),
          allowances: Number(form.allowances),
          deductions: Number(form.deductions),
          net,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed."); return; }
      setForm({ employeeId: "", month: (now.getMonth() + 1).toString(), year: now.getFullYear().toString(), basic: "", allowances: "0", deductions: "0" });
      setOpen(false);
      router.refresh();
    } catch { setError("Something went wrong."); } finally { setSubmitting(false); }
  };

  const inputClass = "w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400";

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md px-4 py-1.5 text-sm font-medium shadow-sm transition-all hover:shadow-md">
        <Plus className="w-4 h-4" /> Add
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-violet-600" /><h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Generate Payroll</h3></div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Employee <span className="text-red-500">*</span></label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className={inputClass} required>
                  <option value="">Select employee</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Month</label>
                  <select value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className={inputClass}>
                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("en", { month: "long" })}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Year</label>
                  <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={inputClass}>
                    {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Basic <span className="text-red-500">*</span></label>
                  <input type="number" value={form.basic} onChange={(e) => setForm({ ...form, basic: e.target.value })} placeholder="50000" className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Allowances</label>
                  <input type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deductions</label>
                  <input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl border border-violet-100 dark:border-violet-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Net Pay</span>
                  <span className="text-lg font-bold text-violet-700 dark:text-violet-400">${net.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  {submitting ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
