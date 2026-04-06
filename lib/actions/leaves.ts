"use server";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updateLeaveStatus(id: string, status: "approved" | "rejected") {
  await supabase.from("leaves").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/leaves");
}
