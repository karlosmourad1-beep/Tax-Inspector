import { EveningEvent } from '../types/game';

export const RENT_BY_DAY: Record<number, number> = {
  1: 40, 2: 45, 3: 50, 4: 55, 5: 60, 6: 65, 7: 75,
};

export const MAX_FOOD = 5;
export const FOOD_PRICE = 30;

export function foodToMod(food: number): number {
  if (food >= 3) return 1.0;
  if (food === 2) return 0.90;
  if (food === 1) return 0.80;
  return 0.70;
}

export const FOOD_LABELS = ['Starving', 'Very Hungry', 'Hungry', 'Fed', 'Well Fed', 'Stocked'];

const POOL: EveningEvent[] = [
  {
    id: 'rent_hike',
    title: 'Landlord Notice',
    category: 'FINANCIAL',
    description: 'Your landlord has issued a temporary surcharge. Non-negotiable.',
    type: 'auto',
    autoEffect: { moneyDelta: -45, foodDelta: 0, perfDelta: 0, label: 'Surcharge applied' },
  },
  {
    id: 'ministry_bonus',
    title: 'Efficiency Commendation',
    category: 'PROFESSIONAL',
    description: 'Management circulated a departmental efficiency memo. A small bonus was included for all auditors.',
    type: 'auto',
    autoEffect: { moneyDelta: 40, foodDelta: 0, perfDelta: 0, label: 'Bonus received' },
  },
  {
    id: 'medical_bill',
    title: 'Unexpected Medical Bill',
    category: 'PERSONAL',
    description: 'A clinic bill arrived for a routine visit last month. You can settle it now or cut back on meals to compensate.',
    type: 'choice',
    choices: [
      { id: 'pay', label: 'Pay the bill ($60)', description: 'Handled properly.', moneyDelta: -60, foodDelta: 0, perfDelta: 0 },
      { id: 'skip', label: 'Cut back on meals', description: 'Save money, sacrifice 2 rations.', moneyDelta: 0, foodDelta: -2, perfDelta: 0 },
    ],
  },
  {
    id: 'heating_failure',
    title: 'Heating System Failure',
    category: 'PERSONAL',
    description: 'Your heating unit broke overnight. An emergency repair service is available, or you can endure the cold.',
    type: 'choice',
    choices: [
      { id: 'repair', label: 'Emergency repair ($35)', description: 'Comfort restored. Sleep well.', moneyDelta: -35, foodDelta: 0, perfDelta: 0 },
      { id: 'endure', label: 'Endure the cold', description: 'Rough night. Concentration suffers tomorrow.', moneyDelta: 0, foodDelta: 0, perfDelta: -0.15 },
    ],
  },
  {
    id: 'tax_rebate',
    title: 'Personal Tax Rebate',
    category: 'FINANCIAL',
    description: 'Your annual tax rebate arrived by post. A modest sum from last year\'s filing.',
    type: 'auto',
    autoEffect: { moneyDelta: 45, foodDelta: 0, perfDelta: 0, label: 'Rebate processed' },
  },
  {
    id: 'anonymous_envelope',
    title: 'Anonymous Envelope',
    category: 'MORAL',
    description: 'An unmarked envelope was left on your desk. Inside: $100 cash and a note — "We noticed your work. Look the other way when it counts." No signature.',
    type: 'choice',
    choices: [
      { id: 'accept', label: 'Pocket the cash', description: 'No questions asked.', moneyDelta: 100, foodDelta: 0, perfDelta: 0, alignment: 'corporate' },
      { id: 'report', label: 'Report it to Internal Affairs', description: 'Your integrity stays intact.', moneyDelta: 0, foodDelta: 0, perfDelta: 0.10, alignment: 'whistleblower' },
      { id: 'ignore', label: 'Leave it on the desk', description: 'Neither take nor report it.', moneyDelta: 0, foodDelta: 0, perfDelta: 0 },
    ],
  },
  {
    id: 'auditor_handbook',
    title: "Advanced Auditor's Manual",
    category: 'PROFESSIONAL',
    description: 'A colleague is selling a bootleg copy of the classified auditor reference manual. It contains pattern-recognition techniques not taught in standard training.',
    type: 'choice',
    choices: [
      { id: 'buy', label: 'Buy it ($50)', description: 'Tomorrow\'s accuracy improves significantly.', moneyDelta: -50, foodDelta: 0, perfDelta: 0.15 },
      { id: 'pass', label: 'Pass on it', description: 'Save the money.', moneyDelta: 0, foodDelta: 0, perfDelta: 0 },
    ],
  },
  {
    id: 'street_market',
    title: 'Street Market Surplus',
    category: 'PERSONAL',
    description: 'A local vendor is clearing excess stock at a discount before closing. Fresh provisions available.',
    type: 'choice',
    choices: [
      { id: 'stock', label: 'Stock up ($25)', description: '+2 rations.', moneyDelta: -25, foodDelta: 2, perfDelta: 0 },
      { id: 'pass', label: 'Pass', description: 'Nothing today.', moneyDelta: 0, foodDelta: 0, perfDelta: 0 },
    ],
  },
  {
    id: 'overtime',
    title: 'Overnight Overtime Request',
    category: 'PROFESSIONAL',
    description: 'The department is backlogged. You can stay late tonight for extra pay, but exhaustion will affect tomorrow\'s performance.',
    type: 'choice',
    choices: [
      { id: 'work', label: 'Work overnight (+$70)', description: 'Tiring. Costs 1 ration and some focus.', moneyDelta: 70, foodDelta: -1, perfDelta: -0.10 },
      { id: 'rest', label: 'Decline and rest', description: 'Well-rested for tomorrow.', moneyDelta: 0, foodDelta: 0, perfDelta: 0.05 },
    ],
  },
  {
    id: 'power_outage',
    title: 'Building Power Outage',
    category: 'PERSONAL',
    description: 'The city block lost power overnight. Refrigerated food has spoiled. No one to blame.',
    type: 'auto',
    autoEffect: { moneyDelta: 0, foodDelta: -1, perfDelta: 0, label: '1 ration spoiled' },
  },
  {
    id: 'union_meeting',
    title: 'Auditors Union Meeting',
    category: 'PROFESSIONAL',
    description: 'The Auditors\' Union is holding a solidarity meeting tonight. Attending shows support but costs time you could spend resting.',
    type: 'choice',
    choices: [
      { id: 'attend', label: 'Attend the meeting', description: 'Solidarity noted. Mild fatigue.', moneyDelta: 0, foodDelta: 0, perfDelta: -0.05, alignment: 'whistleblower' },
      { id: 'skip', label: 'Stay home and rest', description: 'Better rest tomorrow.', moneyDelta: 0, foodDelta: 0, perfDelta: 0.05 },
    ],
  },
  {
    id: 'market_dividend',
    title: 'Investment Dividend',
    category: 'FINANCIAL',
    description: 'A small dividend payment arrived from a savings account. Not much, but welcome.',
    type: 'auto',
    autoEffect: { moneyDelta: 30, foodDelta: 0, perfDelta: 0, label: 'Dividend received' },
  },
];

/** Pick a deterministic-random evening event based on day + seed */
export function pickEveningEvent(day: number, seed: number): EveningEvent {
  const idx = (day * 7 + seed) % POOL.length;
  return POOL[idx];
}

/** All events (for testing) */
export { POOL as ALL_EVENING_EVENTS };
