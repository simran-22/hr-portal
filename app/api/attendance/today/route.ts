import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ record: null });

  let employeeId = session.employeeId ?? null;
  if (!employeeId && session.email) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("email", session.email)
      .maybeSingle();
    employeeId = emp?.id ?? null;
  }
  if (!employeeId) return NextResponse.json({ record: null });

  const todayStr = new Date().toISOString().split("T")[0];

  const { data: record, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", todayStr)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record });
}
