import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      "*, departments(id, name)"
    )
    .eq("id", id)
    .single();

  if (error || !employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {
    name: body.name,
    phone: body.phone,
    position: body.position,
    department_id: body.departmentId || null,
    salary: body.salary ? Number(body.salary) : undefined,
    status: body.status,
  };
  if (body.hireDate !== undefined) updates.hire_date = body.hireDate || null;
  if (body.dateOfBirth !== undefined) updates.date_of_birth = body.dateOfBirth || null;
  if (body.status !== undefined && body.status !== "probation") {
    updates.probation_end_date = null;
  } else if (body.probationEndDate !== undefined) {
    updates.probation_end_date = body.probationEndDate || null;
  }
  if (body.basicSalary !== undefined) updates.basic_salary = body.basicSalary ? Number(body.basicSalary) : null;
  if (body.uan !== undefined) updates.uan = body.uan || null;
  if (body.pfNumber !== undefined) updates.pf_number = body.pfNumber || null;
  if (body.pfApplicable !== undefined) updates.pf_applicable = body.pfApplicable;
  if (body.reportsTo !== undefined) {
    // prevent self-reference
    if (body.reportsTo === id) {
      return NextResponse.json({ error: "An employee cannot report to themselves." }, { status: 400 });
    }
    updates.reports_to = body.reportsTo || null;
  }

  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select("*, departments(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
