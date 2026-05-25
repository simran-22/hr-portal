"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Printer, Trash2, Loader2 } from "lucide-react";

export function PayrollRowActions({
  id,
  email,
  canDelete,
}: {
  id: string;
  email: string | null;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this payroll record? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {email && (
        <a
          href={`mailto:${email}?subject=Payslip`}
          title="Email payslip"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition"
        >
          <Mail className="w-4 h-4" />
        </a>
      )}
      <a
        href={`/payroll/${id}/payslip`}
        target="_blank"
        rel="noopener noreferrer"
        title="View / Print Payslip"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition"
      >
        <Printer className="w-4 h-4" />
      </a>
      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
