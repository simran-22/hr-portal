import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabase
    .from("leaves")
    .select("*, employees(id, name, employee_id)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "hr", "manager"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const { status, rejectedReason } = await req.json();

  const { data: leave, error: updateError } = await supabase
    .from("leaves")
    .update({
      status,
      approved_by: session.id,
      approved_at: new Date().toISOString(),
      rejected_reason: rejectedReason ?? null,
    })
    .eq("id", id)
    .select("*, employees(id, name, employee_id)")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  // Update leave balance on approval
  if (status === "approved" && leave.employee_id) {
    const { data: balance } = await supabase
      .from("leave_balances")
      .select("*")
      .eq("employee_id", leave.employee_id)
      .maybeSingle();

    if (balance) {
      const fieldMap: Record<string, string> = {
        annual: "used_annual",
        sick: "used_sick",
        casual: "used_casual",
      };
      const updateField = fieldMap[leave.type];
      if (updateField) {
        await supabase
          .from("leave_balances")
          .update({ [updateField]: (balance[updateField] ?? 0) + leave.days })
          .eq("employee_id", leave.employee_id);
      }
    }
  }

  return NextResponse.json(leave);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "hr"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  const { error } = await supabase.from("leaves").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
