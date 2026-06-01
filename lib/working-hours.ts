import "server-only";
import { supabase } from "@/lib/supabase";
import type { SessionPayload } from "@/lib/session";

export type WorkingHoursRow = {
  employeeId: string;
  name: string;
  email: string | null;
  position: string | null;
  department: string | null;
  shift: { start: string; end: string; breakMinutes: number } | null;
  daysPresent: number;
  expectedHours: number;
  workedHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeHours: number;
};

export type MonthSpec = { year: number; month: number };

export function parseMonthParam(value: string | null | undefined): MonthSpec {
  const now = new Date();
  if (!value) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  return { year: y, month: mo };
}

function monthRange({ year, month }: MonthSpec): { start: string; endExclusive: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endExclusive = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, endExclusive };
}

// Parse "HH:MM:SS" or "HH:MM" into minutes since midnight.
function timeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return h * 60 + min;
}

// Pull HH:MM (in IST, +05:30) from an ISO timestamp. Returns minutes since midnight.
function isoToMinutesIST(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // Convert UTC to IST offset (+330 minutes)
  const istMs = d.getTime() + 330 * 60_000;
  const ist = new Date(istMs);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

type ShiftWindow = { start: number; end: number; crossesMidnight: boolean; breakMinutes: number };

function buildShiftWindow(
  start: string | null,
  end: string | null,
  breakMinutes: number
): ShiftWindow | null {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s == null || e == null) return null;
  return { start: s, end: e, crossesMidnight: e <= s, breakMinutes };
}

function expectedHoursForShift(w: ShiftWindow): number {
  const gross = w.crossesMidnight ? 24 * 60 - w.start + w.end : w.end - w.start;
  const net = Math.max(0, gross - w.breakMinutes);
  return Number((net / 60).toFixed(2));
}

function dayMetrics(
  w: ShiftWindow,
  checkInMinutes: number | null,
  checkOutMinutes: number | null,
  status: string
): { worked: number; late: number; early: number; overtime: number; present: boolean } {
  // Half-day: expect half the shift, no late/early/overtime computation
  if (status === "half_day") {
    return { worked: expectedHoursForShift(w) / 2, late: 0, early: 0, overtime: 0, present: true };
  }
  if (status !== "present" && status !== "late" && status !== "morning_only") {
    return { worked: 0, late: 0, early: 0, overtime: 0, present: false };
  }

  const present = true;
  let worked = 0;
  let late = 0;
  let early = 0;
  let overtime = 0;

  if (checkInMinutes != null) {
    // Late if check-in after shift start (only for non-crossing-midnight shifts; for night
    // shifts this gets fuzzy, so we cap at +/- 4h.)
    const delta = checkInMinutes - w.start;
    if (delta > 0 && delta < 240) late = delta;
  }
  if (checkOutMinutes != null) {
    // Overtime if check-out past shift end
    const ref = w.crossesMidnight ? w.end + 24 * 60 : w.end;
    // For overtime we accept check_out values either same-day or next-day for night shifts;
    // simplest case is same-day.
    const co = checkOutMinutes < w.start ? checkOutMinutes + 24 * 60 : checkOutMinutes;
    const otDelta = co - ref;
    if (otDelta > 0 && otDelta < 12 * 60) overtime = otDelta;
    const earlyDelta = ref - co;
    if (earlyDelta > 0 && earlyDelta < 240) early = earlyDelta;
  }
  if (checkInMinutes != null && checkOutMinutes != null) {
    const start = checkInMinutes;
    const end = checkOutMinutes < start ? checkOutMinutes + 24 * 60 : checkOutMinutes;
    const grossMin = end - start;
    worked = Math.max(0, grossMin - w.breakMinutes) / 60;
  } else if (status === "morning_only") {
    // Morning-only: count as half-day worked from shift expected
    worked = expectedHoursForShift(w) / 2;
  } else {
    // No check times but marked present: credit expected hours
    worked = expectedHoursForShift(w);
  }

  return { worked, late, early, overtime, present };
}

type EmployeeRow = {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
  status: string | null;
  shift_start: string | null;
  shift_end: string | null;
  shift_break_minutes: number | null;
  reports_to: string | null;
  departments: { name: string } | null;
};

type AttendanceRow = {
  employee_id: string;
  date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
};

async function fetchEmployees(filter: {
  managerId?: string | null;
  onlyId?: string;
}): Promise<EmployeeRow[]> {
  let query = supabase
    .from("employees")
    .select(
      "id, name, email, position, status, shift_start, shift_end, shift_break_minutes, reports_to, departments(name)"
    )
    .eq("status", "active")
    .order("name");

  if (filter.onlyId) query = query.eq("id", filter.onlyId);
  else if (filter.managerId) query = query.eq("reports_to", filter.managerId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EmployeeRow[];
}

async function fetchAttendance(
  employeeIds: string[],
  spec: MonthSpec
): Promise<Map<string, AttendanceRow[]>> {
  const map = new Map<string, AttendanceRow[]>();
  if (employeeIds.length === 0) return map;
  const { start, endExclusive } = monthRange(spec);
  const { data, error } = await supabase
    .from("attendance")
    .select("employee_id, date, status, check_in, check_out")
    .in("employee_id", employeeIds)
    .gte("date", start)
    .lt("date", endExclusive);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as AttendanceRow[]) {
    const arr = map.get(row.employee_id) ?? [];
    arr.push(row);
    map.set(row.employee_id, arr);
  }
  return map;
}

function aggregate(emp: EmployeeRow, attendance: AttendanceRow[]): WorkingHoursRow {
  const window = buildShiftWindow(emp.shift_start, emp.shift_end, emp.shift_break_minutes ?? 0);
  const shift = window
    ? { start: emp.shift_start!, end: emp.shift_end!, breakMinutes: emp.shift_break_minutes ?? 0 }
    : null;

  let daysPresent = 0;
  let expectedHours = 0;
  let workedHours = 0;
  let lateMinutes = 0;
  let earlyLeaveMinutes = 0;
  let overtimeMinutes = 0;

  if (window) {
    const dailyExpected = expectedHoursForShift(window);
    for (const a of attendance) {
      const m = dayMetrics(
        window,
        isoToMinutesIST(a.check_in),
        isoToMinutesIST(a.check_out),
        a.status
      );
      if (!m.present) continue;
      daysPresent += 1;
      expectedHours += a.status === "half_day" ? dailyExpected / 2 : dailyExpected;
      workedHours += m.worked;
      lateMinutes += m.late;
      earlyLeaveMinutes += m.early;
      overtimeMinutes += m.overtime;
    }
  }

  return {
    employeeId: emp.id,
    name: emp.name,
    email: emp.email,
    position: emp.position,
    department: emp.departments?.name ?? null,
    shift,
    daysPresent,
    expectedHours: Number(expectedHours.toFixed(2)),
    workedHours: Number(workedHours.toFixed(2)),
    lateMinutes: Math.round(lateMinutes),
    earlyLeaveMinutes: Math.round(earlyLeaveMinutes),
    overtimeHours: Number((overtimeMinutes / 60).toFixed(2)),
  };
}

export async function listWorkingHoursForSession(
  session: SessionPayload,
  spec: MonthSpec
): Promise<WorkingHoursRow[]> {
  let employees: EmployeeRow[] = [];
  if (session.role === "admin") {
    employees = await fetchEmployees({});
  } else {
    // Manager and Employee both scope to self only.
    if (!session.employeeId) return [];
    employees = await fetchEmployees({ onlyId: session.employeeId });
  }

  const ids = employees.map((e) => e.id);
  const attendanceByEmp = await fetchAttendance(ids, spec);

  return employees.map((e) => aggregate(e, attendanceByEmp.get(e.id) ?? []));
}
