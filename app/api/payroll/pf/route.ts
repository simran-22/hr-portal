import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

const EPS_CEILING = 15000;
const EMPLOYEE_RATE = 0.12;
const EPS_RATE = 0.0833;

type Row = {
  id: string;
  name: string;
  uan: string | null;
  pfNumber: string | null;
  department: string | null;
  basic: number;
  employeePF: number;
  epsContribution: number;
  epfContribution: number;
  employerTotal: number;
  grandTotal: number;
};

function calculatePF(basic: number) {
  const employeePF = Math.round(basic * EMPLOYEE_RATE * 100) / 100;
  const epsContribution = Math.round(Math.min(basic, EPS_CEILING) * EPS_RATE * 100) / 100;
  const employerTotal = Math.round(basic * EMPLOYEE_RATE * 100) / 100;
  const epfContribution = Math.round((employerTotal - epsContribution) * 100) / 100;
  const grandTotal = Math.round((employeePF + employerTotal) * 100) / 100;
  return { employeePF, epsContribution, epfContribution, employerTotal, grandTotal };
}

async function buildReport(month: number, year: number) {
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, name, uan, pf_number, basic_salary, pf_applicable, status, departments(name)")
    .eq("pf_applicable", true)
    .neq("status", "terminated")
    .not("basic_salary", "is", null);

  if (error) throw new Error(error.message);

  type EmpRow = {
    id: string;
    name: string;
    uan: string | null;
    pf_number: string | null;
    basic_salary: number | null;
    departments: { name: string } | null;
  };

  const rows: Row[] = ((employees ?? []) as unknown as EmpRow[])
    .filter((e) => e.basic_salary != null && Number(e.basic_salary) > 0)
    .map((e) => {
      const basic = Number(e.basic_salary);
      const calc = calculatePF(basic);
      return {
        id: e.id,
        name: e.name,
        uan: e.uan,
        pfNumber: e.pf_number,
        department: e.departments?.name ?? null,
        basic,
        ...calc,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const totals = rows.reduce(
    (acc, r) => ({
      basic: acc.basic + r.basic,
      employeePF: acc.employeePF + r.employeePF,
      epsContribution: acc.epsContribution + r.epsContribution,
      epfContribution: acc.epfContribution + r.epfContribution,
      employerTotal: acc.employerTotal + r.employerTotal,
      grandTotal: acc.grandTotal + r.grandTotal,
    }),
    { basic: 0, employeePF: 0, epsContribution: 0, epfContribution: 0, employerTotal: 0, grandTotal: 0 }
  );

  const round = (n: number) => Math.round(n * 100) / 100;
  const deadline = new Date(year, month, 15);

  return {
    month,
    year,
    monthLabel: new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    deadline: deadline.toISOString().slice(0, 10),
    rows,
    totals: {
      basic: round(totals.basic),
      employeePF: round(totals.employeePF),
      epsContribution: round(totals.epsContribution),
      epfContribution: round(totals.epfContribution),
      employerTotal: round(totals.employerTotal),
      grandTotal: round(totals.grandTotal),
    },
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !["admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const today = new Date();
  const month = Number(req.nextUrl.searchParams.get("month") ?? today.getMonth() + 1);
  const year = Number(req.nextUrl.searchParams.get("year") ?? today.getFullYear());
  const format = req.nextUrl.searchParams.get("format");

  const report = await buildReport(month, year);

  if (format === "csv") {
    const header = [
      "Employee",
      "Department",
      "UAN",
      "PF Number",
      "Basic Salary",
      "Employee PF (12%)",
      "EPS (8.33%)",
      "EPF (3.67%)",
      "Employer Total",
      "Grand Total",
    ];
    const lines = [header.join(",")];
    for (const r of report.rows) {
      lines.push(
        [
          JSON.stringify(r.name),
          JSON.stringify(r.department ?? ""),
          r.uan ?? "",
          JSON.stringify(r.pfNumber ?? ""),
          r.basic.toFixed(2),
          r.employeePF.toFixed(2),
          r.epsContribution.toFixed(2),
          r.epfContribution.toFixed(2),
          r.employerTotal.toFixed(2),
          r.grandTotal.toFixed(2),
        ].join(",")
      );
    }
    lines.push(
      [
        "TOTAL",
        "",
        "",
        "",
        report.totals.basic.toFixed(2),
        report.totals.employeePF.toFixed(2),
        report.totals.epsContribution.toFixed(2),
        report.totals.epfContribution.toFixed(2),
        report.totals.employerTotal.toFixed(2),
        report.totals.grandTotal.toFixed(2),
      ].join(",")
    );
    const csv = lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pf-report-${year}-${String(month).padStart(2, "0")}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
