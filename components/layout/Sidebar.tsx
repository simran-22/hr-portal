"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2, LayoutDashboard, Users, CalendarCheck, CalendarOff,
  DollarSign, TrendingUp, Briefcase, Settings, ChevronLeft, ChevronRight,
  LogOut, CalendarDays, PartyPopper, BarChart3, FolderOpen, GitBranch,
  UserPlus, UserMinus, Banknote, Gift, Megaphone,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "HRMS",
    items: [
      { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
      { label: "Employees",    href: "/employees",    icon: Users },
      { label: "Departments",  href: "/departments",  icon: Building2 },
      { label: "Org Chart",    href: "/org-chart",    icon: GitBranch },
      { label: "Attendance",   href: "/attendance",   icon: CalendarCheck },
      { label: "Leaves",       href: "/leaves",       icon: CalendarOff },
      { label: "Holidays",     href: "/holidays",     icon: CalendarDays },
      { label: "Events",       href: "/events",       icon: PartyPopper },
      { label: "Onboarding",   href: "/onboarding",   icon: UserPlus },
      { label: "Offboarding",  href: "/offboarding",  icon: UserMinus },
      { label: "Announcements",href: "/announcements", icon: Megaphone },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { label: "Payroll",      href: "/payroll",      icon: DollarSign },
      { label: "Salary",       href: "/salary",       icon: Banknote },
      { label: "Incentives",   href: "/incentives",   icon: Gift },
    ],
  },
  {
    label: "TALENT",
    items: [
      { label: "Performance",  href: "/performance",  icon: TrendingUp },
      { label: "Recruitment",  href: "/recruitment",  icon: Briefcase },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Reports",     href: "/reports",      icon: BarChart3 },
      { label: "Documents",   href: "/documents",    icon: FolderOpen },
      { label: "Settings",    href: "/settings",     icon: Settings },
    ],
  },
];

export function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "relative flex flex-col h-screen transition-all duration-300 shrink-0",
      "bg-white border-r border-slate-200",
      "dark:bg-slate-900 dark:border-slate-800",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-slate-200 dark:border-slate-800",
        collapsed && "justify-center px-0"
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight text-slate-800 dark:text-white">HR Portal</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Management</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-1">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link key={href} href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      active
                        ? "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-gradient-to-r dark:from-violet-600/20 dark:to-purple-600/20 dark:text-violet-400 dark:border-violet-500/20"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                      collapsed && "justify-center px-0"
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0",
                      active
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                    )} />
                    {!collapsed && <span>{label}</span>}
                    {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className={cn(
        "border-t border-slate-200 dark:border-slate-800 p-3",
        collapsed && "flex justify-center"
      )}>
        {!collapsed && (
          <a href="/settings" className="flex items-center gap-2 px-2 py-2 mb-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-slate-800 dark:text-white">{userName}</p>
              <p className="text-xs capitalize text-slate-400 dark:text-slate-500">{userRole}</p>
            </div>
          </a>
        )}
        <form action={logout}>
          <button type="submit"
            className={cn(
              "flex items-center gap-2 text-xs transition rounded-xl px-2 py-1.5 w-full",
              "text-slate-400 hover:text-red-500 hover:bg-red-50",
              "dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-slate-800",
              collapsed && "justify-center"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && "Sign out"}
          </button>
        </form>
      </div>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center transition z-10 bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
