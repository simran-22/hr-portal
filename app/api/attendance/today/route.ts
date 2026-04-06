import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || !session.employeeId) {
    return NextResponse.json({ record: null });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const { data: record, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", session.employeeId)
    .eq("date", todayStr)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record });
}
