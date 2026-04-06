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
      "*, departments(*), leave_balances(*), payroll(*, created_at), leaves(*, created_at)"
    )
    .eq("id", id)
    .single();

  if (error || !employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(employee);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "hr"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabase
    .from("employees")
    .update({
      name: body.name,
      phone: body.phone,
      position: body.position,
      department_id: body.departmentId || null,
      salary: body.salary ? Number(body.salary) : undefined,
      employment_type: body.employmentType,
      status: body.status,
      bio: body.bio,
      address: body.address,
    })
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
