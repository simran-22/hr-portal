"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, CheckCircle2, Loader2, Clock } from "lucide-react";

type Record = {
  id: string;
  check_in: string | null;
  check_out: string | null;
  hours_worked: number | null;
};

const pad = (n: number) => n.toString().padStart(2, "0");

export function CheckInCard() {
  const router = useRouter();
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/attendance/today")
      .then((r) => r.json())
      .then((d) => setRecord(d.record ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Live timer — re-renders every second when checked-in but not yet out
  useEffect(() => {
    if (!record?.check_in || record.check_out) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [record?.check_in, record?.check_out]);

  const handleAction = async (action: "check-in" | "check-out") => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/attendance/${action}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRecord(data);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Compute display timer
  let timerLabel = "00:00:00";
  let statusLabel = "Yet to check-in";
  let statusColor = "text-red-500";

  if (record?.check_in) {
    const start = new Date(record.check_in);
    const end = record.check_out ? new Date(record.check_out) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
    const hh = Math.floor(totalSecs / 3600);
    const mm = Math.floor((totalSecs % 3600) / 60);
    const ss = totalSecs % 60;
    timerLabel = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    statusLabel = record.check_out ? "Checked out" : "Checked in";
    statusColor = record.check_out ? "text-slate-500" : "text-emerald-500";
  }

  // Force re-render on tick (timer)
  void tick;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex items-center justify-center min-h-[180px]">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-center">
      <p className={`text-sm font-medium ${statusColor} mb-3`}>{statusLabel}</p>

      {/* Timer */}
      <div className="flex items-center justify-center gap-2 mb-4 font-mono">
        {timerLabel.split(":").map((part, i) => (
          <span key={i} className="text-2xl font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 tabular-nums">
            {part}
          </span>
        ))}
      </div>

      {/* Button */}
      {!record?.check_in ? (
        <button
          onClick={() => handleAction("check-in")}
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Check-in
        </button>
      ) : !record.check_out ? (
        <button
          onClick={() => handleAction("check-out")}
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Check-out
        </button>
      ) : (
        <div className="w-full inline-flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl py-2.5 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Done for today
        </div>
      )}

      {/* Sub-info */}
      {record?.check_in && (
        <p className="text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1.5">
          <Clock className="w-3 h-3" />
          Checked in at {new Date(record.check_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
