import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: departments, error } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach employee count for each department
  const withCounts = await Promise.all(
    (departments ?? []).map(async (dept) => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("department_id", dept.id);
      return { ...dept, _count: { employees: count ?? 0 } };
    })
  );

  return NextResponse.json(withCounts);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, description } = await req.json();

  const { data, error } = await supabase
    .from("departments")
    .insert({ name, description: description || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
