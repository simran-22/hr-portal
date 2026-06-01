"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/incentives", label: "Bonuses", icon: Gift },
  { href: "/incentives/morning-shift", label: "Morning Shift", icon: Sunrise },
];

export function IncentiveTabs() {
  const pathname = usePathname();
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              active
                ? "border-violet-500 text-violet-700 dark:text-violet-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
