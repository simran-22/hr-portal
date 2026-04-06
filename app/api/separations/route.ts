import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || !["admin", "hr"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("separations")
    .select("*, employees(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "hr"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { employeeId, type, reason, noticeDate, lastWorkingDate } = await req.json();

  if (!employeeId || !type) {
    return NextResponse.json({ error: "Employee and type are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("separations")
    .insert({
      employee_id: employeeId,
      type,
      reason: reason || null,
      notice_date: noticeDate || null,
      last_working_date: lastWorkingDate || null,
      exit_interview_done: false,
      assets_returned: false,
      access_revoked: false,
      status: "initiated",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
