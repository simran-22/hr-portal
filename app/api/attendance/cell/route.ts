import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

const ALLOWED_STATUSES = new Set([
  "present",
  "absent",
  "half_day",
  "weekly_off",
  "privilege_leave",
  "sick_leave",
  "casual_leave",
  "unpaid_leave",
  "morning_only",
]);

// POST { employee_id, date (YYYY-MM-DD), status }
// status === null  → delete the row (clear cell)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as {
    employee_id?: string;
    date?: string;
    status?: string | null;
  } | null;

  if (!body?.employee_id || !body?.date) {
    return NextResponse.json({ error: "employee_id and date required" }, { status: 400 });
  }

  // Clear cell → delete row
  if (body.status === null || body.status === "") {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("employee_id", body.employee_id)
      .eq("date", body.date);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, cleared: true });
  }

  if (!ALLOWED_STATUSES.has(body.status!)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Upsert on (employee_id, date)
  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        employee_id: body.employee_id,
        date: body.date,
        status: body.status,
      },
      { onConflict: "employee_id,date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, row: data });
}
