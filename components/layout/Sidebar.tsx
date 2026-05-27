"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2, LayoutDashboard, Users, CalendarCheck, CalendarOff,
  DollarSign, TrendingUp, Briefcase, Settings, LogOut,
  CalendarDays, PartyPopper, BarChart3, FolderOpen, GitBranch,
  UserPlus, UserMinus, Banknote, Gift, Megaphone, Cake, Landmark,
  Sun, Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Building2;
  adminOnly?: boolean;
};

type NavGroup = { items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Home",          href: "/dashboard",     icon: LayoutDashboard },
      { label: "Employees",     href: "/employees",     icon: Users },
      { label: "Departments",   href: "/departments",   icon: Building2 },
      { label: "Org Chart",     href: "/org-chart",     icon: GitBranch },
      { label: "Attendance",    href: "/attendance",    icon: CalendarCheck },
      { label: "Leaves",        href: "/leaves",        icon: CalendarOff },
      { label: "Holidays",      href: "/holidays",      icon: CalendarDays },
      { label: "Events",        href: "/events",        icon: PartyPopper },
      { label: "Birthdays",     href: "/anniversaries", icon: Cake, adminOnly: true },
      { label: "Onboarding",    href: "/onboarding",    icon: UserPlus },
      { label: "Offboarding",   href: "/offboarding",   icon: UserMinus },
      { label: "Announce",      href: "/announcements", icon: Megaphone },
    ],
  },
  {
    items: [
      { label: "Payroll",    href: "/payroll",    icon: DollarSign },
      { label: "Salary",     href: "/salary",     icon: Banknote },
      { label: "Incentives", href: "/incentives", icon: Gift },
      { label: "PF Report",  href: "/payroll/pf", icon: Landmark, adminOnly: true },
    ],
  },
  {
    items: [
      { label: "Performance", href: "/performance", icon: TrendingUp },
      { label: "Recruitment", href: "/recruitment", icon: Briefcase },
    ],
  },
  {
    items: [
      { label: "Reports",   href: "/reports",   icon: BarChart3 },
      { label: "Documents", href: "/documents", icon: FolderOpen },
      { label: "Settings",  href: "/settings",  icon: Settings },
    ],
  },
];

export function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = theme === "dark";

  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const fetchCount = () => {
      fetch("/api/leaves/pending-count")
        .then((r) => r.json())
        .then((d) => { if (alive) setPendingLeaveCount(d.count ?? 0); })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  return (
    <aside className="w-[88px] h-screen flex flex-col bg-slate-900 dark:bg-slate-950 border-r border-slate-800 shrink-0">
      {/* Logo */}
      <div className="px-3 pt-4 pb-3 flex justify-center">
        <Link href="/dashboard" className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md hover:scale-105 transition">
          <Building2 className="w-5 h-5 text-white" />
        </Link>
      </div>

      {/* Nav — single scrollable rail with group dividers */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 sidebar-scroll">
        {NAV_GROUPS.map((group, gi) => {
          const items = group.items.filter((i) => !i.adminOnly || userRole === "admin");
          if (items.length === 0) return null;
          return (
            <div key={gi}>
              {gi > 0 && <div className="h-px bg-slate-800 my-2 mx-2" />}
              <div className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const showBadge = item.href === "/leaves" && pendingLeaveCount > 0;
                  return (
                    <RailItem
                      key={item.href}
                      item={item}
                      active={active}
                      badge={showBadge ? pendingLeaveCount : undefined}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom utilities */}
      <div className="px-2 py-2 border-t border-slate-800 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title="Toggle theme"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {mounted ? (isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Moon className="w-4 h-4" />}
        </button>
        <ProfileDropdown userName={userName} userRole={userRole} />
        <form action={logout}>
          <button
            type="submit"
            title="Sign out"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}

function RailItem({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "w-full flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-[10px] transition relative group",
        active
          ? "bg-violet-600 text-white shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center relative">
        <Icon className="w-[18px] h-[18px]" />
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-slate-900">
            {badge}
          </span>
        )}
      </div>
      <span className={cn("font-medium leading-tight text-center truncate w-full px-0.5", active && "font-semibold")}>
        {item.label}
      </span>
    </Link>
  );
}
