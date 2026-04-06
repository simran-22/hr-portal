import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("appraisals")
    .select("*, employees(id, name)")
    .order("created_at", { ascending: false });

  if (session.role === "employee" && session.employeeId) {
    query = query.eq("employee_id", session.employeeId);
  }

  const { data: appraisals, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ appraisals });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "hr", "manager"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const {
    employeeId, year, quarter,
    ratingPerformance, ratingCommunication, ratingLeadership, ratingTeamwork,
    managerComments,
  } = body;

  const scores = [ratingPerformance, ratingCommunication, ratingLeadership, ratingTeamwork].map(Number);
  const overallRating = scores.reduce((s, r) => s + r, 0) / scores.length;

  // Find reviewer's employee record
  const { data: reviewer, error: reviewerError } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", session.id)
    .maybeSingle();

  if (reviewerError || !reviewer) {
    return NextResponse.json({ error: "Reviewer employee record not found" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appraisals")
    .insert({
      employee_id: employeeId,
      reviewer_id: reviewer.id,
      year: Number(year),
      quarter: Number(quarter),
      rating_performance: Number(ratingPerformance),
      rating_communication: Number(ratingCommunication),
      rating_leadership: Number(ratingLeadership),
      rating_teamwork: Number(ratingTeamwork),
      overall_rating: overallRating,
      manager_comments: managerComments,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select("*, employees(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
