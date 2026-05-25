"use client";

import { useEffect, useState } from "react";
import { getStoredCurrency, setStoredCurrency } from "@/components/shared/Money";

type Currency = "INR" | "USD";

export function CurrencyToggle() {
  const [currency, setCurrency] = useState<Currency>("INR");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCurrency(getStoredCurrency());
    setMounted(true);
  }, []);

  const change = (c: Currency) => {
    setCurrency(c);
    setStoredCurrency(c);
  };

  const opts: Currency[] = ["INR", "USD"];

  return (
    <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
      {opts.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => change(c)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-md transition ${
            mounted && currency === c
              ? "bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-400 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {c === "INR" ? "₹ INR" : "$ USD"}
        </button>
      ))}
    </div>
  );
}
