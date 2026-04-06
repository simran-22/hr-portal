"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Briefcase, Pencil, Trash2, X, Loader2, Save } from "lucide-react";

interface DepartmentCardProps {
  department: { id: string; name: string; description: string | null };
  employeeCount: number;
  gradient: string;
  canManage: boolean;
}

export function DepartmentCard({ department, employeeCount, gradient, canManage }: DepartmentCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(department.name);
  const [description, setDescription] = useState(department.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/departments/${department.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${department.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/departments/${department.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete.");
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setDeleting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400";

  if (editing) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-violet-200 dark:border-violet-500/30 shadow-sm p-6">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Edit Department</h4>
            <button type="button" onClick={() => { setEditing(false); setName(department.name); setDescription(department.description ?? ""); setError(""); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass + " resize-none"} />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => { setEditing(false); setName(department.name); setDescription(department.description ?? ""); setError(""); }}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm disabled:opacity-50">
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-6 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-1">
          {canManage && (
            <>
              <button onClick={() => setEditing(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
            Active
          </span>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-lg mb-3">
          {error}
        </div>
      )}
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{department.name}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4 line-clamp-2">
        {department.description ?? "No description provided."}
      </p>
      <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Users className="w-4 h-4" />
          <span>{employeeCount} employee{employeeCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Briefcase className="w-4 h-4" />
          <span>0 open roles</span>
        </div>
      </div>
    </div>
  );
}
