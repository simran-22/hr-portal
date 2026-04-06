import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("salary_structures")
    .select("*, employees(id, name)")
    .order("created_at", { ascending: false });

  // Employees can only see their own salary
  if (!["admin", "hr"].includes(session.role) && session.employeeId) {
    query = query.eq("employee_id", session.employeeId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "hr"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const {
    employeeId, basic, hra, da, conveyance, medical,
    other_allowances, pf_deduction, tax_deduction, other_deductions, effective_date,
  } = body;

  const gross = (Number(basic) || 0) + (Number(hra) || 0) + (Number(da) || 0) +
    (Number(conveyance) || 0) + (Number(medical) || 0) + (Number(other_allowances) || 0);
  const net = gross - (Number(pf_deduction) || 0) - (Number(tax_deduction) || 0) - (Number(other_deductions) || 0);

  const { data, error } = await supabase
    .from("salary_structures")
    .insert({
      employee_id: employeeId,
      basic: Number(basic) || 0,
      hra: Number(hra) || 0,
      da: Number(da) || 0,
      conveyance: Number(conveyance) || 0,
      medical: Number(medical) || 0,
      other_allowances: Number(other_allowances) || 0,
      gross,
      pf_deduction: Number(pf_deduction) || 0,
      tax_deduction: Number(tax_deduction) || 0,
      other_deductions: Number(other_deductions) || 0,
      net,
      effective_date,
    })
    .select("*, employees(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
