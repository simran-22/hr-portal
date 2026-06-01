import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { isDirectReportOfSession } from "@/lib/incentives";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { employeeId } = await params;
  const body = await req.json().catch(() => ({}));
  const raw = (body as { rate?: unknown }).rate;
  const rate = Number(raw);
  if (!Number.isFinite(rate) || rate < 0) {
    return NextResponse.json({ error: "Rate must be a non-negative number" }, { status: 400 });
  }

  if (session.role !== "admin") {
    if (session.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const allowed = await isDirectReportOfSession(session, employeeId);
    if (!allowed) {
      return NextResponse.json(
        { error: "You can only set rates for your direct reports" },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from("employees")
    .update({ morning_shift_rate: rate })
    .eq("id", employeeId)
    .select("id, morning_shift_rate")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id, rate: Number(data.morning_shift_rate ?? 0) });
}
