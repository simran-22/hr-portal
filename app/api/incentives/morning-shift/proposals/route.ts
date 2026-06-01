import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

// Dormant endpoint — the proposal flow was deprecated in favor of HR-only direct edit.
// Kept admin-locked so the table is still writable by HR if the flow is ever revived.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { employeeId, proposedRate, note } = body as {
    employeeId?: string;
    proposedRate?: unknown;
    note?: string;
  };

  if (!employeeId) return NextResponse.json({ error: "employeeId required" }, { status: 400 });
  const rate = Number(proposedRate);
  if (!Number.isFinite(rate) || rate < 0) {
    return NextResponse.json({ error: "proposedRate must be a non-negative number" }, { status: 400 });
  }

  await supabase
    .from("morning_shift_rate_proposals")
    .delete()
    .eq("employee_id", employeeId)
    .eq("status", "pending");

  const { data, error } = await supabase
    .from("morning_shift_rate_proposals")
    .insert({
      employee_id: employeeId,
      proposed_rate: rate,
      proposed_by: session.id,
      status: "pending",
      note: note?.trim() || null,
    })
    .select("id, employee_id, proposed_rate, proposed_by, proposed_at, note")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(
    {
      id: data.id,
      employeeId: data.employee_id,
      proposedRate: Number(data.proposed_rate),
      proposedBy: data.proposed_by,
      proposedAt: data.proposed_at,
      note: data.note,
    },
    { status: 201 }
  );
}
