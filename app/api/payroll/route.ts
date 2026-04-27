import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  let query = supabase
    .from("payroll")
    .select("*, employees(id, name, position)")
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: false });

  if (session.role === "employee" && session.employeeId) {
    query = query.eq("employee_id", session.employeeId);
  }

  const { data: payrolls, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ payrolls });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { employeeId, month, year, basic, allowances, deductions } = body;
  const net = Number(basic) + (Number(allowances) || 0) - (Number(deductions) || 0);

  const { data, error } = await supabase
    .from("payroll")
    .insert({
      employee_id: employeeId,
      month: Number(month),
      year: Number(year),
      basic: Number(basic),
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      net,
      status: "draft",
    })
    .select("*, employees(id, name, position)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
