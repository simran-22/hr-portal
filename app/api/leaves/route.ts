import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { differenceInBusinessDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "all";

  let query = supabase
    .from("leaves")
    .select("*, employees(id, name, employee_id)")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }
  if (session.role === "employee" && session.employeeId) {
    query = query.eq("employee_id", session.employeeId);
  }

  const { data: leaves, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ leaves });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, fromDate, toDate, reason } = await req.json();

  const from = new Date(fromDate);
  const to = new Date(toDate);
  const days = Math.max(1, differenceInBusinessDays(to, from) + 1);

  const { data, error } = await supabase
    .from("leaves")
    .insert({
      employee_id: session.employeeId,
      type,
      from_date: from.toISOString(),
      to_date: to.toISOString(),
      days,
      reason,
    })
    .select("*, employees(id, name, employee_id)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
