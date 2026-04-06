import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { Megaphone, Trash2 } from "lucide-react";
import { AddAnnouncementButton } from "@/components/shared/AddAnnouncementButton";
import { DeleteAnnouncementButton } from "@/components/shared/DeleteAnnouncementButton";

async function getAnnouncements() {
  const { data } = await supabase
    .from("announcements")
    .select("*, departments(name), profiles:created_by(name)")
    .order("published_at", { ascending: false });
  return data ?? [];
}

const scopeBadge: Record<string, string> = {
  company: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
  department: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AnnouncementsPage() {
  const session = await getSession();
  const canManage = session && ["admin", "hr"].includes(session.role);
  const announcements = await getAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Announcements</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{announcements.length} announcement{announcements.length !== 1 ? "s" : ""}</p>
        </div>
        {canManage && <AddAnnouncementButton />}
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
            <Megaphone className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-slate-800 dark:text-slate-100 font-semibold text-lg">No announcements yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create announcements to share with your team</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann: any) => (
            <div key={ann.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${scopeBadge[ann.scope] ?? scopeBadge.company}`}>
                      {ann.scope === "department" ? ann.departments?.name ?? "Department" : "Company-wide"}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(ann.published_at)}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{ann.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">{ann.content}</p>
                  {ann.profiles?.name && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Posted by {ann.profiles.name}</p>
                  )}
                </div>
                {canManage && <DeleteAnnouncementButton id={ann.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
