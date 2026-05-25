import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

// Default annual entitlements (matching company policy from HR sheet)
const DEFAULTS = {
  annual_total: 15, // Privilege Leave
  sick_total: 7,
  casual_total: 7,
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve employee id (with email fallback)
  let employeeId = session.employeeId ?? null;
  let hireDate: string | null = null;
  if (!employeeId && session.email) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id, hire_date")
      .eq("email", session.email)
      .maybeSingle();
    if (emp) {
      employeeId = emp.id;
      hireDate = emp.hire_date;
    }
  }
  if (employeeId && !hireDate) {
    const { data: emp } = await supabase
      .from("employees")
      .select("hire_date")
      .eq("id", employeeId)
      .maybeSingle();
    hireDate = emp?.hire_date ?? null;
  }

  if (!employeeId) {
    return NextResponse.json({
      privilege: { total: DEFAULTS.annual_total, accumulated: 0, used: 0, balance: 0 },
      sick:      { total: DEFAULTS.sick_total,    accumulated: 0, used: 0, balance: 0 },
      casual:    { total: DEFAULTS.casual_total,  accumulated: 0, used: 0, balance: 0 },
      note: "No employee record linked to this account.",
    });
  }

  const now = new Date();
  const year = now.getFullYear();

  // Existing balance record (for total overrides + previously tallied used counts)
  const { data: balance } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("year", year)
    .maybeSingle();

  const totals = {
    privilege: Number(balance?.annual_total ?? DEFAULTS.annual_total),
    sick:      Number(balance?.sick_total    ?? DEFAULTS.sick_total),
    casual:    Number(balance?.casual_total  ?? DEFAULTS.casual_total),
  };

  // --- Accumulated calculation ---
  // Count months completed since Jan 1 (or hire_date if joined this year)
  // Pro-rated: each month gives total / 12
  const yearStart = new Date(year, 0, 1);
  const startDate = hireDate && new Date(hireDate) > yearStart ? new Date(hireDate) : yearStart;
  const monthsElapsed = Math.max(
    0,
    (now.getFullYear() - startDate.getFullYear()) * 12
    + (now.getMonth() - startDate.getMonth())
    + (now.getDate() >= startDate.getDate() ? 1 : 0) // include current month if start-day reached
  );
  const monthsCapped = Math.min(monthsElapsed, 12);

  const accumulated = {
    privilege: Math.round((totals.privilege / 12) * monthsCapped * 100) / 100,
    sick:      Math.round((totals.sick / 12)      * monthsCapped * 100) / 100,
    casual:    Math.round((totals.casual / 12)    * monthsCapped * 100) / 100,
  };

  // --- Used calculation (from approved leaves this year) ---
  const yearStartIso = `${year}-01-01`;
  const yearEndIso   = `${year}-12-31`;

  const { data: usedLeaves } = await supabase
    .from("leaves")
    .select("type, days, status")
    .eq("employee_id", employeeId)
    .eq("status", "approved")
    .gte("from_date", yearStartIso)
    .lte("from_date", yearEndIso);

  const used = { privilege: 0, sick: 0, casual: 0 };
  for (const l of (usedLeaves ?? []) as { type: string; days: number }[]) {
    const days = Number(l.days ?? 0);
    if (l.type === "annual") used.privilege += days;
    else if (l.type === "sick") used.sick += days;
    else if (l.type === "casual") used.casual += days;
    // unpaid / maternity / paternity not deducted from these buckets
  }

  return NextResponse.json({
    privilege: {
      total: totals.privilege,
      accumulated: accumulated.privilege,
      used: used.privilege,
      balance: Math.round((accumulated.privilege - used.privilege) * 100) / 100,
    },
    sick: {
      total: totals.sick,
      accumulated: accumulated.sick,
      used: used.sick,
      balance: Math.round((accumulated.sick - used.sick) * 100) / 100,
    },
    casual: {
      total: totals.casual,
      accumulated: accumulated.casual,
      used: used.casual,
      balance: Math.round((accumulated.casual - used.casual) * 100) / 100,
    },
    monthsElapsed: monthsCapped,
    asOf: now.toISOString().slice(0, 10),
  });
}
