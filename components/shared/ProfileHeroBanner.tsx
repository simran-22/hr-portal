"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreHorizontal, User, Settings, X, Camera, Loader2, Trash2 } from "lucide-react";

export function ProfileHeroBanner({
  name,
  role,
  avatarUrl,
  coverUrl: initialCoverUrl,
  position,
}: {
  name: string;
  role: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  position?: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await fetch("/api/users/cover", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed"); return; }
      setCoverUrl(data.cover_url);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await fetch("/api/users/cover", { method: "DELETE" });
      setCoverUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
      {/* Cover area */}
      <div
        className={`h-32 sm:h-40 relative ${
          coverUrl
            ? "bg-slate-200 dark:bg-slate-800"
            : "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700"
        }`}
      >
        {coverUrl && (
          <>
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </>
        )}
        {!coverUrl && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
        )}

        {/* Cover controls (top-left) */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-medium rounded-lg px-2.5 py-1.5 transition disabled:opacity-50"
            title={coverUrl ? "Change cover" : "Add cover photo"}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{coverUrl ? "Change cover" : "Add cover"}</span>
          </button>
          {coverUrl && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-red-500/30 backdrop-blur-sm text-white text-xs font-medium rounded-lg px-2 py-1.5 transition"
              title="Remove cover"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* 3-dot menu (top-right) */}
        <div className="absolute top-3 right-3" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white transition"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10">
              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                onClick={() => setMenuOpen(false)}
              >
                <User className="w-4 h-4 text-violet-500" />
                View Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition border-t border-slate-100 dark:border-slate-800"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="w-4 h-4 text-violet-500" />
                Personal Preferences
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div className="absolute bottom-2 left-2 right-2 bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Avatar + name section */}
      <div className="px-6 pb-5 -mt-12 sm:-mt-14 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-slate-900 p-1.5 shadow-lg shrink-0">
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
            {position ? `${position} · ` : ""}{role}
          </p>
        </div>
      </div>
    </div>
  );
}
