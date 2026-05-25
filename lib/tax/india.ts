/**
 * Indian Income Tax — Old Regime (FY 2024-25 / AY 2025-26)
 *
 * Slabs:
 *   0 – ₹2,50,000          → 0%
 *   ₹2,50,001 – ₹5,00,000  → 5%
 *   ₹5,00,001 – ₹10,00,000 → 20%
 *   ₹10,00,000+            → 30%
 *
 * Standard deduction: ₹50,000 (salaried)
 * Section 87A rebate : full tax rebate if taxable income ≤ ₹5,00,000
 * Health & Education Cess: 4% on total tax
 */

const STANDARD_DEDUCTION = 50000;
const REBATE_LIMIT = 500000;
const CESS_RATE = 0.04;

const SLABS = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 },
];

export function calculateAnnualTax(annualGross: number, opts: { applyStandardDeduction?: boolean } = {}): {
  taxableIncome: number;
  baseTax: number;
  rebate: number;
  taxAfterRebate: number;
  cess: number;
  totalTax: number;
} {
  const applySD = opts.applyStandardDeduction ?? true;
  const taxableIncome = Math.max(0, annualGross - (applySD ? STANDARD_DEDUCTION : 0));

  let baseTax = 0;
  let remaining = taxableIncome;
  let lastSlab = 0;

  for (const slab of SLABS) {
    const slabSize = slab.upTo - lastSlab;
    const taxedInThisSlab = Math.min(remaining, slabSize);
    if (taxedInThisSlab > 0) {
      baseTax += taxedInThisSlab * slab.rate;
      remaining -= taxedInThisSlab;
    }
    lastSlab = slab.upTo;
    if (remaining <= 0) break;
  }

  // Section 87A rebate — full waive if taxable income ≤ 5L
  const rebate = taxableIncome <= REBATE_LIMIT ? baseTax : 0;
  const taxAfterRebate = baseTax - rebate;
  const cess = taxAfterRebate * CESS_RATE;
  const totalTax = taxAfterRebate + cess;

  return {
    taxableIncome: Math.round(taxableIncome),
    baseTax: Math.round(baseTax),
    rebate: Math.round(rebate),
    taxAfterRebate: Math.round(taxAfterRebate),
    cess: Math.round(cess * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
  };
}

/**
 * Suggest monthly TDS based on an employee's monthly gross salary.
 * Annualises the gross, computes annual tax, divides by 12.
 */
export function suggestMonthlyTDS(monthlyGross: number): number {
  if (!monthlyGross || monthlyGross <= 0) return 0;
  const annualGross = monthlyGross * 12;
  const { totalTax } = calculateAnnualTax(annualGross);
  return Math.round((totalTax / 12) * 100) / 100;
}

/**
 * Suggest monthly PF (employee share) — 12% of basic.
 */
export function suggestMonthlyPF(basicSalary: number): number {
  if (!basicSalary || basicSalary <= 0) return 0;
  return Math.round(basicSalary * 0.12 * 100) / 100;
}

export const PAYMENT_METHODS = [
  { value: "direct_deposit", label: "Direct Deposit" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
] as const;
