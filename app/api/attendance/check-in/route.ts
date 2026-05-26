import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve employeeId — fall back to email lookup
  let employeeId = session.employeeId ?? null;
  if (!employeeId && session.email) {
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("email", session.email)
      .maybeSingle();
    employeeId = emp?.id ?? null;
  }
  if (!employeeId) {
    return NextResponse.json(
      { error: "Your user account isn't linked to an employee record. Ask HR to add you to the employees list." },
      { status: 400 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const { data: existing, error: fetchError } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("date", todayStr)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  if (existing?.check_in) {
    return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
  }

  const now = new Date().toISOString();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("attendance")
      .update({ check_in: now })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from("attendance")
      .insert({
        employee_id: employeeId,
        date: todayStr,
        check_in: now,
        status: "present",
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json(result);
}
