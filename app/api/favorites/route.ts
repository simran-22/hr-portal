import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_favorites")
    .select("id, employee_id, created_at, employees(id, name, position, departments(name))")
    .eq("profile_id", session.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorites: data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { employeeId } = await req.json();
  if (!employeeId) return NextResponse.json({ error: "employeeId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("user_favorites")
    .insert({ profile_id: session.id, employee_id: employeeId })
    .select()
    .single();

  if (error) {
    // Already favorited -> idempotent success
    if (error.code === "23505") return NextResponse.json({ ok: true, alreadyExists: true });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data, { status: 201 });
}
