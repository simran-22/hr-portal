import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listWorkingHoursForSession, parseMonthParam } from "@/lib/working-hours";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const spec = parseMonthParam(req.nextUrl.searchParams.get("month"));

  try {
    const rows = await listWorkingHoursForSession(session, spec);
    const totals = rows.reduce(
      (acc, r) => ({
        worked: acc.worked + r.workedHours,
        expected: acc.expected + r.expectedHours,
        overtime: acc.overtime + r.overtimeHours,
        late: acc.late + r.lateMinutes,
      }),
      { worked: 0, expected: 0, overtime: 0, late: 0 }
    );
    return NextResponse.json({
      month: `${spec.year}-${String(spec.month).padStart(2, "0")}`,
      scope: session.role,
      rows,
      totals: {
        worked: Number(totals.worked.toFixed(2)),
        expected: Number(totals.expected.toFixed(2)),
        overtime: Number(totals.overtime.toFixed(2)),
        late: Math.round(totals.late),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load working hours";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
