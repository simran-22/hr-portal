import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0 });

  // HR sees all pending leaves (the sidebar badge).
  if (session.role === "admin") {
    const { count } = await supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    return NextResponse.json({ count: count ?? 0 });
  }

  // Manager and Employee see only their own pending count.
  let myEmployeeId = session.employeeId ?? null;
  if (!myEmployeeId && session.email) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("email", session.email)
      .maybeSingle();
    myEmployeeId = emp?.id ?? null;
  }
  if (!myEmployeeId) return NextResponse.json({ count: 0 });

  const { count } = await supabase
    .from("leaves")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("employee_id", myEmployeeId);

  return NextResponse.json({ count: count ?? 0 });
}
