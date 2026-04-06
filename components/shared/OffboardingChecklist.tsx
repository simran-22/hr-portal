"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

type Separation = {
  id: string;
  exit_interview_done: boolean;
  assets_returned: boolean;
  access_revoked: boolean;
  status: string;
  notes: string | null;
};

type Props = {
  separation: Separation;
};

const CHECKLIST_ITEMS = [
  { key: "exit_interview_done", label: "Exit Interview Completed" },
  { key: "assets_returned", label: "Company Assets Returned" },
  { key: "access_revoked", label: "System Access Revoked" },
] as const;

export function OffboardingChecklist({ separation }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);

  const toggleField = async (field: string, currentValue: boolean) => {
    setLoading(field);
    try {
      await fetch(`/api/separations/${separation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  const markComplete = async () => {
    setMarkingComplete(true);
    try {
      await fetch(`/api/separations/${separation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setMarkingComplete(false);
    }
  };

  const allDone = separation.exit_interview_done && separation.assets_returned && separation.access_revoked;

  return (
    <div className="mt-3 space-y-2">
      {CHECKLIST_ITEMS.map(({ key, label }) => {
        const value = separation[key];
        return (
          <div
            key={key}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
          >
            <button
              onClick={() => toggleField(key, value)}
              disabled={loading === key || separation.status === "completed"}
              className="flex-shrink-0"
            >
              {loading === key ? (
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              ) : value ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-violet-400 transition-colors" />
              )}
            </button>
            <span className={`text-sm ${value ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-700 dark:text-slate-300"}`}>
              {label}
            </span>
          </div>
        );
      })}
      {separation.status !== "completed" && (
        <button
          onClick={markComplete}
          disabled={!allDone || markingComplete}
          className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {markingComplete ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          {markingComplete ? "Completing..." : "Mark Complete"}
        </button>
      )}
    </div>
  );
}
