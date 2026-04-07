import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("announcements")
    .select("*, departments(id, name)")
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { title, content, scope, departmentId, expiresAt } = await req.json();

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title,
      content,
      scope: scope || "company",
      department_id: departmentId || null,
      expires_at: expiresAt || null,
      published_at: new Date().toISOString(),
      created_by: session.id,
    })
    .select("*, departments(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
