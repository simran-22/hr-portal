import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || !session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = new Date().getFullYear();

  const { data: balance, error } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", session.employeeId)
    .eq("year", year)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    balance ?? { annual_total: 21, annual_used: 0, sick_total: 14, sick_used: 0 }
  );
}
