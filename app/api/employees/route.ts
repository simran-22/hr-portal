import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("employees")
    .select("*, departments(id, name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%,position.ilike.%${search}%`
    );
  }

  const { data: employees, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ employees, total: count });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, phone, position, departmentId, salary, status, hireDate, dateOfBirth, probationEndDate, basicSalary, uan, pfNumber, pfApplicable } = body;

  const { data, error } = await supabase
    .from("employees")
    .insert({
      name,
      email,
      phone,
      position,
      department_id: departmentId || null,
      salary: Number(salary) || 0,
      status,
      hire_date: hireDate || null,
      date_of_birth: dateOfBirth || null,
      probation_end_date: status === "probation" ? (probationEndDate || null) : null,
      basic_salary: basicSalary ? Number(basicSalary) : null,
      uan: uan || null,
      pf_number: pfNumber || null,
      pf_applicable: pfApplicable ?? true,
    })
    .select("*, departments(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data, { status: 201 });
}
