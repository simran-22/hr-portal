"use client";

import { useEffect, useState } from "react";
import { Star, X, Loader2 } from "lucide-react";

type Favorite = {
  id: string;
  employee_id: string;
  employees: {
    id: string;
    name: string;
    position: string | null;
    departments: { name: string } | null;
  } | null;
};

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-600",
];

export function FavoritesWidget() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setFavorites(d.favorites ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (employeeId: string) => {
    setRemovingId(employeeId);
    try {
      await fetch(`/api/favorites/${employeeId}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.employee_id !== employeeId));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
          <Star className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-current" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Favorites</h3>
        <span className="ml-auto text-xs text-slate-400">{favorites.length}</span>
      </div>
      {loading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          <Star className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          No favorites yet.
          <p className="text-xs mt-1">Open an employee profile and click the star icon to pin them here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {favorites.map((f, i) => {
            if (!f.employees) return null;
            const initial = f.employees.name.charAt(0).toUpperCase();
            const gradient = GRADIENTS[i % GRADIENTS.length];
            return (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition group">
                <a href={`/employees/${f.employees.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{f.employees.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {f.employees.position ?? f.employees.departments?.name ?? "—"}
                    </p>
                  </div>
                </a>
                <button
                  onClick={() => handleRemove(f.employee_id)}
                  disabled={removingId === f.employee_id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                  title="Remove from favorites"
                >
                  {removingId === f.employee_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
