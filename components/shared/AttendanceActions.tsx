"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogIn, LogOut, CheckCircle2, Loader2 } from "lucide-react";

interface AttendanceRecord {
  id: string;
  check_in: string | null;
  check_out: string | null;
  hours_worked: number | null;
  status: string;
}

function formatTime(datetime: string) {
  return new Date(datetime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function AttendanceActions() {
  const router = useRouter();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/attendance/today")
      .then((r) => r.json())
      .then((data) => setRecord(data.record ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (action: "check-in" | "check-out") => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/attendance/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed");
        return;
      }
      setRecord(data);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl px-4 py-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </div>
    );
  }

  const checkedIn = !!record?.check_in;
  const checkedOut = !!record?.check_out;

  return (
    <div className="flex items-center gap-3">
      {/* Status info */}
      {checkedIn && (
        <div className="hidden sm:flex items-center gap-3 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            In: <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatTime(record!.check_in!)}</span>
          </span>
          {checkedOut && (
            <>
              <span className="text-slate-500 dark:text-slate-400">
                Out: <span className="font-medium text-slate-700 dark:text-slate-300">{formatTime(record!.check_out!)}</span>
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-violet-600 dark:text-violet-400">{Number(record!.hours_worked).toFixed(1)}h</span>
              </span>
            </>
          )}
        </div>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}

      {/* Action button */}
      {!checkedIn ? (
        <button
          onClick={() => handleAction("check-in")}
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Check In
        </button>
      ) : !checkedOut ? (
        <button
          onClick={() => handleAction("check-out")}
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Check Out
        </button>
      ) : (
        <span className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl px-4 py-2 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Done for today
        </span>
      )}
    </div>
  );
}
