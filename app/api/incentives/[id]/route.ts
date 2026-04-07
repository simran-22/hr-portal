import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const { status } = await req.json();

  const updateData: Record<string, unknown> = { status };

  if (status === "approved") {
    updateData.approved_by = session.id;
  }

  if (status === "paid") {
    updateData.approved_by = session.id;
    updateData.payout_date = new Date().toISOString().split("T")[0];
  }

  const { data, error } = await supabase
    .from("incentives")
    .update(updateData)
    .eq("id", id)
    .select("*, employees(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
