"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hr-portal-dashboard-widgets";
const EVENT = "hr-portal-widgets-change";

export type WidgetKey =
  | "probation"
  | "pendingTasks"
  | "upcomingHolidays"
  | "birthdays"
  | "newHires"
  | "favorites"
  | "recentLeaves"
  | "quickStats"
  | "announcements"
  | "charts";

export const WIDGET_DEFINITIONS: { key: WidgetKey; label: string }[] = [
  { key: "probation", label: "Probation Tracker" },
  { key: "pendingTasks", label: "My Pending Tasks" },
  { key: "favorites", label: "Favorites" },
  { key: "upcomingHolidays", label: "Upcoming Holidays" },
  { key: "birthdays", label: "Birthdays" },
  { key: "newHires", label: "New Hires" },
  { key: "charts", label: "Department Charts" },
  { key: "recentLeaves", label: "Recent Leave Requests" },
  { key: "quickStats", label: "Quick Stats" },
  { key: "announcements", label: "Recent Announcements" },
];

export function getWidgetVisibility(): Record<WidgetKey, boolean> {
  const defaults: Record<WidgetKey, boolean> = {
    probation: true,
    pendingTasks: true,
    upcomingHolidays: true,
    birthdays: true,
    newHires: true,
    favorites: true,
    recentLeaves: true,
    quickStats: true,
    announcements: true,
    charts: true,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function setWidgetVisibility(key: WidgetKey, visible: boolean) {
  if (typeof window === "undefined") return;
  const current = getWidgetVisibility();
  const next = { ...current, [key]: visible };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
}

export function useWidgetVisibility(): Record<WidgetKey, boolean> {
  const [vis, setVis] = useState<Record<WidgetKey, boolean>>(getWidgetVisibility);
  useEffect(() => {
    setVis(getWidgetVisibility());
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Record<WidgetKey, boolean>>).detail;
      if (detail) setVis(detail);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return vis;
}

export function DashboardWidget({ widgetKey, children }: { widgetKey: WidgetKey; children: React.ReactNode }) {
  const visibility = useWidgetVisibility();
  if (visibility[widgetKey] === false) return null;
  return <>{children}</>;
}
