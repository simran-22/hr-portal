"use server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateLeaveStatus(id: string, status: "approved" | "rejected") {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  // Load the leave with the requester's employee_id
  const { data: leave } = await supabase
    .from("leaves")
    .select("id, employee_id, employees(reports_to)")
    .eq("id", id)
    .single();

  if (!leave) return { error: "Leave not found" };

  const isAdmin = session.role === "admin";
  const empRel = (leave as unknown as { employees: { reports_to: string | null } | null }).employees;
  const isDirectManager = !!session.employeeId && empRel?.reports_to === session.employeeId;

  if (!isAdmin && !isDirectManager) {
    return { error: "You don't have permission to approve this leave." };
  }

  await supabase
    .from("leaves")
    .update({
      status,
      approved_by: session.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/leaves");
  revalidatePath("/dashboard");
  return { success: true };
}
