import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

function toCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(",")];
  rows.forEach((row) => lines.push(row.map(escape).join(",")));
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "employees";

  let csv = "";
  let filename = "";

  switch (type) {
    case "employees": {
      const { data } = await supabase
        .from("employees")
        .select("name, email, phone, position, status, hire_date, departments(name)")
        .order("name");
      const rows = (data ?? []).map((e: any) => [
        e.name, e.email, e.phone ?? "", e.position ?? "",
        (e.departments as any)?.name ?? "", e.status, e.hire_date ?? "",
      ]);
      csv = toCSV(["Name", "Email", "Phone", "Position", "Department", "Status", "Hire Date"], rows);
      filename = "employees_report.csv";
      break;
    }
    case "leaves": {
      const { data } = await supabase
        .from("leaves")
        .select("type, from_date, to_date, days, status, reason, employees(name)")
        .order("created_at", { ascending: false });
      const rows = (data ?? []).map((l: any) => [
        (l.employees as any)?.name ?? "", l.type, l.from_date, l.to_date,
        String(l.days), l.status, l.reason ?? "",
      ]);
      csv = toCSV(["Employee", "Type", "From", "To", "Days", "Status", "Reason"], rows);
      filename = "leaves_report.csv";
      break;
    }
    case "payroll": {
      const { data } = await supabase
        .from("payroll")
        .select("month, year, basic, allowances, deductions, net, status, employees(name)")
        .order("year", { ascending: false });
      const rows = (data ?? []).map((p: any) => [
        (p.employees as any)?.name ?? "", String(p.month), String(p.year),
        String(p.basic), String(p.allowances), String(p.deductions),
        String(p.net), p.status,
      ]);
      csv = toCSV(["Employee", "Month", "Year", "Basic", "Allowances", "Deductions", "Net", "Status"], rows);
      filename = "payroll_report.csv";
      break;
    }
    case "recruitment": {
      const { data } = await supabase
        .from("candidates")
        .select("name, email, phone, stage, applied_at, rating, jobs(title)")
        .order("applied_at", { ascending: false });
      const rows = (data ?? []).map((c: any) => [
        c.name, c.email, c.phone ?? "", (c.jobs as any)?.title ?? "",
        c.stage, c.applied_at ?? "", String(c.rating ?? ""),
      ]);
      csv = toCSV(["Name", "Email", "Phone", "Job", "Stage", "Applied", "Rating"], rows);
      filename = "recruitment_report.csv";
      break;
    }
    default:
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
