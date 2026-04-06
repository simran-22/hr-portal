import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { User, Shield, Building2, Mail, Phone, Calendar, Lock, ChevronRight } from "lucide-react";
import { ProfileEditForm } from "@/components/shared/ProfileEditForm";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";

async function getProfileData(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role, is_active, created_at, employees(id, employee_id, position, phone, join_date, departments(name))")
    .eq("id", userId)
    .single();

  return profile;
}

async function getCompanyInfo() {
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });

  const { count: totalDepts } = await supabase
    .from("departments")
    .select("*", { count: "exact", head: true });

  const { count: openJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  return {
    totalEmployees: totalEmployees ?? 0,
    totalDepts: totalDepts ?? 0,
    openJobs: openJobs ?? 0,
  };
}

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    hr: "bg-violet-100 text-violet-700",
    manager: "bg-blue-100 text-blue-700",
    employee: "bg-emerald-100 text-emerald-700",
    recruiter: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[role] ?? "bg-slate-100 text-slate-600"}`}>
      {role}
    </span>
  );
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  const [profile, companyInfo] = await Promise.all([
    getProfileData(session.id),
    getCompanyInfo(),
  ]);

  const employee = (profile as any)?.employees?.[0] ?? null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500 mt-0.5">Manage your profile, security, and company information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Card header with gradient */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold shadow-lg border border-white/30">
              {getInitials(session.name)}
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">{session.name}</h3>
              <p className="text-violet-200 text-sm mt-0.5">{session.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-medium capitalize">
                  {session.role}
                </span>
                {(profile as any)?.is_active && (
                  <span className="text-xs bg-emerald-400/20 text-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile info grid */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <h4 className="font-semibold text-slate-800">Profile Information</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Full Name</label>
              <p className="text-sm font-medium text-slate-800">{session.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <p className="text-sm font-medium text-slate-800">{session.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Role</label>
              <div>{roleBadge(session.role)}</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Member Since
              </label>
              <p className="text-sm text-slate-700">{formatDate((profile as any)?.created_at)}</p>
            </div>
            {employee && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Employee ID</label>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    {employee.employee_id ?? "—"}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Position</label>
                  <p className="text-sm text-slate-700">{employee.position ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <p className="text-sm text-slate-700">{employee.phone ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Department</label>
                  <p className="text-sm text-slate-700">{employee.departments?.name ?? "—"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Join Date
                  </label>
                  <p className="text-sm text-slate-700">{formatDate(employee.join_date)}</p>
                </div>
              </>
            )}
          </div>
          <ProfileEditForm name={session.name} phone={employee?.phone ?? ""} />
        </div>
      </div>

      {/* Security Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <h4 className="font-semibold text-slate-800">Security</h4>
          </div>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          <div className="px-6 py-4">
            <ChangePasswordForm />
          </div>
          {[
            {
              icon: Shield,
              title: "Two-Factor Authentication",
              description: "Add an extra layer of security to your account",
              badge: "Coming Soon",
            },
            {
              icon: Mail,
              title: "Email Notifications",
              description: "Manage which notifications you receive by email",
              badge: "Coming Soon",
            },
          ].map(({ icon: Icon, title, description, badge }) => (
            <div
              key={title}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                </div>
              </div>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Company Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <h4 className="font-semibold text-slate-800">Company Information</h4>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                label: "Total Employees",
                value: companyInfo.totalEmployees,
                gradient: "from-violet-500 to-purple-600",
                icon: User,
              },
              {
                label: "Departments",
                value: companyInfo.totalDepts,
                gradient: "from-blue-500 to-cyan-600",
                icon: Building2,
              },
              {
                label: "Open Positions",
                value: companyInfo.openJobs,
                gradient: "from-emerald-400 to-teal-600",
                icon: Shield,
              },
            ].map(({ label, value, gradient, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-xl font-bold text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">HR Portal</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comprehensive human resources management system. Manage employees, attendance,
                  leaves, payroll, performance, and recruitment in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
