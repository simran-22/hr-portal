import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, name, position, hire_date, probation_end_date, departments(name)")
    .eq("status", "probation")
    .not("probation_end_date", "is", null)
    .order("probation_end_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employees });
}
