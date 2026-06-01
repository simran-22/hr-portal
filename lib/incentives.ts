import "server-only";
import { supabase } from "@/lib/supabase";
import type { SessionPayload } from "@/lib/session";

export type IncentiveRow = {
  employeeId: string;
  name: string;
  email: string | null;
  position: string | null;
  department: string | null;
  rate: number;
  morningDays: number;
  amount: number;
};

export type MonthSpec = { year: number; month: number };

export function parseMonthParam(value: string | null | undefined): MonthSpec {
  const now = new Date();
  if (!value) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  return { year: y, month: m };
}

export function monthRange({ year, month }: MonthSpec): { start: string; endExclusive: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endExclusive = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, endExclusive };
}

type EmployeeRecord = {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
  morning_shift_rate: number | string | null;
  reports_to: string | null;
  status: string | null;
  departments: { name: string } | null;
};

async function fetchEmployees(filter: {
  ids?: string[];
  managerId?: string | null;
  onlyId?: string;
}): Promise<EmployeeRecord[]> {
  let query = supabase
    .from("employees")
    .select("id, name, email, position, morning_shift_rate, reports_to, status, departments(name)")
    .eq("status", "active")
    .order("name");

  if (filter.onlyId) query = query.eq("id", filter.onlyId);
  else if (filter.managerId) query = query.eq("reports_to", filter.managerId);
  else if (filter.ids) query = query.in("id", filter.ids);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EmployeeRecord[];
}

async function countMorningDays(
  employeeIds: string[],
  spec: MonthSpec
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (employeeIds.length === 0) return counts;
  const { start, endExclusive } = monthRange(spec);
  const { data, error } = await supabase
    .from("attendance")
    .select("employee_id")
    .in("employee_id", employeeIds)
    .eq("status", "morning_only")
    .gte("date", start)
    .lt("date", endExclusive);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as { employee_id: string }[]) {
    counts.set(row.employee_id, (counts.get(row.employee_id) ?? 0) + 1);
  }
  return counts;
}

function toRow(emp: EmployeeRecord, days: number): IncentiveRow {
  const rate = Number(emp.morning_shift_rate ?? 0) || 0;
  return {
    employeeId: emp.id,
    name: emp.name,
    email: emp.email,
    position: emp.position,
    department: emp.departments?.name ?? null,
    rate,
    morningDays: days,
    amount: Number((rate * days).toFixed(2)),
  };
}

export async function listIncentivesForSession(
  session: SessionPayload,
  spec: MonthSpec
): Promise<IncentiveRow[]> {
  let employees: EmployeeRecord[] = [];

  if (session.role === "admin") {
    employees = await fetchEmployees({});
  } else if (session.role === "manager") {
    if (!session.employeeId) return [];
    employees = await fetchEmployees({ managerId: session.employeeId });
  } else {
    if (!session.employeeId) return [];
    employees = await fetchEmployees({ onlyId: session.employeeId });
  }

  const ids = employees.map((e) => e.id);
  const counts = await countMorningDays(ids, spec);
  return employees.map((e) => toRow(e, counts.get(e.id) ?? 0));
}

export async function canEditRate(session: SessionPayload): Promise<boolean> {
  return session.role === "admin";
}
