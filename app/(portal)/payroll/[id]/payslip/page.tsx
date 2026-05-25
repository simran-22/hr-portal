import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "@/components/shared/PrintButton";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusPill = (status: string) => {
  const isPaid = status === "paid";
  const cls = isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
  const label = isPaid ? "PAID" : status === "processing" ? "PROCESSING" : status === "cancelled" ? "CANCELLED" : "PENDING";
  return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${cls}`}>{label}</span>;
};

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

  // Employees can only see their own payslip
  if (session.role === "employee" && session.employeeId !== payslip.employees.id) {
    redirect("/payroll");
  }

  // PF auto-calculation (12% of basic) if applicable
  const employeePF =
    payslip.employees.pf_applicable && payslip.employees.basic_salary
      ? Math.round(Number(payslip.employees.basic_salary) * 0.12 * 100) / 100
      : 0;

  const basic = Number(payslip.basic ?? 0);
  const allowances = Number(payslip.allowances ?? 0);
  const reimbursement = Number(payslip.reimbursement ?? 0);
  const benefits = Number(payslip.benefits ?? 0);
  const tax = Number(payslip.tax ?? 0);
  const preTaxDeductions = Number(payslip.deductions ?? 0);
  const postTaxDeductions = Number(payslip.post_tax_deductions ?? 0);
  // PF treated as deduction (separate from "other deductions" the HR entered)
  const otherPreDeductions = Math.max(0, preTaxDeductions - employeePF);
  const totalEarnings = basic + allowances + reimbursement + benefits;
  const totalDeductions = tax + preTaxDeductions + postTaxDeductions;
  const net = Number(payslip.net ?? 0);

  const paymentMethodLabel: Record<string, string> = {
    direct_deposit: "Direct Deposit",
    cheque: "Cheque",
    cash: "Cash",
    upi: "UPI",
  };

  const payDate = new Date(payslip.year, payslip.month - 1, 1);
  const generatedDate = new Date(payslip.created_at);

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

      {/* Payslip document */}
      <div className="bg-white text-slate-900 rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 text-white px-8 py-6 print:bg-violet-700 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">HR Portal</h1>
              <p className="text-xs opacity-80">Salary Statement</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest opacity-80">Pay Period</p>
            <p className="text-lg font-bold">{MONTHS[payslip.month - 1]} {payslip.year}</p>
            <div className="mt-1">{statusPill(payslip.status)}</div>
          </div>
        </div>

        {/* Employee details */}
        <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Employee</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{payslip.employees.name}</p>
            <p className="text-sm text-slate-600">{payslip.employees.position ?? "—"}</p>
            <p className="text-xs text-slate-500 mt-1">{payslip.employees.email}</p>
          </div>
          <div className="text-sm space-y-1.5">
            {payslip.employees.departments?.name && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-slate-800">{payslip.employees.departments.name}</span>
              </div>
            )}
            {payslip.employees.hire_date && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Date of Joining</span>
                <span className="font-medium text-slate-800">
                  {new Date(payslip.employees.hire_date + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              </div>
            )}
            {payslip.employees.uan && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">UAN</span>
                <span className="font-mono font-medium text-slate-800">{payslip.employees.uan}</span>
              </div>
            )}
            {payslip.employees.pf_number && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">PF Number</span>
                <span className="font-mono font-medium text-slate-800 truncate">{payslip.employees.pf_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Earnings + Deductions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Earnings */}
          <div className="px-8 py-6">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-3">Earnings</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Basic</span>
                <span className="font-medium text-slate-900 tabular-nums">{inr(basic)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Allowances</span>
                <span className="font-medium text-slate-900 tabular-nums">{inr(allowances)}</span>
              </div>
              {reimbursement > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Reimbursement</span>
                  <span className="font-medium text-slate-900 tabular-nums">{inr(reimbursement)}</span>
                </div>
              )}
              {benefits > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Benefits</span>
                  <span className="font-medium text-slate-900 tabular-nums">{inr(benefits)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2.5 mt-2">
                <span className="font-semibold text-slate-700">Total Earnings</span>
                <span className="font-bold text-emerald-700 tabular-nums">{inr(totalEarnings)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="px-8 py-6">
            <p className="text-[10px] uppercase tracking-widest text-red-600 font-bold mb-3">Deductions</p>
            <div className="space-y-2.5 text-sm">
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Income Tax (TDS)</span>
                  <span className="font-medium text-slate-900 tabular-nums">{inr(tax)}</span>
                </div>
              )}
              {employeePF > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">PF (12%)</span>
                  <span className="font-medium text-slate-900 tabular-nums">{inr(employeePF)}</span>
                </div>
              )}
              {otherPreDeductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Other Deductions</span>
                  <span className="font-medium text-slate-900 tabular-nums">{inr(otherPreDeductions)}</span>
                </div>
              )}
              {postTaxDeductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Post-tax Deductions</span>
                  <span className="font-medium text-slate-900 tabular-nums">{inr(postTaxDeductions)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2.5 mt-2">
                <span className="font-semibold text-slate-700">Total Deductions</span>
                <span className="font-bold text-red-600 tabular-nums">{inr(totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Net Pay</p>
            <p className="text-xs text-slate-500 mt-0.5">In words: {numberToWords(net)} Rupees Only</p>
            <p className="text-xs text-slate-500 mt-0.5">
              via <span className="font-medium text-slate-700">{paymentMethodLabel[payslip.payment_method ?? "direct_deposit"] ?? "Direct Deposit"}</span>
              {payslip.pay_day && (
                <span> on {new Date(payslip.pay_day + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
              )}
            </p>
          </div>
          <p className="text-3xl font-bold text-violet-700 tabular-nums">{inr(net)}</p>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 text-center text-xs text-slate-400 border-t border-slate-100">
          <p>This is a computer-generated payslip and does not require a physical signature.</p>
          <p className="mt-0.5">
            Generated on {generatedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            {" • "}Payslip ID: {payslip.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
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
