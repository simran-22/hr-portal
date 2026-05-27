"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Building2, LayoutDashboard, Users, CalendarCheck, CalendarOff,
  DollarSign, TrendingUp, Briefcase, Settings, LogOut,
  CalendarDays, PartyPopper, BarChart3, FolderOpen, GitBranch,
  UserPlus, UserMinus, Banknote, Gift, Megaphone, Cake, Landmark,
  Sun, Moon, X, UsersRound, Wallet, Trophy, Cog, ClipboardList,
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

type Category = {
  key: string;
  label: string;
  icon: typeof Building2;
  items: NavItem[];
};

const CATEGORIES: Category[] = [
  {
    key: "hrms",
    label: "HRMS",
    icon: UsersRound,
    items: [
      { label: "Employees",     href: "/employees",     icon: Users },
      { label: "Departments",   href: "/departments",   icon: Building2 },
      { label: "Org Chart",     href: "/org-chart",     icon: GitBranch },
      { label: "Attendance",    href: "/attendance",    icon: CalendarCheck },
      { label: "Leaves",        href: "/leaves",        icon: CalendarOff },
      { label: "HR Reports",    href: "/attendance/grid", icon: ClipboardList, adminOnly: true },
      { label: "Holidays",      href: "/holidays",      icon: CalendarDays },
      { label: "Events",        href: "/events",        icon: PartyPopper },
      { label: "Anniversaries", href: "/anniversaries", icon: Cake, adminOnly: true },
      { label: "Onboarding",    href: "/onboarding",    icon: UserPlus },
      { label: "Offboarding",   href: "/offboarding",   icon: UserMinus },
      { label: "Announcements", href: "/announcements", icon: Megaphone },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    icon: Wallet,
    items: [
      { label: "Payroll",    href: "/payroll",    icon: DollarSign },
      { label: "Salary",     href: "/salary",     icon: Banknote },
      { label: "Incentives", href: "/incentives", icon: Gift },
      { label: "PF Report",  href: "/payroll/pf", icon: Landmark, adminOnly: true },
    ],
  },
  {
    key: "talent",
    label: "Talent",
    icon: Trophy,
    items: [
      { label: "Performance", href: "/performance", icon: TrendingUp },
      { label: "Recruitment", href: "/recruitment", icon: Briefcase },
    ],
  },
  {
    key: "system",
    label: "System",
    icon: Cog,
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
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  const isDark = theme === "dark";

  // Close flyout on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        // Don't close if clicking a category button itself (the button toggles)
        if (target.closest("[data-category-button]")) return;
        setOpenCategory(null);
      }
    };
    if (openCategory) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openCategory]);

  // Close flyout when navigating
  useEffect(() => {
    setOpenCategory(null);
  }, [pathname]);

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

  // Check if any item under a category is active
  const isCategoryActive = (cat: Category) =>
    cat.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  const activeCategoryItems = openCategory
    ? CATEGORIES.find((c) => c.key === openCategory)?.items.filter((i) => !i.adminOnly || userRole === "admin") ?? []
    : [];
  const openCat = CATEGORIES.find((c) => c.key === openCategory);

  // Total pending count for a category (for category badge)
  const categoryBadge = (cat: Category): number | undefined => {
    if (cat.key === "hrms" && pendingLeaveCount > 0) return pendingLeaveCount;
    return undefined;
  };

  return (
    <>
      <aside className="w-[88px] h-screen flex flex-col bg-slate-900 dark:bg-slate-950 border-r border-slate-800 shrink-0 z-30 relative">
        {/* Logo */}
        <div className="px-3 pt-4 pb-3 flex justify-center">
          <Link
            href="/dashboard"
            onClick={() => setOpenCategory(null)}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md hover:scale-105 transition"
          >
            <Building2 className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Home (always direct) */}
        <div className="px-2">
          <RailItem
            label="Home"
            icon={LayoutDashboard}
            active={pathname === "/dashboard" || pathname.startsWith("/dashboard/")}
            href="/dashboard"
            onNavigate={() => setOpenCategory(null)}
          />
        </div>

        <div className="h-px bg-slate-800 my-2 mx-3" />

        {/* Categories */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2 sidebar-scroll space-y-1">
          {CATEGORIES.map((cat) => {
            const visibleItems = cat.items.filter((i) => !i.adminOnly || userRole === "admin");
            if (visibleItems.length === 0) return null;
            const active = isCategoryActive(cat) || openCategory === cat.key;
            const badge = categoryBadge(cat);

            return (
              <button
                key={cat.key}
                type="button"
                data-category-button
                onClick={() => setOpenCategory(openCategory === cat.key ? null : cat.key)}
                className={cn(
                  "w-full flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-[10px] transition relative",
                  active
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center relative">
                  <cat.icon className="w-[18px] h-[18px]" />
                  {badge && badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-slate-900">
                      {badge}
                    </span>
                  )}
                </div>
                <span className={cn("font-medium leading-tight text-center", active && "font-semibold")}>
                  {cat.label}
                </span>
              </button>
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

      {/* Category flyout */}
      {openCategory && openCat && activeCategoryItems.length > 0 && (
        <aside
          ref={flyoutRef}
          className="fixed left-[88px] top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-40 flex flex-col animate-in slide-in-from-left duration-150"
        >
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                <openCat.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{openCat.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {activeCategoryItems.length} module{activeCategoryItems.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpenCategory(null)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {activeCategoryItems.map(({ label, href, icon: Icon }) => {
              const itemActive = pathname === href || pathname.startsWith(href + "/");
              const showBadge = href === "/leaves" && pendingLeaveCount > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpenCategory(null)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition mb-0.5",
                    itemActive
                      ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", itemActive ? "text-violet-600 dark:text-violet-400" : "text-slate-400")} />
                  <span className="flex-1 truncate">{label}</span>
                  {showBadge && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {pendingLeaveCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </aside>
      )}
    </>
  );
}

function RailItem({
  label,
  icon: Icon,
  href,
  active,
  onNavigate,
}: {
  label: string;
  icon: typeof Building2;
  href: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "w-full flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-[10px] transition relative",
        active
          ? "bg-violet-600 text-white shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center">
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <span className={cn("font-medium leading-tight text-center", active && "font-semibold")}>
        {label}
      </span>
    </Link>
  );
}
