"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Thermometer } from "lucide-react";

interface Balance {
  annual_total: number;
  annual_used: number;
  sick_total: number;
  sick_used: number;
}

export function LeaveBalanceCard() {
  const [balance, setBalance] = useState<Balance | null>(null);

  useEffect(() => {
    fetch("/api/leaves/balance")
      .then((r) => r.json())
      .then((data) => { if (!data.error) setBalance(data); })
      .catch(() => {});
  }, []);

  if (!balance) return null;

  const items = [
    { label: "Annual", used: balance.annual_used, total: balance.annual_total, color: "bg-violet-500", bg: "bg-violet-100 dark:bg-violet-500/20", icon: CalendarDays },
    { label: "Sick", used: balance.sick_used, total: balance.sick_total, color: "bg-amber-500", bg: "bg-amber-100 dark:bg-amber-500/20", icon: Thermometer },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(({ label, used, total, color, bg, icon: Icon }) => {
        const remaining = total - used;
        const pct = total > 0 ? (used / total) * 100 : 0;
        return (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${label === "Annual" ? "text-violet-600 dark:text-violet-400" : "text-amber-600 dark:text-amber-400"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label} Leave</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{remaining} remaining of {total}</p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{used} used</p>
          </div>
        );
      })}
    </div>
  );
}
