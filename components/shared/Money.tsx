"use client";

import { useEffect, useState } from "react";

type Currency = "INR" | "USD";

const STORAGE_KEY = "hr-portal-currency";
const EVENT_NAME = "hr-portal-currency-change";

export function getStoredCurrency(): Currency {
  if (typeof window === "undefined") return "INR";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "USD" ? "USD" : "INR";
}

export function setStoredCurrency(c: Currency) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, c);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: c }));
}

export function formatMoney(amount: number, currency: Currency, decimals = 0): string {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function useCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>("INR");
  useEffect(() => {
    setCurrency(getStoredCurrency());
    const handler = (e: Event) => {
      const c = (e as CustomEvent<Currency>).detail;
      if (c) setCurrency(c);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);
  return currency;
}

export function Money({ amount, decimals = 0 }: { amount: number; decimals?: number }) {
  const currency = useCurrency();
  return <>{formatMoney(amount, currency, decimals)}</>;
}
