import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0 });

  const isAdmin = session.role === "admin";

  // Resolve employeeId — fall back to email lookup
  let myEmployeeId = session.employeeId ?? null;
  if (!myEmployeeId && session.email) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("email", session.email)
      .maybeSingle();
    myEmployeeId = emp?.id ?? null;
  }

  // Admin sees all pending
  if (isAdmin) {
    const { count } = await supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    return NextResponse.json({ count: count ?? 0 });
  }

  // Manager sees pending from direct reports
  if (!myEmployeeId) return NextResponse.json({ count: 0 });

  const { data: reports } = await supabase
    .from("employees")
    .select("id")
    .eq("reports_to", myEmployeeId);
  const ids = (reports ?? []).map((r) => r.id);

  if (ids.length === 0) return NextResponse.json({ count: 0 });

  const { count } = await supabase
    .from("leaves")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .in("employee_id", ids);

  return NextResponse.json({ count: count ?? 0 });
}
