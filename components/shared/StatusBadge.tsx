import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "active"
  | "on_leave"
  | "terminated"
  | "probation"
  | "draft"
  | "processed"
  | "paid"
  | "open"
  | "closed"
  | "archived"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "completed"
  | "full_time"
  | "part_time"
  | "contract"
  | "intern"
  | string;

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  rejected: { label: "Rejected", className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  active: { label: "Active", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  on_leave: { label: "On Leave", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  terminated: { label: "Terminated", className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" },
  probation: { label: "Probation", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  processed: { label: "Processed", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  open: { label: "Open", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  archived: { label: "Archived", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  applied: { label: "Applied", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  screening: { label: "Screening", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  interview: { label: "Interview", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  offer: { label: "Offer", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  hired: { label: "Hired", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  full_time: { label: "Full Time", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  part_time: { label: "Part Time", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  contract: { label: "Contract", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  intern: { label: "Intern", className: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
