"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2, LayoutDashboard, Users, CalendarCheck, CalendarOff,
  DollarSign, TrendingUp, Briefcase, Settings, LogOut,
  CalendarDays, PartyPopper, BarChart3, FolderOpen, GitBranch,
  UserPlus, UserMinus, Banknote, Gift, Megaphone, Cake, Landmark,
  Search, Bell, Sun, Moon, Menu, ArrowRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Building2;
  iconColor?: string;
  adminOnly?: boolean;
};

type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "HRMS",
    items: [
      { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard, iconColor: "text-violet-500" },
      { label: "Employees",     href: "/employees",     icon: Users,           iconColor: "text-blue-500" },
      { label: "Departments",   href: "/departments",   icon: Building2,       iconColor: "text-emerald-500" },
      { label: "Org Chart",     href: "/org-chart",     icon: GitBranch,       iconColor: "text-cyan-500" },
      { label: "Attendance",    href: "/attendance",    icon: CalendarCheck,   iconColor: "text-teal-500" },
      { label: "Leaves",        href: "/leaves",        icon: CalendarOff,     iconColor: "text-amber-500" },
      { label: "Holidays",      href: "/holidays",      icon: CalendarDays,    iconColor: "text-orange-500" },
      { label: "Events",        href: "/events",        icon: PartyPopper,     iconColor: "text-pink-500" },
      { label: "Anniversaries", href: "/anniversaries", icon: Cake,            iconColor: "text-rose-500", adminOnly: true },
      { label: "Onboarding",    href: "/onboarding",    icon: UserPlus,        iconColor: "text-indigo-500" },
      { label: "Offboarding",   href: "/offboarding",   icon: UserMinus,       iconColor: "text-red-500" },
      { label: "Announcements", href: "/announcements", icon: Megaphone,       iconColor: "text-fuchsia-500" },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { label: "Payroll",    href: "/payroll",    icon: DollarSign, iconColor: "text-emerald-500" },
      { label: "Salary",     href: "/salary",     icon: Banknote,   iconColor: "text-green-500" },
      { label: "Incentives", href: "/incentives", icon: Gift,       iconColor: "text-pink-500" },
      { label: "PF Report",  href: "/payroll/pf", icon: Landmark,   iconColor: "text-indigo-500", adminOnly: true },
    ],
  },
  {
    label: "TALENT",
    items: [
      { label: "Performance", href: "/performance", icon: TrendingUp, iconColor: "text-purple-500" },
      { label: "Recruitment", href: "/recruitment", icon: Briefcase,  iconColor: "text-amber-600" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Reports",   href: "/reports",   icon: BarChart3,  iconColor: "text-blue-500" },
      { label: "Documents", href: "/documents", icon: FolderOpen, iconColor: "text-yellow-600" },
      { label: "Settings",  href: "/settings",  icon: Settings,   iconColor: "text-slate-500" },
    ],
  },
];

export function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [panelHidden, setPanelHidden] = useState(false);

  useEffect(() => setMounted(true), []);
  const isDark = theme === "dark";

  return (
    <div className="flex h-screen shrink-0">
      {/* Icon rail (always visible) */}
      <aside className="w-16 flex flex-col items-center py-4 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 shrink-0">
        {/* Logo */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md mb-3">
          <Building2 className="w-5 h-5 text-white" />
        </div>

        {/* Collapse toggle (top — easy to discover) */}
        <button
          type="button"
          onClick={() => setPanelHidden((v) => !v)}
          title={panelHidden ? "Show menu" : "Hide menu"}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition mb-3"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick actions */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <button
            type="button"
            title="Search"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title="Toggle theme"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {mounted ? (isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <Moon className="w-5 h-5" />}
          </button>
          <button
            type="button"
            title="Notifications"
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        {/* Bottom: settings + profile + logout */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <Link
            href="/settings"
            title="Settings"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <div className="my-1">
            <ProfileDropdown userName={userName} userRole={userRole} />
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Sign out"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </aside>

      {/* Wider nav panel */}
      {!panelHidden && (
        <aside className="w-56 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          {/* Brand */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <p className="font-bold text-base text-slate-800 dark:text-white leading-tight">HR Portal</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Management</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
            {navGroups.map((group) => {
              const items = group.items.filter((i) => !i.adminOnly || userRole === "admin");
              if (items.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] px-2 mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map(({ label, href, icon: Icon, iconColor }) => {
                      const active = pathname === href || pathname.startsWith(href + "/");
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition group relative",
                            active
                              ? "text-slate-900 dark:text-white font-semibold bg-violet-50 dark:bg-violet-500/10"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          {active ? (
                            <ArrowRight className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" strokeWidth={2.5} />
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-[10px] font-bold tracking-tighter shrink-0 w-3.5 text-center">
                              ···
                            </span>
                          )}
                          <Icon className={cn("w-4 h-4 shrink-0", active ? "text-violet-600 dark:text-violet-400" : iconColor)} />
                          <span className="truncate">{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer user info */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <Link href="/settings" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">{userName}</p>
                <p className="text-[10px] capitalize text-slate-400 dark:text-slate-500">{userRole}</p>
              </div>
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
