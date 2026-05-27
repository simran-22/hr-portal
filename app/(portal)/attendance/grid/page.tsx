import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AttendanceGrid } from "@/components/shared/AttendanceGrid";
import { HRReportsTabs } from "@/components/shared/HRReportsTabs";

type Emp = {
  id: string;
  name: string;
  status: string;
  reports_to: string | null;
  manager_name: string | null;
};

function ymKey(year: number, month1: number) {
  return `${year}-${String(month1).padStart(2, "0")}`;
}

function daysInMonth(year: number, month1: number) {
  return new Date(year, month1, 0).getDate();
}

async function getEmployees(): Promise<Emp[]> {
  const { data } = await supabase
    .from("employees")
    .select("id, name, status, reports_to")
    .order("name");

  const emps = (data ?? []) as { id: string; name: string; status: string; reports_to: string | null }[];

  // Build manager name lookup
  const ids = Array.from(new Set(emps.map((e) => e.reports_to).filter(Boolean) as string[]));
  const managerMap = new Map<string, string>();
  if (ids.length > 0) {
    const { data: mgrs } = await supabase
      .from("employees")
      .select("id, name")
      .in("id", ids);
    for (const m of (mgrs ?? []) as { id: string; name: string }[]) {
      managerMap.set(m.id, m.name);
    }
  }

  return emps.map((e) => ({
    ...e,
    manager_name: e.reports_to ? (managerMap.get(e.reports_to) ?? null) : null,
  }));
}

async function getAttendance(year: number, month1: number) {
  const start = `${ymKey(year, month1)}-01`;
  const dim = daysInMonth(year, month1);
  const end = `${ymKey(year, month1)}-${String(dim).padStart(2, "0")}`;

  const { data } = await supabase
    .from("attendance")
    .select("employee_id, date, status")
    .gte("date", start)
    .lte("date", end);

  return (data ?? []) as { employee_id: string; date: string; status: string }[];
}

async function getApprovedLeaves(year: number, month1: number) {
  const start = `${ymKey(year, month1)}-01`;
  const dim = daysInMonth(year, month1);
  const end = `${ymKey(year, month1)}-${String(dim).padStart(2, "0")}`;

  // Leaves overlapping the month
  const { data } = await supabase
    .from("leaves")
    .select("employee_id, type, from_date, to_date")
    .eq("status", "approved")
    .lte("from_date", end)
    .gte("to_date", start);

  return (data ?? []) as { employee_id: string; type: string; from_date: string; to_date: string }[];
}

async function getHolidays(year: number, month1: number) {
  const start = `${ymKey(year, month1)}-01`;
  const dim = daysInMonth(year, month1);
  const end = `${ymKey(year, month1)}-${String(dim).padStart(2, "0")}`;

  const { data } = await supabase
    .from("holidays")
    .select("date, name")
    .gte("date", start)
    .lte("date", end);

  return (data ?? []) as { date: string; name: string }[];
}

export default async function AttendanceGridPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/dashboard");

  const sp = await searchParams;
  const now = new Date();
  const year = parseInt(sp.year ?? String(now.getFullYear()), 10);
  const month1 = parseInt(sp.month ?? String(now.getMonth() + 1), 10);

  const [employees, attendance, approvedLeaves, holidays] = await Promise.all([
    getEmployees(),
    getAttendance(year, month1),
    getApprovedLeaves(year, month1),
    getHolidays(year, month1),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1800px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">HR Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Daily attendance matrix · click any cell to set status · changes save instantly
        </p>
      </div>

      <HRReportsTabs />

      <AttendanceGrid
        year={year}
        month1={month1}
        employees={employees}
        attendance={attendance}
        approvedLeaves={approvedLeaves}
        holidays={holidays}
      />
    </div>
  );
}
