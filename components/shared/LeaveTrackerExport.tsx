"use client";

import { Download } from "lucide-react";

type Row = {
  serial: number;
  name: string;
  department: string | null;
  privilege: { accumulated: number; balance: number };
  sick: { accumulated: number; balance: number };
  casual: { accumulated: number; balance: number };
};

function fmt(n: number) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

function csvEscape(v: string) {
  if (v == null) return "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function LeaveTrackerExport({ rows, year, asOf }: { rows: Row[]; year: number; asOf: string }) {
  const handleExport = () => {
    const headers = [
      "S.No.",
      "Employee Name",
      "Department",
      "Privilege Accumulated",
      "Privilege Balance",
      "Sick Accumulated",
      "Sick Balance",
      "Casual Accumulated",
      "Casual Balance",
    ];
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.serial,
          csvEscape(r.name),
          csvEscape(r.department ?? ""),
          fmt(r.privilege.accumulated),
          fmt(r.privilege.balance),
          fmt(r.sick.accumulated),
          fmt(r.sick.balance),
          fmt(r.casual.accumulated),
          fmt(r.casual.balance),
        ].join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leave-tracker-${year}-${asOf}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="text-sm px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
