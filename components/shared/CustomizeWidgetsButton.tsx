"use client";

import { useState } from "react";
import { Settings2, X, GripVertical } from "lucide-react";
import {
  WIDGET_DEFINITIONS,
  useWidgetVisibility,
  setWidgetVisibility,
  type WidgetKey,
} from "@/components/shared/DashboardWidget";

export function CustomizeWidgetsButton() {
  const [open, setOpen] = useState(false);
  const visibility = useWidgetVisibility();

  const toggle = (key: WidgetKey) => {
    setWidgetVisibility(key, !visibility[key]);
  };

  const visibleCount = WIDGET_DEFINITIONS.filter((w) => visibility[w.key]).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm font-medium shadow-sm transition"
        title="Customize widgets"
      >
        <Settings2 className="w-4 h-4" />
        Customize
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
          />

          {/* Side panel */}
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Customize widgets</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {visibleCount} of {WIDGET_DEFINITIONS.length} visible
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {WIDGET_DEFINITIONS.map(({ key, label }) => {
                const enabled = visibility[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{label}</span>
                    </div>
                    {/* Toggle switch */}
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors border ${
                        enabled
                          ? "bg-violet-600 border-violet-700 shadow-inner"
                          : "bg-slate-300 dark:bg-slate-600 border-slate-400 dark:border-slate-500"
                      }`}
                      aria-checked={enabled}
                      role="switch"
                      title={enabled ? "Click to hide" : "Click to show"}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform mt-0.5 ${
                          enabled ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                      {/* On/Off label inside */}
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 text-[8px] font-bold uppercase ${
                          enabled
                            ? "left-1.5 text-white"
                            : "right-1.5 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {enabled ? "On" : "Off"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              Changes save automatically to this browser.
            </div>
          </div>
        </>
      )}
    </>
  );
}
