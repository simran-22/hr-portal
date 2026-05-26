"use client";

import { useEffect, useState } from "react";
import { Link2, Plus, X, Loader2, ExternalLink } from "lucide-react";

type QuickLink = {
  id: string;
  label: string;
  url: string;
};

export function QuickLinksWidget() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "", url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/quick-links")
      .then((r) => r.json())
      .then((d) => setLinks(d.links ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.url.trim()) {
      setError("Both fields are required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/quick-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add."); return; }
      setLinks((prev) => [data, ...prev]);
      setForm({ label: "", url: "" });
      setAdding(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await fetch(`/api/quick-links/${id}`, { method: "DELETE" });
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setRemovingId(null);
    }
  };

  const hostName = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Quick Links</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition"
          title={adding ? "Cancel" : "Add link"}
        >
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Label (e.g. Company Wiki)"
            className="w-full text-sm px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="URL (e.g. https://wiki.company.com)"
            className="w-full text-sm px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add link
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        </div>
      ) : links.length === 0 && !adding ? (
        <div className="py-10 text-center text-sm text-slate-400">
          <Link2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          No quick links yet.
          <p className="text-xs mt-1">Click <strong>+</strong> above to add a shortcut URL.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {links.map((l) => (
            <div key={l.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition group">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{l.label}</p>
                  <p className="text-xs text-slate-400 truncate">{hostName(l.url)}</p>
                </div>
              </a>
              <button
                onClick={() => handleRemove(l.id)}
                disabled={removingId === l.id}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                {removingId === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
