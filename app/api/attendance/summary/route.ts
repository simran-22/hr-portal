import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

const DAILY_TARGET_HOURS = 8;

function startOfWeek(today: Date): Date {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfMonth(today: Date): Date {
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function countWorkdays(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = (req.nextUrl.searchParams.get("period") ?? "month") as "week" | "month";
  const today = new Date();
  const from = period === "week" ? startOfWeek(today) : startOfMonth(today);
  const fromStr = from.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const workdaysSoFar = countWorkdays(from, today);
  const targetHours = workdaysSoFar * DAILY_TARGET_HOURS;

  const isAdmin = session.role === "admin";

  let query = supabase
    .from("attendance")
    .select("employee_id, date, hours_worked, employees(id, name, position, departments(name))")
    .gte("date", fromStr)
    .lte("date", todayStr);

  if (!isAdmin && session.employeeId) {
    query = query.eq("employee_id", session.employeeId);
  }

  const { data: records, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type RawRecord = {
    employee_id: string;
    date: string;
    hours_worked: number | null;
    employees: { id: string; name: string; position: string | null; departments: { name: string } | null } | null;
  };

  const grouped = new Map<string, {
    id: string;
    name: string;
    position: string | null;
    department: string | null;
    totalHours: number;
    daysWorked: number;
  }>();

  for (const r of (records ?? []) as unknown as RawRecord[]) {
    if (!r.employees) continue;
    const id = r.employees.id;
    const existing = grouped.get(id) ?? {
      id,
      name: r.employees.name,
      position: r.employees.position,
      department: r.employees.departments?.name ?? null,
      totalHours: 0,
      daysWorked: 0,
    };
    existing.totalHours += Number(r.hours_worked ?? 0);
    if ((r.hours_worked ?? 0) > 0) existing.daysWorked += 1;
    grouped.set(id, existing);
  }

  let summary = Array.from(grouped.values()).map((e) => {
    const avg = e.daysWorked > 0 ? e.totalHours / e.daysWorked : 0;
    const status: "on_track" | "under" | "over" | "no_data" =
      e.daysWorked === 0
        ? "no_data"
        : avg < 7.5
          ? "under"
          : avg > 9.5
            ? "over"
            : "on_track";
    return {
      ...e,
      totalHours: Math.round(e.totalHours * 10) / 10,
      avgPerDay: Math.round(avg * 10) / 10,
      status,
    };
  });

  if (isAdmin) {
    const { data: allEmployees } = await supabase
      .from("employees")
      .select("id, name, position, departments(name), status")
      .neq("status", "terminated");

    type EmployeeRow = { id: string; name: string; position: string | null; departments: { name: string } | null };
    for (const emp of ((allEmployees ?? []) as unknown as EmployeeRow[])) {
      if (!grouped.has(emp.id)) {
        summary.push({
          id: emp.id,
          name: emp.name,
          position: emp.position,
          department: emp.departments?.name ?? null,
          totalHours: 0,
          daysWorked: 0,
          avgPerDay: 0,
          status: "no_data",
        });
      }
    }
  }

  summary = summary.sort((a, b) => b.totalHours - a.totalHours);

  return NextResponse.json({
    period,
    from: fromStr,
    to: todayStr,
    workdaysSoFar,
    targetHours,
    dailyTarget: DAILY_TARGET_HOURS,
    summary,
  });
}
