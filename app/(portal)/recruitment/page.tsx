import { supabase } from "@/lib/supabase";
import { Briefcase, MapPin, Users, Calendar, Plus } from "lucide-react";
import { AddJobButton } from "@/components/shared/AddJobButton";
import { AddCandidateButton } from "@/components/shared/AddCandidateButton";
import { getSession } from "@/lib/session";

async function getRecruitmentData() {
  const [{ data: jobs }, { data: candidates }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, type, location, status, deadline, departments(name), candidates(count)")
      .order("created_at", { ascending: false }),
    supabase
      .from("candidates")
      .select(
        "id, name, email, phone, status, applied_at, jobs(title, departments(name))"
      )
      .order("applied_at", { ascending: false })
      .limit(10),
  ]);

  return { jobs: jobs ?? [], candidates: candidates ?? [] };
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    open: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
    archived: "bg-red-100 text-red-700",
    draft: "bg-amber-100 text-amber-700",
    shortlisted: "bg-blue-100 text-blue-700",
    interviewing: "bg-violet-100 text-violet-700",
    offered: "bg-cyan-100 text-cyan-700",
    hired: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    applied: "bg-amber-100 text-amber-700",
    withdrawn: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
};

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    full_time: "bg-violet-100 text-violet-700",
    part_time: "bg-cyan-100 text-cyan-700",
    contract: "bg-orange-100 text-orange-700",
    intern: "bg-pink-100 text-pink-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${map[type] ?? "bg-slate-100 text-slate-600"}`}>
      {type?.replace(/_/g, " ")}
    </span>
  );
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const JOB_GRADIENT_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

export default async function RecruitmentPage() {
  const session = await getSession();
  const canManage = session && ["admin", "hr", "recruiter"].includes(session.role);

  const { jobs, candidates } = await getRecruitmentData();

  const openJobs = jobs.filter((j: any) => j.status === "open").length;
  const totalCandidates = candidates.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Recruitment</h2>
          <p className="text-slate-500 mt-0.5">
            {openJobs} open position{openJobs !== 1 ? "s" : ""} · {jobs.length} total job{jobs.length !== 1 ? "s" : ""}
          </p>
        </div>
{canManage && <AddJobButton />}
      </div>

      {/* Job Cards Grid */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-slate-800 font-semibold text-lg">No job postings yet</h3>
          <p className="text-slate-500 text-sm mt-1">Post your first job opening to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {jobs.map((job: any, idx: number) => {
            const candidateCount = job.candidates?.[0]?.count ?? 0;
            return (
              <div
                key={job.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all group"
              >
                {/* Card top */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${JOB_GRADIENT_COLORS[idx % JOB_GRADIENT_COLORS.length]} flex items-center justify-center shadow-sm shrink-0`}>
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">{job.title}</h3>
                    {job.departments?.name && (
                      <p className="text-xs text-slate-500 mt-0.5">{job.departments.name}</p>
                    )}
                  </div>
                  {statusBadge(job.status)}
                </div>

                {/* Details */}
                <div className="space-y-2">
                  {job.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  {job.deadline && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>Deadline: {formatDate(job.deadline)}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Users className="w-3.5 h-3.5" />
                    <span>{candidateCount} candidate{candidateCount !== 1 ? "s" : ""}</span>
                  </div>
                  {typeBadge(job.type)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Candidates Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Candidates</h3>
          {canManage && <AddCandidateButton />}
          <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
            {totalCandidates} recent
          </span>
        </div>

        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-slate-500 text-sm">No candidates yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied For</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.map((candidate: any) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {candidate.name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{candidate.name}</p>
                          <p className="text-xs text-slate-400">{candidate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {candidate.jobs?.title ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {candidate.jobs?.departments?.name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {candidate.applied_at
                        ? new Date(candidate.applied_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-4">{statusBadge(candidate.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
