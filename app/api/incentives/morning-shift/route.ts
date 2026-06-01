import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listIncentivesForSession, parseMonthParam } from "@/lib/incentives";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const spec = parseMonthParam(req.nextUrl.searchParams.get("month"));

  try {
    const rows = await listIncentivesForSession(session, spec);
    const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
    const totalDays = rows.reduce((s, r) => s + r.morningDays, 0);
    const earners = rows.filter((r) => r.amount > 0).length;
    return NextResponse.json({
      month: `${spec.year}-${String(spec.month).padStart(2, "0")}`,
      scope: session.role,
      rows,
      totals: {
        amount: Number(totalAmount.toFixed(2)),
        days: totalDays,
        earners,
        employees: rows.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load incentives";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
