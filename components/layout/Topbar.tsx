"use client";
import { Bell, Search, Sun, Moon } from "lucide-react";
import { useState } from "react";

export function Topbar({ title, userName }: { title: string; userName: string }) {
  const [dark, setDark] = useState(false);
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search..." className="pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 w-52" />
        </div>
        <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="relative w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
