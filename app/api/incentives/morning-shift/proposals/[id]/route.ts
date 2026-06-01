import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

type ProposalRow = {
  id: string;
  employee_id: string;
  proposed_rate: number | string;
  proposed_by: string;
  status: string;
};

async function loadProposal(id: string): Promise<ProposalRow | null> {
  const { data, error } = await supabase
    .from("morning_shift_rate_proposals")
    .select("id, employee_id, proposed_rate, proposed_by, status")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as ProposalRow;
}

// PATCH: admin approves or rejects.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only HR can approve or reject proposals" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = (body as { action?: string }).action;
  const note = (body as { note?: string }).note;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const proposal = await loadProposal(id);
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (proposal.status !== "pending") {
    return NextResponse.json({ error: `Proposal is already ${proposal.status}` }, { status: 409 });
  }

  const reviewedAt = new Date().toISOString();
  const nextStatus = action === "approve" ? "approved" : "rejected";

  const { error: updateErr } = await supabase
    .from("morning_shift_rate_proposals")
    .update({
      status: nextStatus,
      reviewed_by: session.id,
      reviewed_at: reviewedAt,
      note: note?.trim() ? note.trim() : undefined,
    })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

  if (action === "approve") {
    const { error: rateErr } = await supabase
      .from("employees")
      .update({ morning_shift_rate: Number(proposal.proposed_rate) || 0 })
      .eq("id", proposal.employee_id);
    if (rateErr) return NextResponse.json({ error: rateErr.message }, { status: 400 });
  }

  return NextResponse.json({ id, status: nextStatus, reviewedAt });
}

// DELETE: HR-only. (Dormant — proposal flow was deprecated in favor of HR direct edit.)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const proposal = await loadProposal(id);
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (proposal.status !== "pending") {
    return NextResponse.json({ error: "Only pending proposals can be withdrawn" }, { status: 409 });
  }

  const { error } = await supabase
    .from("morning_shift_rate_proposals")
    .update({
      status: "withdrawn",
      reviewed_by: session.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id, status: "withdrawn" });
}
