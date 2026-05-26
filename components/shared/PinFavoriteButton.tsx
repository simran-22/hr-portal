"use client";

import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";

export function PinFavoriteButton({ employeeId }: { employeeId: string }) {
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => {
        const favs = (d.favorites ?? []) as { employee_id: string }[];
        setIsFavorite(favs.some((f) => f.employee_id === employeeId));
      })
      .catch(() => setIsFavorite(false));
  }, [employeeId]);

  const toggle = async () => {
    if (isFavorite === null) return;
    setLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites/${employeeId}`, { method: "DELETE" });
        setIsFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId }),
        });
        setIsFavorite(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || isFavorite === null}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition disabled:opacity-50 ${
        isFavorite
          ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-200"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Star className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
      )}
    </button>
  );
}
