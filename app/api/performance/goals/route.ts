import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("goals")
    .select("*, employees(id, name)")
    .order("created_at", { ascending: false });

  if (session.role === "employee" && session.employeeId) {
    query = query.eq("employee_id", session.employeeId);
  }

  const { data: goals, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { employeeId, title, description, category, targetDate, year, quarter } = await req.json();

  const { data, error } = await supabase
    .from("goals")
    .insert({
      employee_id: employeeId || session.employeeId,
      title,
      description,
      category,
      target_date: targetDate ? new Date(targetDate).toISOString() : null,
      year: Number(year),
      quarter: Number(quarter),
      created_by: session.id,
    })
    .select("*, employees(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
