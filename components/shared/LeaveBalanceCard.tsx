"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Thermometer, Coffee, Loader2 } from "lucide-react";

type Bucket = {
  total: number;
  accumulated: number;
  used: number;
  balance: number;
};

type Balance = {
  privilege: Bucket;
  sick: Bucket;
  casual: Bucket;
  monthsElapsed?: number;
  asOf?: string;
  note?: string;
};

const fmt = (n: number) =>
  Number.isInteger(n) ? n.toString() : n.toFixed(2);

export function LeaveBalanceCard() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaves/balance")
      .then((r) => r.json())
      .then((data) => { if (!data.error) setBalance(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
      </div>
    );
  }
  if (!balance) return null;

  const cards = [
    {
      key: "privilege" as const,
      label: "Privilege Leave",
      sub: "Annual / Earned Leave",
      icon: CalendarDays,
      gradient: "from-violet-500 to-purple-600",
      bg: "bg-violet-50 dark:bg-violet-500/10",
      text: "text-violet-700 dark:text-violet-400",
      data: balance.privilege,
    },
    {
      key: "sick" as const,
      label: "Sick Leave",
      sub: "For illness",
      icon: Thermometer,
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
      data: balance.sick,
    },
    {
      key: "casual" as const,
      label: "Casual Leave",
      sub: "Personal / Short notice",
      icon: Coffee,
      gradient: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      data: balance.casual,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(({ key, label, sub, icon: Icon, gradient, bg, text, data }) => {
          const usedPct = data.accumulated > 0 ? (data.used / data.accumulated) * 100 : 0;
          const negativeBalance = data.balance < 0;
          return (
            <div
              key={key}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{label}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${bg} ${text}`}>
                  {data.total}/yr
                </span>
              </div>

              {/* Numbers grid */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
                <div className="p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Accumulated</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums mt-0.5">{fmt(data.accumulated)}</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Used</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums mt-0.5">{fmt(data.used)}</p>
                </div>
                <div className={`p-3 text-center ${negativeBalance ? "bg-red-50 dark:bg-red-500/10" : bg}`}>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${negativeBalance ? "text-red-600" : text}`}>Balance</p>
                  <p className={`text-lg font-bold tabular-nums mt-0.5 ${negativeBalance ? "text-red-700" : text}`}>{fmt(data.balance)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-4 pb-3 pt-1">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all`}
                    style={{ width: `${Math.min(100, usedPct)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-center">
                  {fmt(data.used)} of {fmt(data.accumulated)} accumulated used
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* As-of note */}
      {(balance.asOf || balance.note) && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-right">
          {balance.note
            ? balance.note
            : `As of ${balance.asOf} · accrued over ${balance.monthsElapsed ?? 0} month${balance.monthsElapsed === 1 ? "" : "s"} this year`}
        </p>
      )}
    </div>
  );
}
