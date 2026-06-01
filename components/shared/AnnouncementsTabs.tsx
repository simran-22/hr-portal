"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/events",        label: "Events",        icon: PartyPopper },
];

export function AnnouncementsTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 -mb-px transition",
              active
                ? "border-violet-600 text-violet-700 dark:text-violet-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
