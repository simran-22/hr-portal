"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";

interface Employee {
  id: string;
  name: string;
}

export function AddSalaryButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [basic, setBasic] = useState("");
  const [hra, setHra] = useState("");
  const [da, setDa] = useState("");
  const [conveyance, setConveyance] = useState("");
  const [medical, setMedical] = useState("");
  const [otherAllowances, setOtherAllowances] = useState("");
  const [pfDeduction, setPfDeduction] = useState("");
  const [taxDeduction, setTaxDeduction] = useState("");
  const [otherDeductions, setOtherDeductions] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/employees?limit=500")
        .then((r) => r.json())
        .then((d) => setEmployees(d.employees ?? []));
    }
  }, [open]);

  const gross = useMemo(
    () =>
      (Number(basic) || 0) + (Number(hra) || 0) + (Number(da) || 0) +
      (Number(conveyance) || 0) + (Number(medical) || 0) + (Number(otherAllowances) || 0),
    [basic, hra, da, conveyance, medical, otherAllowances]
  );

  const net = useMemo(
    () => gross - (Number(pfDeduction) || 0) - (Number(taxDeduction) || 0) - (Number(otherDeductions) || 0),
    [gross, pfDeduction, taxDeduction, otherDeductions]
  );

  const resetForm = () => {
    setEmployeeId(""); setBasic(""); setHra(""); setDa("");
    setConveyance(""); setMedical(""); setOtherAllowances("");
    setPfDeduction(""); setTaxDeduction(""); setOtherDeductions("");
    setEffectiveDate(""); setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) { setError("Employee is required."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId, basic, hra, da, conveyance, medical,
          other_allowances: otherAllowances, pf_deduction: pfDeduction,
          tax_deduction: taxDeduction, other_deductions: otherDeductions,
          effective_date: effectiveDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create salary structure.");
        return;
      }
      resetForm();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md"
      >
        <Plus className="w-4 h-4" />
        Add Salary Structure
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Add Salary Structure
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-500/20">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputClass} required>
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-2">Earnings</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Basic", value: basic, setter: setBasic },
                  { label: "HRA", value: hra, setter: setHra },
                  { label: "DA", value: da, setter: setDa },
                  { label: "Conveyance", value: conveyance, setter: setConveyance },
                  { label: "Medical", value: medical, setter: setMedical },
                  { label: "Other Allowances", value: otherAllowances, setter: setOtherAllowances },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
                    <input type="number" min="0" step="0.01" value={value} onChange={(e) => setter(e.target.value)} placeholder="0" className={inputClass} />
                  </div>
                ))}
              </div>

              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pt-2">Deductions</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "PF Deduction", value: pfDeduction, setter: setPfDeduction },
                  { label: "Tax Deduction", value: taxDeduction, setter: setTaxDeduction },
                  { label: "Other Deductions", value: otherDeductions, setter: setOtherDeductions },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
                    <input type="number" min="0" step="0.01" value={value} onChange={(e) => setter(e.target.value)} placeholder="0" className={inputClass} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Gross</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">${gross.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-600 dark:text-red-400">Deductions</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">
                    ${((Number(pfDeduction) || 0) + (Number(taxDeduction) || 0) + (Number(otherDeductions) || 0)).toLocaleString()}
                  </p>
                </div>
                <div className="bg-violet-50 dark:bg-violet-500/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-violet-600 dark:text-violet-400">Net</p>
                  <p className="text-lg font-bold text-violet-700 dark:text-violet-300">${net.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Effective Date</label>
                <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputClass} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
