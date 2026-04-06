import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone } = await req.json();

  // Update profile name
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", session.id);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

  // Update employee phone if employee exists
  if (session.employeeId && phone !== undefined) {
    await supabase
      .from("employees")
      .update({ phone })
      .eq("id", session.employeeId);
  }

  return NextResponse.json({ success: true });
}
