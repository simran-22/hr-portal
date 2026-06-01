import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "@/components/shared/PrintButton";
import { computeMonthlyIncentive } from "@/lib/incentives";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// TODO: move these to settings table when company config is added
const COMPANY = {
  name: "INTERSERVE SOLUTIONS PRIVATE LIMITED",
  address: "F382, INDUSTRIAL AREA, PHASE-8B, MOHALI, PUNJAB-160062",
};

type PayslipData = {
  id: string;
  month: number;
  year: number;
  basic: number | null;
  allowances: number | null;
  deductions: number | null;
  tax: number | null;
  reimbursement: number | null;
  benefits: number | null;
  post_tax_deductions: number | null;
  payment_method: string | null;
  pay_day: string | null;
  net: number | null;
  status: string;
  created_at: string;
  employees: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    position: string | null;
    hire_date: string | null;
    basic_salary: number | null;
    uan: string | null;
    pf_number: string | null;
    pf_applicable: boolean;
    departments: { name: string } | null;
  } | null;
};

async function getPayslip(id: string) {
  const { data } = await supabase
    .from("payroll")
    .select(
      "id, month, year, basic, allowances, deductions, tax, reimbursement, benefits, post_tax_deductions, payment_method, pay_day, net, status, created_at, employees(id, name, email, phone, position, hire_date, basic_salary, uan, pf_number, pf_applicable, departments(name))"
    )
    .eq("id", id)
    .single();
  return data as unknown as PayslipData | null;
}

const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtOrDash = (n: number) => (n > 0 ? fmt(n) : "-");

// Count working days in month (excluding Sat/Sun) — simple approximation
function workingDaysInMonth(year: number, month: number): number {
  const last = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= last; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function numberToWords(num: number): string {
  if (!num || num < 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const n = Math.floor(num);
  if (n === 0) return "Zero";
  const inWords = (x: number): string => {
    if (x === 0) return "";
    if (x < 20) return ones[x];
    if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "");
    if (x < 1000) return ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + inWords(x % 100) : "");
    if (x < 100000) return inWords(Math.floor(x / 1000)) + " Thousand" + (x % 1000 ? " " + inWords(x % 1000) : "");
    if (x < 10000000) return inWords(Math.floor(x / 100000)) + " Lakh" + (x % 100000 ? " " + inWords(x % 100000) : "");
    return inWords(Math.floor(x / 10000000)) + " Crore" + (x % 10000000 ? " " + inWords(x % 10000000) : "");
  };
  return inWords(n);
}

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const payslip = await getPayslip(id);
  if (!payslip || !payslip.employees) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Payslip not found</h2>
        <Link href="/payroll" className="text-violet-600 hover:underline text-sm mt-2 inline-block">
          ← Back to Payroll
        </Link>
      </div>
    );
  }

  if (session.role === "employee" && session.employeeId !== payslip.employees.id) {
    redirect("/payroll");
  }

  const basic = Number(payslip.basic ?? 0);
  const allowancesTotal = Number(payslip.allowances ?? 0);
  const reimbursement = Number(payslip.reimbursement ?? 0);
  const benefitsAmt = Number(payslip.benefits ?? 0);
  const tax = Number(payslip.tax ?? 0);
  const preTaxDeductions = Number(payslip.deductions ?? 0);
  const postTaxDeductions = Number(payslip.post_tax_deductions ?? 0);

  // Morning-shift incentive for this employee + month
  const morningShift = await computeMonthlyIncentive(payslip.employees.id, {
    year: payslip.year,
    month: payslip.month,
  });

  // PF (12% of employee basic_salary if applicable)
  const epf = payslip.employees.pf_applicable && payslip.employees.basic_salary
    ? Math.round(Number(payslip.employees.basic_salary) * 0.12 * 100) / 100
    : 0;

  // Map to traditional payslip categories
  // Allowances split — we only store one "allowances" field. Until we add HRA/Conveyance columns,
  // show single line "OTHER ALLOWANCE" and keep HRA/Conveyance/Variable Allowance rows showing 0.
  const earnings = {
    basic,
    hra: 0,                              // placeholder — add column to split
    conveyance: 0,                       // placeholder
    otherAllowance: allowancesTotal + reimbursement,
    variableAllowance: benefitsAmt,
    morningShiftIncentive: morningShift.amount,
    specialBonus: 0,                     // placeholder
  };
  const grossEarnings =
    earnings.basic + earnings.hra + earnings.conveyance + earnings.otherAllowance +
    earnings.variableAllowance + earnings.morningShiftIncentive + earnings.specialBonus;

  const otherDeductions = Math.max(0, preTaxDeductions + postTaxDeductions - epf);
  const deds = {
    esi: 0,                              // placeholder
    epf,
    professionalTax: 0,                  // placeholder
    tds: tax,
    penal: 0,                            // placeholder
    other: otherDeductions,
  };
  const grossDeductions = deds.esi + deds.epf + deds.professionalTax + deds.tds + deds.penal + deds.other;

  const netTransfer = grossEarnings - grossDeductions;
  const workingDays = workingDaysInMonth(payslip.year, payslip.month);

  // Employee ID — use last 5 chars of UUID as a short identifier
  const empCode = `IN${payslip.employees.id.slice(0, 3).toUpperCase()}`;

  const doj = payslip.employees.hire_date
    ? new Date(payslip.employees.hire_date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
    : "—";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toolbar — hidden when printing */}
      <div className="flex items-center justify-between mb-5 print:hidden">
        <Link
          href="/payroll"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-violet-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Payroll
        </Link>
        <PrintButton />
      </div>

      {/* Payslip document — bordered table style */}
      <div className="bg-white text-slate-900 border-2 border-slate-900 print:border-black">
        {/* Header */}
        <div className="border-b-2 border-slate-900 p-4 text-center">
          <h1 className="text-lg font-bold tracking-wide">{COMPANY.name}</h1>
          <p className="text-xs font-semibold mt-1 tracking-wide">{COMPANY.address}</p>
          <p className="text-xs italic mt-1">
            Pay Slip for the Month of {MONTHS[payslip.month - 1]}, {payslip.year}
          </p>
        </div>

        {/* Employee info */}
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="border-b border-slate-900 px-3 py-2 font-bold w-[170px]">Employee Name</td>
              <td className="border-b border-r border-slate-900 px-3 py-2 w-[230px]">: {payslip.employees.name}</td>
              <td className="border-b border-slate-900 px-3 py-2 font-bold w-[180px]">DOJ</td>
              <td className="border-b border-slate-900 px-3 py-2">: {doj}</td>
            </tr>
            <tr>
              <td className="border-b border-slate-900 px-3 py-2 font-bold">Employee ID</td>
              <td className="border-b border-r border-slate-900 px-3 py-2">: {empCode}</td>
              <td className="border-b border-slate-900 px-3 py-2 font-bold">Effective Working days</td>
              <td className="border-b border-slate-900 px-3 py-2">: {workingDays}</td>
            </tr>
            <tr>
              <td className="border-b border-slate-900 px-3 py-2 font-bold">Designation</td>
              <td className="border-b border-r border-slate-900 px-3 py-2">: {payslip.employees.position ?? "—"}</td>
              <td rowSpan={2} className="border-b border-slate-900 px-3 py-2 font-bold align-top">Bank Name &amp; IFSC<br /><br />Bank Account number</td>
              <td rowSpan={2} className="border-b border-slate-900 px-3 py-2 align-top">: —<br /><br />: —</td>
            </tr>
            <tr>
              <td className="border-b border-slate-900 px-3 py-2 font-bold">Department</td>
              <td className="border-b border-r border-slate-900 px-3 py-2">: {payslip.employees.departments?.name ?? "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* Earnings + Deductions */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-b border-r border-slate-900 px-3 py-2 text-left font-bold uppercase w-[35%]">EARNINGS</th>
              <th className="border-b border-r border-slate-900 px-3 py-2 text-left font-bold uppercase w-[15%]">AMOUNT</th>
              <th className="border-b border-r border-slate-900 px-3 py-2 text-left font-bold uppercase w-[35%]">DEDUCTIONS</th>
              <th className="border-b border-slate-900 px-3 py-2 text-left font-bold uppercase">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {[
              { e: "BASIC",                    eA: earnings.basic,                  d: "ESI",                            dA: deds.esi },
              { e: "HRA",                      eA: earnings.hra,                    d: "EPF",                            dA: deds.epf },
              { e: "CONVEYANCE",               eA: earnings.conveyance,             d: "Deduction for Professional Tax", dA: deds.professionalTax },
              { e: "OTHER ALLOWANCE",          eA: earnings.otherAllowance,         d: "TDS",                            dA: deds.tds },
              { e: "VARIABLE ALLOWANCE",       eA: earnings.variableAllowance,      d: "Penal Deductions",               dA: deds.penal },
              {
                e: morningShift.days > 0
                  ? `MORNING SHIFT INCENTIVE (${morningShift.days} day${morningShift.days !== 1 ? "s" : ""} × ₹${morningShift.rate})`
                  : "MORNING SHIFT INCENTIVE",
                eA: earnings.morningShiftIncentive,
                d:  "Other Deductions",
                dA: deds.other,
              },
              { e: "SPECIAL BONUS",            eA: earnings.specialBonus,           d: "",                               dA: 0 },
            ].map((row, i) => (
              <tr key={i}>
                <td className="border-r border-slate-900 px-3 py-1.5">{row.e}</td>
                <td className="border-r border-slate-900 px-3 py-1.5 tabular-nums">{fmtOrDash(row.eA)}</td>
                <td className="border-r border-slate-900 px-3 py-1.5">{row.d}</td>
                <td className="px-3 py-1.5 tabular-nums">{fmtOrDash(row.dA)}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td className="border-t-2 border-r border-slate-900 px-3 py-2">Gross Earnings</td>
              <td className="border-t-2 border-r border-slate-900 px-3 py-2 tabular-nums">{fmt(grossEarnings)}</td>
              <td className="border-t-2 border-r border-slate-900 px-3 py-2">Gross Deductions</td>
              <td className="border-t-2 border-slate-900 px-3 py-2 tabular-nums">{fmt(grossDeductions)}</td>
            </tr>
          </tbody>
        </table>

        {/* Net Transfer + words */}
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="border-r border-slate-900 px-3 py-2 font-bold w-[170px] align-top">NET TRANSFER :</td>
              <td className="px-3 py-2 font-bold text-base">₹ {fmt(netTransfer)}</td>
            </tr>
            <tr>
              <td className="border-t border-r border-slate-900 px-3 py-2 font-bold align-top">IN WORDS :</td>
              <td className="border-t border-slate-900 px-3 py-2 font-semibold uppercase">
                {numberToWords(netTransfer)} Only.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <p className="text-[10px] text-slate-400 mt-3 text-center print:hidden">
        Computer-generated payslip · Generated on {new Date(payslip.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}
