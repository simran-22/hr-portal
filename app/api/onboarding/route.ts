import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("onboarding_tasks")
    .select("*, employees(name)")
    .order("due_date", { ascending: true });

  // Employees can only see their own tasks
  if (!["admin", "hr"].includes(session.role)) {
    query = query.eq("employee_id", session.employeeId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by employee
  const grouped: Record<string, { employeeId: string; employeeName: string; tasks: any[] }> = {};
  for (const task of data ?? []) {
    const eid = task.employee_id;
    if (!grouped[eid]) {
      grouped[eid] = {
        employeeId: eid,
        employeeName: (task.employees as any)?.name ?? "Unknown",
        tasks: [],
      };
    }
    grouped[eid].tasks.push(task);
  }

  return NextResponse.json(Object.values(grouped));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "hr"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { employeeId, title, description, assignedTo, dueDate, phase } = await req.json();

  if (!employeeId || !title || !phase) {
    return NextResponse.json({ error: "Employee, title, and phase are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("onboarding_tasks")
    .insert({
      employee_id: employeeId,
      title,
      description: description || null,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      phase,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
