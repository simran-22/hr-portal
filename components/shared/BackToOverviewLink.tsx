"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToOverviewLink() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  if (from !== "overview") return null;

  return (
    <Link
      href="/overview"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-3"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Overview
    </Link>
  );
}
