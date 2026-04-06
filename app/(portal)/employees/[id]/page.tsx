"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Mail,
  Phone,
  Building2,
  Briefcase,
  CalendarDays,
  DollarSign,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  department_id: string | null;
  salary: number;
  status: string;
  hire_date: string | null;
  departments: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  on_leave: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  terminated: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  probation: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
};

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    position: "",
    departmentId: "",
    salary: "",
    status: "active",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/employees/${id}`).then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ]).then(([emp, depts]) => {
      if (emp.error) {
        setError(emp.error);
        setLoading(false);
        return;
      }
      setEmployee(emp);
      setForm({
        name: emp.name ?? "",
        phone: emp.phone ?? "",
        position: emp.position ?? "",
        departmentId: emp.department_id ?? "",
        salary: emp.salary?.toString() ?? "",
        status: emp.status ?? "active",
      });
      setDepartments(depts.departments ?? depts ?? []);
      setLoading(false);
    });
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update.");
        return;
      }
      const updated = await res.json();
      setEmployee((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this employee? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete.");
        setDeleting(false);
        return;
      }
      router.push("/employees");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setDeleting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400";

  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Employee not found
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{error}</p>
        <a
          href="/employees"
          className="inline-flex items-center gap-2 mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to employees
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/employees"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {getInitials(employee.name)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {employee.name}
              </h2>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize mt-0.5 inline-block ${statusColors[employee.status] ?? "bg-slate-100 text-slate-600"}`}
              >
                {employee.status?.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl border border-red-100 dark:border-red-500/20">
          {error}
        </div>
      )}

      {editing ? (
        /* Edit Form */
        <form onSubmit={handleSave}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Position</label>
                <input name="position" value={form.position} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <select name="departmentId" value={form.departmentId} onChange={handleChange} className={inputClass}>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Salary</label>
                <input name="salary" type="number" value={form.salary} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="on_leave">On Leave</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {employee.email || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {employee.phone || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Position</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {employee.position || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {employee.departments?.name || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Salary</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {employee.salary ? `$${employee.salary.toLocaleString()}` : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Hire Date</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {employee.hire_date
                    ? new Date(employee.hire_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
