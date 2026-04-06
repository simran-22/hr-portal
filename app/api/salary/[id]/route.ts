import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabase
    .from("salary_structures")
    .select("*, employees(id, name)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "hr"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const {
    basic, hra, da, conveyance, medical,
    other_allowances, pf_deduction, tax_deduction, other_deductions, effective_date, reason,
  } = body;

  // Get current salary to create revision record
  const { data: current } = await supabase
    .from("salary_structures")
    .select("*")
    .eq("id", id)
    .single();

  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const gross = (Number(basic) || 0) + (Number(hra) || 0) + (Number(da) || 0) +
    (Number(conveyance) || 0) + (Number(medical) || 0) + (Number(other_allowances) || 0);
  const net = gross - (Number(pf_deduction) || 0) - (Number(tax_deduction) || 0) - (Number(other_deductions) || 0);

  // Create salary revision record
  await supabase.from("salary_revisions").insert({
    employee_id: current.employee_id,
    old_ctc: current.gross,
    new_ctc: gross,
    revision_date: new Date().toISOString().split("T")[0],
    reason: reason || "Salary revision",
    approved_by: session.id,
  });

  // Update salary structure
  const { data, error } = await supabase
    .from("salary_structures")
    .update({
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
      effective_date: effective_date || current.effective_date,
    })
    .eq("id", id)
    .select("*, employees(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
