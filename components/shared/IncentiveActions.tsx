"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, Banknote, Loader2 } from "lucide-react";

interface IncentiveActionsProps {
  id: string;
  status: string;
}

export function IncentiveActions({ id, status }: IncentiveActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      await fetch(`/api/incentives/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
  }

  return (
    <div className="flex items-center gap-1">
      {status === "pending" && (
        <button
          onClick={() => updateStatus("approved")}
          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Approve
        </button>
      )}
      {status === "approved" && (
        <button
          onClick={() => updateStatus("paid")}
          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20 transition-colors"
        >
          <Banknote className="w-3.5 h-3.5" />
          Mark Paid
        </button>
      )}
      {status === "paid" && (
        <span className="text-xs text-slate-400 dark:text-slate-500">Completed</span>
      )}
    </div>
  );
}
