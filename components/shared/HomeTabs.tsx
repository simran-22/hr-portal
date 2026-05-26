"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BarChart3, Calendar, Users } from "lucide-react";

const TABS = [
  { label: "Overview",   href: "/overview",   icon: BarChart3 },
  { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard },
  { label: "Calendar",   href: "/calendar",   icon: Calendar },
  { label: "Delegation", href: "/delegation", icon: Users },
];

export function HomeTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 -mt-2 mb-2">
      <div className="flex items-center gap-6 overflow-x-auto">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                active
                  ? "text-violet-700 dark:text-violet-400 border-violet-600 dark:border-violet-400"
                  : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
