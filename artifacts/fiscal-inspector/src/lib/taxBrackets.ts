// ─── Progressive Tax Brackets ─────────────────────────────────────────────────
// Used by both the generator (to compute correct tax owed) and the 1040 form
// (to display the bracket breakdown so the player can verify)

export interface TaxBracketSlice {
  from: number;
  to: number;
  rate: number;
  label: string;
}

export const ORDINARY_BRACKETS: TaxBracketSlice[] = [
  { from: 0,       to: 20000,    rate: 0.10, label: 'Bracket I   — 10%' },
  { from: 20000,   to: 80000,    rate: 0.22, label: 'Bracket II  — 22%' },
  { from: 80000,   to: 180000,   rate: 0.32, label: 'Bracket III — 32%' },
  { from: 180000,  to: Infinity, rate: 0.37, label: 'Bracket IV  — 37%' },
];

export interface BracketLineItem {
  label: string;
  taxableAmount: number;
  rate: number;
  tax: number;
}

export function calculateOrdinaryTax(taxableIncome: number): { total: number; lines: BracketLineItem[] } {
  let total = 0;
  const lines: BracketLineItem[] = [];
  for (const b of ORDINARY_BRACKETS) {
    if (taxableIncome <= b.from) break;
    const amt = Math.min(taxableIncome, b.to) - b.from;
    const tax = Math.floor(amt * b.rate);
    total += tax;
    lines.push({ label: b.label, taxableAmount: amt, rate: b.rate, tax });
  }
  return { total, lines };
}

// ─── Capital Gains (Schedule D) ────────────────────────────────────────────────
// Short-term: held < 1 year → taxed as ordinary income (adds to bracket)
// Long-term:  held ≥ 1 year → preferential rate (0% / 15% / 20%)

export function getLongTermRate(ordinaryTaxableIncome: number): number {
  if (ordinaryTaxableIncome < 44000) return 0.00;
  if (ordinaryTaxableIncome < 492000) return 0.15;
  return 0.20;
}

export function calculateCapitalGainsTax(
  ordinaryTaxableIncome: number,
  shortTermGains: number,
  longTermGains: number
): { shortTermTax: number; longTermTax: number; ltRate: number; total: number } {
  const { total: baseTax } = calculateOrdinaryTax(ordinaryTaxableIncome);
  const { total: withShortTerm } = calculateOrdinaryTax(ordinaryTaxableIncome + shortTermGains);
  const shortTermTax = withShortTerm - baseTax;
  const ltRate = getLongTermRate(ordinaryTaxableIncome);
  const longTermTax = Math.floor(longTermGains * ltRate);
  return { shortTermTax, longTermTax, ltRate, total: shortTermTax + longTermTax };
}
