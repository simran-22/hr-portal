import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("incentives")
    .select("*, employees(id, name)")
    .order("created_at", { ascending: false });

  if (!["admin"].includes(session.role) && session.employeeId) {
    query = query.eq("employee_id", session.employeeId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { employeeId, type, amount, reason } = await req.json();

  const { data, error } = await supabase
    .from("incentives")
    .insert({
      employee_id: employeeId,
      type,
      amount: Number(amount) || 0,
      reason: reason || null,
      status: "pending",
    })
    .select("*, employees(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
