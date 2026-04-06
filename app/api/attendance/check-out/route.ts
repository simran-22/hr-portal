import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session || !session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const { data: record, error: fetchError } = await supabase
    .from("attendance")
    .select("*")
    .eq("employee_id", session.employeeId)
    .eq("date", todayStr)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  if (!record?.check_in) {
    return NextResponse.json({ error: "Not checked in yet" }, { status: 400 });
  }
  if (record.check_out) {
    return NextResponse.json({ error: "Already checked out" }, { status: 400 });
  }

  const checkOut = new Date();
  const hours = (checkOut.getTime() - new Date(record.check_in).getTime()) / 3600000;
  const hoursWorked = Math.round(hours * 100) / 100;
  const status = hours >= 4 ? "present" : "half_day";

  const { data, error } = await supabase
    .from("attendance")
    .update({ check_out: checkOut.toISOString(), hours_worked: hoursWorked, status })
    .eq("id", record.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
