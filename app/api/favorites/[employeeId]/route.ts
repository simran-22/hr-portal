import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function DELETE(_: Request, { params }: { params: Promise<{ employeeId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { employeeId } = await params;

  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("profile_id", session.id)
    .eq("employee_id", employeeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
