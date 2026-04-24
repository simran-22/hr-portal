"use client";
import { Search } from "lucide-react";

export function Topbar({ title }: { title: string; userName?: string; userRole?: string }) {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Search..."
          className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 w-64"
        />
      </div>
    </header>
  );
}
