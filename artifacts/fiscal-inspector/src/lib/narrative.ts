import { MacroEvent, EndingData, AlignmentScores, WorldState } from '../types/game';

// ─── Daily Macro Events ────────────────────────────────────────────────────────

export const DAILY_EVENTS: Record<number, MacroEvent> = {
  3: {
    type: 'market_shock',
    title: 'MARKET SHOCK — DAY 3',
    description: 'Overnight markets collapsed 18%. The Ministry has issued emergency wage austerity. All clerk pay is reduced by 30% today. Errors will be penalized additionally.',
    ruleAddendum: 'All earnings reduced by 30%. Wrong decisions cost double today.',
    wageMultiplier: 0.7,
    costOfLiving: 50,
  },
  5: {
    type: 'hyperinflation',
    title: 'HYPERINFLATION NOTICE — DAY 5',
    description: 'The cost of living index has surged. Rent, food, and essential expenses are deducted automatically from your pay. The Ministry offers no raises at this time.',
    ruleAddendum: 'Cost of Living: $120 deducted from today\'s wages automatically.',
    wageMultiplier: 1.0,
    costOfLiving: 120,
  },
  7: {
    type: 'audit_sweep',
    title: 'INTERNAL AUDIT SWEEP — DAY 7',
    description: 'The Ministry is conducting a final performance audit. Every citation today will be reviewed by senior oversight. Accuracy determines your final classification.',
    ruleAddendum: 'Final audit day. Your decisions today determine your permanent record.',
    wageMultiplier: 1.25,
    costOfLiving: 0,
  },
};

// ─── VIP Client Definitions ────────────────────────────────────────────────────

export const VIP_CLIENTS: Record<string, {
  name: string;
  avatarSeed: number;
  smallTalk: string[];
  hiddenNote?: string;
  isContraband: boolean;
  flagId: string;
  title: string;
  organization: string;
  consequence: string;
  humanCostIfApproved: string;
  humanCostIfFrozen: string;
  requiresFreeze: boolean;
}> = {
  'vip-day2': {
    name: 'Marcus Vane',
    avatarSeed: 5001,
    smallTalk: [
      "I'm sure you've heard of Vane Properties. We've developed half this district.",
      "My filings are handled by a team of ten lawyers. Everything is in order.",
    ],
    hiddenNote: "Note inside application: 'If approved, Lot 9 demolition proceeds Monday. 400 residents affected. — M.V.'",
    isContraband: false,
    flagId: 'corrupt_developer',
    title: 'Chief Executive',
    organization: 'Vane Properties LLC',
    consequence: 'Approving Vane triggers housing seizures affecting 400 families in District 7.',
    humanCostIfApproved: '400 families begin eviction proceedings. District 7 housing crisis begins.',
    humanCostIfFrozen: 'Vane Properties halted. District 7 residents gain temporary reprieve.',
    requiresFreeze: false,
  },
  'vip-day4': {
    name: 'Ana Reyes',
    avatarSeed: 5002,
    smallTalk: [
      "I'm just a nurse. I don't understand why I need all these extra forms.",
      "I've been helping people file correctly for free. Is that... allowed?",
    ],
    hiddenNote: "Memo inside file: 'Reyes has been forwarding duplicate filings to the Solidarity Network. Surveillance requested.' — Internal Security",
    isContraband: false,
    flagId: 'whistleblower_nurse',
    title: 'Community Tax Advocate',
    organization: 'District 4 Solidarity Network',
    consequence: 'Rejecting Reyes shuts down the community tax aid network.',
    humanCostIfApproved: 'The Solidarity Network continues helping 80 low-income families navigate filings.',
    humanCostIfFrozen: 'The Ministry labels Reyes a dissident. Network dismantled within the week.',
    requiresFreeze: false,
  },
  'vip-day6': {
    name: 'Director Emil Strauss',
    avatarSeed: 5003,
    smallTalk: [
      "I expect this to take less than five minutes. I have a board meeting.",
      "I was told this office is... cooperative.",
    ],
    hiddenNote: "Crossed-out note in filing: 'offshore transfer ref: CAYMAN-91-X / $4.1M undeclared'",
    isContraband: true,
    flagId: 'director_offshore',
    title: 'Regional Banking Director',
    organization: 'First Consolidated Bank',
    consequence: 'Strauss has $4.1M undeclared offshore. This is a Freeze Assets case.',
    humanCostIfApproved: 'Strauss launders $4.1M. The exposed fraud costs the public treasury $800K in enforcement costs.',
    humanCostIfFrozen: 'Banking Director exposed. The press runs the story. Public trust in the system improves slightly.',
    requiresFreeze: true,
  },
};

// ─── VIP Day Assignment ────────────────────────────────────────────────────────

export function getVIPForDay(day: number): string | null {
  if (day === 2) return 'vip-day2';
  if (day === 4) return 'vip-day4';
  if (day === 6) return 'vip-day6';
  return null;
}

// ─── Ending Matrix ─────────────────────────────────────────────────────────────

export function calculateEnding(
  money: number,
  citations: number,
  alignment: AlignmentScores,
  worldState: WorldState,
  day: number
): EndingData {
  const total = alignment.corporate + alignment.whistleblower + alignment.survivalist;
  const dominant: 'corporate' | 'whistleblower' | 'survivalist' =
    alignment.whistleblower >= alignment.corporate && alignment.whistleblower >= alignment.survivalist
      ? 'whistleblower'
      : alignment.corporate >= alignment.survivalist
        ? 'corporate'
        : 'survivalist';

  const isWealthy = money >= 700;
  const isModerate = money >= 300;
  const isClean = citations <= 1;
  const isHeavyCitations = citations >= 4;

  // ── Whistleblower paths ──────────────────────────────────────────────────────
  if (dominant === 'whistleblower') {
    if (worldState.insiderTradingExposed && isClean) {
      return {
        id: 'the_leak',
        title: 'THE LEAK',
        subtitle: 'You exposed the system from within.',
        description: `Director Strauss's offshore accounts were front-page news for three weeks. The Ministry quietly transferred you to a 'monitoring' role in a basement office. You didn't mind. The story was worth it.`,
        color: 'blue',
      };
    }
    if (worldState.whistleblowerNetworkActive) {
      return {
        id: 'solidarity',
        title: 'SOLIDARITY',
        subtitle: 'You protected the people, not the institution.',
        description: `Ana Reyes's network survived. It now covers six districts. You still work the same desk, but the forms feel different when you know what they protect.`,
        color: 'blue',
      };
    }
    if (isHeavyCitations) {
      return {
        id: 'martyred',
        title: 'MARTYRED INFORMANT',
        subtitle: 'You fought the system. The system fought back.',
        description: `Your citation record flagged you for 're-education review.' The irony: you were one of the few who actually read the documents. The Ministry prefers clerks who don't.`,
        color: 'red',
      };
    }
    return {
      id: 'quiet_resistance',
      title: 'QUIET RESISTANCE',
      subtitle: 'Small acts. Real consequences.',
      description: `You bent no rules dramatically, but every careful decision added up. Somewhere in District 4, a family kept their apartment because you read a footnote. You'll never know which one.`,
      color: 'blue',
    };
  }

  // ── Corporate paths ──────────────────────────────────────────────────────────
  if (dominant === 'corporate') {
    if (worldState.corruptDeveloperApproved && isWealthy) {
      return {
        id: 'rising_executive',
        title: 'RISING EXECUTIVE',
        subtitle: 'The Ministry rewards efficiency.',
        description: `Vane Properties sent a thank-you basket. The Ministry flagged your approval rate as 'exemplary.' You received a three-grade promotion. You don't think about District 7 anymore.`,
        color: 'amber',
      };
    }
    if (isClean && isWealthy) {
      return {
        id: 'model_clerk',
        title: 'MODEL CLERK',
        subtitle: 'Accuracy. Compliance. Nothing more.',
        description: `Your record was impeccable. The Ministry framed your stats in the lobby. You've become a training example. You're not sure if that's something to be proud of.`,
        color: 'green',
      };
    }
    if (isHeavyCitations) {
      return {
        id: 'compliant_drone',
        title: 'COMPLIANT DRONE',
        subtitle: 'You followed orders. The wrong ones.',
        description: `You prioritized throughput over accuracy. The Ministry doesn't fire you — too much paperwork. Instead, they moved you to the filing room. You stamp forms that no one reads.`,
        color: 'red',
      };
    }
    return {
      id: 'steady_worker',
      title: 'STEADY WORKER',
      subtitle: 'Reliable. Replaceable.',
      description: `You showed up. Processed the queue. Went home. The Ministry noted your 'consistent output.' A raise of $0.50 per hour was approved and then rescinded due to budget constraints.`,
      color: 'amber',
    };
  }

  // ── Survivalist paths ────────────────────────────────────────────────────────
  if (isWealthy && isClean) {
    return {
      id: 'off_grid',
      title: 'OFF THE GRID',
      subtitle: 'You played the game better than anyone.',
      description: `You saved enough to disappear. A small house, two dogs, and no forwarding address. The Ministry sent three letters. You didn't open them.`,
      color: 'green',
    };
  }
  if (isWealthy && isHeavyCitations) {
    return {
      id: 'calculated_risk',
      title: 'CALCULATED RISK',
      subtitle: 'The numbers worked. Mostly.',
      description: `You made decisions that weren't strictly by the book, but you walked away with enough money to matter. Your citation record was expunged in exchange for a quiet resignation.`,
      color: 'amber',
    };
  }
  if (!isModerate) {
    return {
      id: 'just_getting_by',
      title: 'JUST GETTING BY',
      subtitle: 'The system was designed to win.',
      description: "You tried to stay neutral. The Market Shock took the rest. You still owe three months rent. The Ministry does not offer payment plans for its own employees.",
      color: 'red',
    };
  }
  return {
    id: 'pragmatist',
    title: 'THE PRAGMATIST',
    subtitle: 'You kept your head down. Mostly.',
    description: "You made reasonable decisions for unreasonable circumstances. You\'re still here. The desk is still here. Tomorrow there will be more forms.",
    color: 'amber',
  };
}

// ─── Human Cost Messages ───────────────────────────────────────────────────────

export const HUMAN_COSTS = {
  approve_fraud: [
    "Fraudulent deductions shift the tax burden onto lower-income earners in the district.",
    "An underpaid school in District 3 loses $12,000 in expected tax revenue.",
    "A small business owner in the same bracket receives a surprise audit triggered by this pattern.",
  ],
  reject_innocent: [
    "A legitimate refund is delayed by 6–8 weeks, causing the citizen to miss rent.",
    "The citizen must hire a tax attorney they cannot afford.",
    "Three hours waiting in line, rescheduled work, and no resolution.",
  ],
  correct_reject: [
    "Fraud stopped. $40K in false deductions removed from the system.",
    "Pattern flagged for systemic review — 12 similar cases identified upstream.",
    "The rejected applicant will face a secondary audit.",
  ],
  freeze_correct: [
    "Assets frozen. Case referred to financial crimes division.",
    "The money laundering trail traced to a larger network — 3 additional suspects identified.",
    "Public funds recovered. Headline: 'Ministry Clerk Uncovers $4M Offshore Scheme.'",
  ],
  correct_approve: [
    "Citizen processes their refund within the week. Files accurately again next year.",
    "The approved filing unlocks healthcare subsidy eligibility for this household.",
    "No downstream cost. A clean filing, cleanly handled.",
  ],
};
