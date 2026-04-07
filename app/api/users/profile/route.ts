import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, is_active, created_at")
    .eq("id", session.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Try to get linked employee details
  let employee = null;
  if (session.employeeId) {
    const { data } = await supabase
      .from("employees")
      .select("id, name, email, phone, position, status, hire_date, departments(name)")
      .eq("id", session.employeeId)
      .single();
    employee = data;
  } else {
    // Fallback: find employee by email
    const { data } = await supabase
      .from("employees")
      .select("id, name, email, phone, position, status, hire_date, departments(name)")
      .eq("email", profile.email)
      .single();
    employee = data;
  }

  return NextResponse.json({ ...profile, employee });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, position } = body;

  if (name) {
    const { error } = await supabase.from("profiles").update({ name }).eq("id", session.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update employee record if exists
  const employeeId = session.employeeId;
  if (employeeId) {
    const updates: Record<string, string> = {};
    if (phone !== undefined) updates.phone = phone;
    if (position !== undefined) updates.position = position;
    if (name) updates.name = name;
    if (Object.keys(updates).length > 0) {
      await supabase.from("employees").update(updates).eq("id", employeeId);
    }
  }

  return NextResponse.json({ success: true });
}
