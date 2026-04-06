"use client";

import { useRouter } from "next/navigation";
import { Trash2, Megaphone, Building2 } from "lucide-react";
import { useState } from "react";

interface AnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    scope: string;
    published_at: string;
    expires_at: string | null;
    departments?: { name: string } | null;
  };
  canManage: boolean;
}

export function AnnouncementCard({ announcement, canManage }: AnnouncementCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/announcements/${announcement.id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{announcement.title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{announcement.content}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {new Date(announcement.published_at).toLocaleDateString()}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  announcement.scope === "company"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                }`}
              >
                {announcement.scope === "company" ? "Company" : announcement.departments?.name ?? "Department"}
              </span>
              {announcement.expires_at && (
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  Expires {new Date(announcement.expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        {canManage && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
