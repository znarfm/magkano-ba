import { getCpiMultiplier } from './config/psa-cpi';
import { BenefitBreakdown, CareerRecord } from './types';

export interface StatutoryContributions {
  sss: number;
  philHealth: number;
  pagIbig: number;
  total: number;
}

export interface CompensationSummary {
  nominalMonthlyGross: number;
  adjustedMonthlyGross2026: number;
  monthlyNetEquivalent: number;
  annualNetTakeHome: number;
  monthlyTax: number;
  monthlyStatutory: number;
  annualBonus: number;
}

export interface ArbitrageComparison {
  localMonthlyGross: number;
  localMonthlyNetEquivalent: number;
  remoteBreakEvenMonthlyGross: number;
  remoteMonthlyNetEquivalent: number;
  taxDifferenceAnnual: number;
  statutoryDifferenceAnnual: number;
  benefitsAnnualLocal: number;
}

/**
 * Computes monthly statutory deductions for PH Local corporate employee (2026 rates).
 */
export function computeEmployeeStatutory(monthlyGross: number): StatutoryContributions {
  // SSS: 4.5% employee share up to ₱35,000 MSC ceiling
  const sssMsc = Math.max(5000, Math.min(35000, monthlyGross));
  const sss = Math.round(sssMsc * 0.045);

  // PhilHealth: 5% premium split equally (2.5% employee share), capped at ₱100k, floor ₱10k
  const phBase = Math.max(10000, Math.min(100000, monthlyGross));
  const philHealth = Math.round(phBase * 0.025);

  // Pag-IBIG: 2% of basic salary, capped at ₱200/mo
  const pagIbig = Math.min(200, Math.round(monthlyGross * 0.02));

  return {
    sss,
    philHealth,
    pagIbig,
    total: sss + philHealth + pagIbig,
  };
}

/**
 * Computes voluntary statutory contributions for self-employed/contractor.
 */
export function computeContractorStatutory(monthlyGross: number): StatutoryContributions {
  const sssMsc = Math.max(5000, Math.min(35000, monthlyGross));
  // Full 14% self-employed contribution
  const sss = Math.round(sssMsc * 0.14);
  // Full 5% PhilHealth premium
  const phBase = Math.max(10000, Math.min(100000, monthlyGross));
  const philHealth = Math.round(phBase * 0.05);
  // Standard Pag-IBIG
  const pagIbig = 200;

  return {
    sss,
    philHealth,
    pagIbig,
    total: sss + philHealth + pagIbig,
  };
}

/**
 * TRAIN Law Annual Income Tax Brackets (2023-2026).
 */
export function computeTrainAnnualTax(taxableIncome: number): number {
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 400000) {
    return (taxableIncome - 250000) * 0.15;
  }
  if (taxableIncome <= 800000) {
    return 22500 + (taxableIncome - 400000) * 0.20;
  }
  if (taxableIncome <= 2000000) {
    return 102500 + (taxableIncome - 800000) * 0.25;
  }
  if (taxableIncome <= 8000000) {
    return 402500 + (taxableIncome - 2000000) * 0.30;
  }
  return 2202500 + (taxableIncome - 8000000) * 0.35;
}

/**
 * 8% Flat Gross Receipts Tax for Freelancers / Contractors (gross receipts <= ₱3,000,000).
 * If exceeding ₱3,000,000 VAT threshold, falls back to standard graduated TRAIN tax.
 */
export function computeContractorAnnualTax(annualGross: number): number {
  if (annualGross <= 3000000) {
    return Math.max(0, (annualGross - 250000) * 0.08);
  }
  return computeTrainAnnualTax(annualGross);
}

/**
 * Evaluates record or custom compensation input into nominal and 2026 CPI-adjusted net equivalent.
 */
export function computeCompensationView(
  record: Pick<CareerRecord, 'cohortYear' | 'workScope' | 'nominalMonthlyGrossPhp' | 'benefits'>,
  options: { cpiAdjusted: boolean; takeHomeParity: boolean }
): number {
  const baseSalary = record.nominalMonthlyGrossPhp.median;
  const effectiveSalary = options.cpiAdjusted
    ? baseSalary * getCpiMultiplier(record.cohortYear)
    : baseSalary;

  if (!options.takeHomeParity) {
    return effectiveSalary;
  }

  // Monthly net equivalent calculation
  const isRemote =
    record.workScope === 'FOREIGN_REMOTE' || record.workScope === 'LIKELY_REMOTE_INTL';

  if (isRemote) {
    const annualGross = effectiveSalary * 12;
    const annualTax = computeContractorAnnualTax(annualGross);
    const statutory = computeContractorStatutory(effectiveSalary);
    const annualNet = annualGross - annualTax - (statutory.total * 12);
    return Math.max(0, annualNet / 12);
  }

  // Local PH
  const benefits = record.benefits ?? {
    guaranteedMonths: 13,
    monthlyAllowancePhp: 0,
    hmoCoveragePhp: null,
    vacationLeaveDays: null,
    rawBenefitsSummary: null,
  };

  const guaranteedMonths = Math.max(12, benefits.guaranteedMonths || 13);
  const bonusMonths = guaranteedMonths - 12;
  const bonusPay = bonusMonths * effectiveSalary;

  const statutory = computeEmployeeStatutory(effectiveSalary);
  const annualStatutory = statutory.total * 12;

  // ₱90k tax exempt threshold for 13th month / bonuses
  const taxableBonus = Math.max(0, bonusPay - 90000);
  const annualTaxable = Math.max(0, (12 * (effectiveSalary - statutory.total)) + taxableBonus);
  const annualTax = computeTrainAnnualTax(annualTaxable);

  const annualAllowance = (benefits.monthlyAllowancePhp || 0) * 12;
  // HMO default valuation: ₱2,000/month if unspecified/unrecorded
  const annualHmo = benefits.hmoCoveragePhp ? Math.min(30000, benefits.hmoCoveragePhp * 0.1) : 24000;

  const annualNet = (12 * effectiveSalary) + bonusPay - annualStatutory - annualTax + annualAllowance + annualHmo;
  return Math.max(0, annualNet / 12);
}

/**
 * Calculates net arbitrage parity between PH Local and Foreign Remote.
 */
export function calculateNetArbitrage(
  localMonthlyGross: number,
  localGuaranteedMonths = 13,
  localMonthlyAllowance = 0,
  localHmoValueAnnual = 24000
): ArbitrageComparison {
  const bonusMonths = Math.max(0, localGuaranteedMonths - 12);
  const bonusPay = bonusMonths * localMonthlyGross;

  const localStat = computeEmployeeStatutory(localMonthlyGross);
  const taxableBonus = Math.max(0, bonusPay - 90000);
  const annualTaxable = Math.max(0, (12 * (localMonthlyGross - localStat.total)) + taxableBonus);
  const localAnnualTax = computeTrainAnnualTax(annualTaxable);

  const localAnnualNet = (12 * localMonthlyGross) + bonusPay - (localStat.total * 12) - localAnnualTax + (localMonthlyAllowance * 12) + localHmoValueAnnual;
  const localMonthlyNetEquivalent = localAnnualNet / 12;

  // Binary search for matching remote gross rate that yields localMonthlyNetEquivalent
  let low = 0;
  let high = localMonthlyGross * 2.5;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const remoteAnnualGross = mid * 12;
    const remoteTax = computeContractorAnnualTax(remoteAnnualGross);
    const remoteStat = computeContractorStatutory(mid).total * 12;
    const remoteNet = (remoteAnnualGross - remoteTax - remoteStat) / 12;

    if (remoteNet < localMonthlyNetEquivalent) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const remoteBreakEvenGross = Math.round((low + high) / 2);
  const remoteTax = computeContractorAnnualTax(remoteBreakEvenGross * 12);
  const remoteStat = computeContractorStatutory(remoteBreakEvenGross).total * 12;
  const remoteNetEquivalent = ((remoteBreakEvenGross * 12) - remoteTax - remoteStat) / 12;

  return {
    localMonthlyGross,
    localMonthlyNetEquivalent: Math.round(localMonthlyNetEquivalent),
    remoteBreakEvenMonthlyGross: remoteBreakEvenGross,
    remoteMonthlyNetEquivalent: Math.round(remoteNetEquivalent),
    taxDifferenceAnnual: Math.round(localAnnualTax - remoteTax),
    statutoryDifferenceAnnual: Math.round((localStat.total * 12) - remoteStat),
    benefitsAnnualLocal: Math.round(bonusPay + (localMonthlyAllowance * 12) + localHmoValueAnnual),
  };
}
