import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { RunPayrollWizard, type EmployeeForRun } from "@/components/shared/RunPayrollWizard";
import { suggestMonthlyTDS, suggestMonthlyPF } from "@/lib/tax/india";

type RawEmployee = {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
  status: string;
  salary: number | null;
  basic_salary: number | null;
  pf_applicable: boolean;
  hire_date: string | null;
};

async function loadEmployeesForRun(month: number, year: number): Promise<{
  rows: EmployeeForRun[];
  alreadyPaidIds: Set<string>;
}> {
  const { data } = await supabase
    .from("employees")
    .select("id, name, email, position, status, salary, basic_salary, pf_applicable, hire_date")
    .neq("status", "terminated")
    .order("name", { ascending: true });

  const employees = (data ?? []) as RawEmployee[];

  // Find already-paid employees for selected period
  const { data: existingPayroll } = await supabase
    .from("payroll")
    .select("employee_id")
    .eq("month", month)
    .eq("year", year);

  const alreadyPaidIds = new Set(
    (existingPayroll ?? []).map((p: { employee_id: string }) => p.employee_id)
  );

  // Previous month earnings for "change %" calculation
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const { data: prevPayroll } = await supabase
    .from("payroll")
    .select("employee_id, basic, allowances, reimbursement, benefits")
    .eq("month", prevMonth)
    .eq("year", prevYear);

  const prevEarningsMap = new Map<string, number>();
  for (const p of (prevPayroll ?? []) as {
    employee_id: string;
    basic: number | null;
    allowances: number | null;
    reimbursement: number | null;
    benefits: number | null;
  }[]) {
    prevEarningsMap.set(
      p.employee_id,
      Number(p.basic ?? 0) + Number(p.allowances ?? 0) + Number(p.reimbursement ?? 0) + Number(p.benefits ?? 0)
    );
  }

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const rows: EmployeeForRun[] = employees.map((e) => {
    const totalSalary = Number(e.salary ?? 0);
    const basic =
      Number(e.basic_salary ?? 0) > 0
        ? Number(e.basic_salary)
        : Math.round(totalSalary * 0.5);
    const allowances = Math.max(0, totalSalary - basic);
    const monthlyGross = basic + allowances;
    const suggestedTax = suggestMonthlyTDS(monthlyGross);
    const pf = e.pf_applicable && basic > 0 ? suggestMonthlyPF(basic) : 0;
    const isNew = e.hire_date
      ? new Date(e.hire_date + "T00:00:00") >= thirtyDaysAgo
      : false;

    return {
      id: e.id,
      employeeCode: e.id.slice(0, 4).toUpperCase(),
      name: e.name,
      email: e.email,
      position: e.position,
      status: e.status,
      isNew,
      isExit: e.status === "terminated",
      defaults: {
        basic,
        allowances,
        reimbursement: 0,
        benefits: 0,
        tax: suggestedTax,
        deductions: pf,
        postTaxDeductions: 0,
        paymentMethod: "direct_deposit",
      },
      prevEarnings: prevEarningsMap.get(e.id) ?? null,
      alreadyPaid: alreadyPaidIds.has(e.id),
    };
  });

  return { rows, alreadyPaidIds };
}

export default async function RunPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));
  const year = parseInt(sp.year ?? String(now.getFullYear()));

  const session = await getSession();
  const { rows } = await loadEmployeesForRun(month, year);

  const lastDayOfMonth = new Date(year, month, 0).toISOString().slice(0, 10);

  return (
    <RunPayrollWizard
      employees={rows}
      month={month}
      year={year}
      defaultPayDay={lastDayOfMonth}
      runByName={session?.name ?? "HR"}
    />
  );
}
