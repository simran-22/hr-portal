"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2, LayoutDashboard, Users, CalendarCheck, CalendarOff,
  DollarSign, TrendingUp, Briefcase, Settings, ChevronLeft, ChevronRight, LogOut
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",   href: "/dashboard",           icon: LayoutDashboard },
  { label: "Employees",   href: "/employees",           icon: Users },
  { label: "Attendance",  href: "/attendance",          icon: CalendarCheck },
  { label: "Leaves",      href: "/leaves",              icon: CalendarOff },
  { label: "Payroll",     href: "/payroll",             icon: DollarSign },
  { label: "Performance", href: "/performance",         icon: TrendingUp },
  { label: "Recruitment", href: "/recruitment",         icon: Briefcase },
  { label: "Settings",    href: "/settings",            icon: Settings },
];

export function Sidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "relative flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-slate-800", collapsed && "justify-center px-0")}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">HR Portal</p>
            <p className="text-slate-500 text-xs">Management</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-violet-400 border border-violet-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("w-5 h-5 shrink-0", active ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300")} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className={cn("border-t border-slate-800 p-3", collapsed && "flex justify-center")}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{userName}</p>
              <p className="text-slate-500 text-xs capitalize">{userRole}</p>
            </div>
          </div>
        )}
        <form action={logout}>
          <button type="submit"
            className={cn(
              "flex items-center gap-2 text-slate-500 hover:text-red-400 text-xs transition rounded-xl hover:bg-slate-800 px-2 py-1.5 w-full",
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
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
