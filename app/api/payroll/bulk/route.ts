import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

type IncomingItem = {
  employeeId: string;
  basic: number;
  allowances: number;
  reimbursement: number;
  benefits: number;
  tax: number;
  deductions: number;
  postTaxDeductions: number;
  paymentMethod: string;
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { month, year, payDay, items } = body as {
    month: number;
    year: number;
    payDay: string | null;
    items: IncomingItem[];
  };

  if (!month || !year || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const n = (v: unknown) => Number(v) || 0;

  // Skip employees who already have payroll for this period
  const employeeIds = items.map((i) => i.employeeId);
  const { data: existing } = await supabase
    .from("payroll")
    .select("employee_id")
    .eq("month", month)
    .eq("year", year)
    .in("employee_id", employeeIds);

  const existingIds = new Set((existing ?? []).map((p: { employee_id: string }) => p.employee_id));
  const newItems = items.filter((i) => !existingIds.has(i.employeeId));

  if (newItems.length === 0) {
    return NextResponse.json(
      { error: "All selected employees already have payroll for this period.", skipped: items.length },
      { status: 409 }
    );
  }

  const rows = newItems.map((i) => {
    const earnings = n(i.basic) + n(i.allowances) + n(i.reimbursement) + n(i.benefits);
    const totalDeductions = n(i.tax) + n(i.deductions) + n(i.postTaxDeductions);
    const net = earnings - totalDeductions;
    return {
      employee_id: i.employeeId,
      month: Number(month),
      year: Number(year),
      basic: n(i.basic),
      allowances: n(i.allowances),
      reimbursement: n(i.reimbursement),
      benefits: n(i.benefits),
      tax: n(i.tax),
      deductions: n(i.deductions),
      post_tax_deductions: n(i.postTaxDeductions),
      payment_method: i.paymentMethod || "direct_deposit",
      pay_day: payDay || null,
      net,
      status: "draft",
    };
  });

  const { data, error } = await supabase.from("payroll").insert(rows).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    created: (data ?? []).length,
    skipped: items.length - newItems.length,
  }, { status: 201 });
}
