"use client";

import { useState, useEffect, useRef } from "react";
import { X, Pencil, Check, Loader2, Mail, Phone, Briefcase, Building2, Calendar, Shield, User } from "lucide-react";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    position: string | null;
    status: string;
    hire_date: string | null;
    departments: { name: string } | null;
  } | null;
};

export function ProfileDropdown({ userName, userRole }: { userName: string; userRole: string }) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [saved, setSaved] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !profile) {
      setLoading(true);
      fetch("/api/users/profile")
        .then((r) => r.json())
        .then((data) => {
          setProfile(data);
          setEditName(data.name ?? "");
          setEditPhone(data.employee?.phone ?? "");
          setEditPosition(data.employee?.position ?? "");
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, profile]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone, position: editPosition }),
      });
      if (res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                name: editName,
                employee: prev.employee
                  ? { ...prev.employee, name: editName, phone: editPhone, position: editPosition }
                  : prev.employee,
              }
            : prev
        );
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    setSaving(false);
  };

  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={panelRef}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
      >
        {initial}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-6 text-center relative">
            <button
              onClick={() => { setOpen(false); setEditing(false); }}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2 border-2 border-white/30">
              {initial}
            </div>
            {editing ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/20 text-white text-center rounded-lg px-3 py-1 text-sm font-semibold w-full max-w-[200px] mx-auto block placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="Your name"
              />
            ) : (
              <h3 className="text-white font-bold text-lg">{profile?.name ?? userName}</h3>
            )}
            <span className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/20 text-white capitalize">
              {userRole}
            </span>
          </div>

          {/* Body */}
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
              </div>
            ) : profile ? (
              <div className="space-y-3">
                {/* Email */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Mail className="w-4 h-4 text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Email</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{profile.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Phone className="w-4 h-4 text-violet-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Phone</p>
                    {editing ? (
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-violet-500"
                        placeholder="Add phone"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        {profile.employee?.phone || <span className="text-slate-400 italic">Not set</span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Position */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Briefcase className="w-4 h-4 text-violet-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Position</p>
                    {editing ? (
                      <input
                        value={editPosition}
                        onChange={(e) => setEditPosition(e.target.value)}
                        className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-violet-500"
                        placeholder="Add position"
                      />
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        {profile.employee?.position || <span className="text-slate-400 italic">Not set</span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Department */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Department</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {profile.employee?.departments?.name || <span className="text-slate-400 italic">Not assigned</span>}
                    </p>
                  </div>
                </div>

                {/* Hire Date */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Calendar className="w-4 h-4 text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Joined</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {profile.employee?.hire_date
                        ? new Date(profile.employee.hire_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : profile.created_at
                          ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "Not set"}
                    </p>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Shield className="w-4 h-4 text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Role</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 capitalize">{profile.role}</p>
                  </div>
                </div>

                {saved && (
                  <div className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium py-1">
                    Profile updated successfully!
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  {editing ? (
                    <>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex-1 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl py-2.5 transition disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditing(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 rounded-xl py-2.5 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">Could not load profile</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
