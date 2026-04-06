import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || !session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: balance, error } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", session.employeeId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    balance ?? { annual: 21, sick: 10, casual: 7, used_annual: 0, used_sick: 0, used_casual: 0 }
  );
}
