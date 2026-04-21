"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

export default function AddEmployeePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    departmentId: "",
    salary: "",
    status: "active",
    hireDate: "",
    dateOfBirth: "",
    probationEndDate: "",
    basicSalary: "",
    uan: "",
    pfNumber: "",
    pfApplicable: true,
  });

  const setBasicFromSalary = (percent: number) => {
    const s = Number(form.salary);
    if (!s) return;
    setForm((prev) => ({ ...prev, basicSalary: Math.round(s * percent / 100).toString() }));
  };

  const addMonths = (dateStr: string, months: number): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  };

  const setProbationFromHireDate = (months: number) => {
    if (!form.hireDate) return;
    setForm((prev) => ({ ...prev, probationEndDate: addMonths(prev.hireDate, months) }));
  };

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments ?? data ?? []))
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add employee.");
        return;
      }

      router.push("/employees");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400";

  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a
          href="/employees"
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </a>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Add Employee</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Fill in the details to create a new employee record
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-500/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@company.com"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Position</label>
              <input
                name="position"
                value={form.position}
                onChange={handleChange}
                placeholder="Software Engineer"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Salary</label>
              <input
                name="salary"
                type="number"
                value={form.salary}
                onChange={handleChange}
                placeholder="50000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Date of Joining</label>
              <input
                name="hireDate"
                type="date"
                value={form.hireDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            {form.status === "probation" && (
              <div className="sm:col-span-2">
                <label className={labelClass}>Probation End Date</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    name="probationEndDate"
                    type="date"
                    value={form.probationEndDate}
                    onChange={handleChange}
                    className={inputClass + " sm:flex-1"}
                  />
                  <button
                    type="button"
                    onClick={() => setProbationFromHireDate(3)}
                    disabled={!form.hireDate}
                    className="px-3 py-2 text-xs font-medium rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    + 3 months
                  </button>
                  <button
                    type="button"
                    onClick={() => setProbationFromHireDate(6)}
                    disabled={!form.hireDate}
                    className="px-3 py-2 text-xs font-medium rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    + 6 months
                  </button>
                </div>
                {!form.hireDate && (
                  <p className="text-xs text-slate-400 mt-1.5">Set Date of Joining first to use quick buttons</p>
                )}
              </div>
            )}
          </div>

          {/* PF Details section */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">PF Details</h3>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pfApplicable}
                  onChange={(e) => setForm((prev) => ({ ...prev, pfApplicable: e.target.checked }))}
                  className="w-4 h-4 rounded accent-violet-600"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">PF Applicable</span>
              </label>
            </div>

            {form.pfApplicable && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Basic Salary (monthly)</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      name="basicSalary"
                      type="number"
                      value={form.basicSalary}
                      onChange={handleChange}
                      placeholder="e.g. 25000"
                      className={inputClass + " sm:flex-1"}
                    />
                    <button
                      type="button"
                      onClick={() => setBasicFromSalary(50)}
                      disabled={!form.salary}
                      className="px-3 py-2 text-xs font-medium rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      50% of salary
                    </button>
                    <button
                      type="button"
                      onClick={() => setBasicFromSalary(40)}
                      disabled={!form.salary}
                      className="px-3 py-2 text-xs font-medium rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      40% of salary
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    PF is calculated on basic salary. 2026 Labour Code requires basic ≥ 50% of CTC.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>UAN (12-digit)</label>
                  <input
                    name="uan"
                    value={form.uan}
                    onChange={handleChange}
                    placeholder="101234567890"
                    maxLength={12}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>PF Account Number</label>
                  <input
                    name="pfNumber"
                    value={form.pfNumber}
                    onChange={handleChange}
                    placeholder="e.g. DL/CPM/12345/000"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <a
            href="/employees"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {submitting ? "Saving..." : "Save Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
