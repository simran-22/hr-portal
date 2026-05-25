import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabase
    .from("leaves")
    .select("*, employees(id, name)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Check permission: admin OR direct manager of leave's employee
  const { data: leaveCheck } = await supabase
    .from("leaves")
    .select("employee_id, employees(reports_to)")
    .eq("id", id)
    .single();
  if (!leaveCheck) return NextResponse.json({ error: "Leave not found" }, { status: 404 });

  const isAdmin = session.role === "admin";

  // Resolve employeeId — fall back to email lookup
  let myEmployeeId = session.employeeId ?? null;
  if (!myEmployeeId && session.email) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("email", session.email)
      .maybeSingle();
    myEmployeeId = emp?.id ?? null;
  }

  const empRel = (leaveCheck as unknown as { employees: { reports_to: string | null } | null }).employees;
  const isDirectManager = !!myEmployeeId && empRel?.reports_to === myEmployeeId;

  if (!isAdmin && !isDirectManager) {
    return NextResponse.json({ error: "You don't have permission to approve this leave." }, { status: 403 });
  }

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
    .select("*, employees(id, name)")
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
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  const { error } = await supabase.from("leaves").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
