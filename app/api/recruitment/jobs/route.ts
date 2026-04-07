import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "open";

  let query = supabase
    .from("jobs")
    .select("*, departments(id, name), candidates(id)")
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: jobs, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map candidate count to _count shape for compatibility
  const mapped = (jobs ?? []).map(({ candidates, ...job }) => ({
    ...job,
    _count: { candidates: Array.isArray(candidates) ? candidates.length : 0 },
  }));

  return NextResponse.json({ jobs: mapped });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { title, departmentId, description, requirements, location, type, deadline } = body;

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      title,
      department_id: departmentId || null,
      description,
      requirements,
      location,
      type,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      created_by: session.id,
    })
    .select("*, departments(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ...data, _count: { candidates: 0 } }, { status: 201 });
}
