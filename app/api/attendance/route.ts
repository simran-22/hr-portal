import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const month = searchParams.get("month") ?? "";

  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(year, mon - 1, 1).toISOString();
  const endDate = new Date(year, mon, 0, 23, 59, 59).toISOString();

  let query = supabase
    .from("attendance")
    .select("*, employees(id, name, employee_id)")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (session.role === "employee" && session.employeeId) {
    query = query.eq("employee_id", session.employeeId);
  }

  const { data: records, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const summary = {
    present: records?.filter((r) => r.status === "present").length ?? 0,
    absent: records?.filter((r) => r.status === "absent").length ?? 0,
    halfDay: records?.filter((r) => r.status === "half_day").length ?? 0,
    totalHours: records?.reduce((sum, r) => sum + (r.hours_worked ?? 0), 0) ?? 0,
  };

  return NextResponse.json({ records, summary });
}
