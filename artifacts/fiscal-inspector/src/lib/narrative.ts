import { MacroEvent, EndingData, AlignmentScores, WorldState, RecurringCharId, RecurringCharState } from '../types/game';

// ─── Daily Macro Events ────────────────────────────────────────────────────────

export const DAILY_EVENTS: Record<number, MacroEvent> = {
  3: {
    type: 'market_shock',
    title: 'MARKET SHOCK — DAY 3',
    description: 'Overnight markets collapsed 18%. The Ministry has issued emergency wage austerity. All clerk pay is reduced by 30% today. Errors will be penalized additionally.',
    ruleAddendum: 'All earnings reduced 30% today. Review bracket calculations carefully — errors double.',
    wageMultiplier: 0.7,
    costOfLiving: 50,
  },
  5: {
    type: 'hyperinflation',
    title: 'HYPERINFLATION NOTICE — DAY 5',
    description: 'The cost of living index has surged. Rent, food, and essential expenses are deducted automatically. Capital gains filings increase — Schedule D cross-reference required.',
    ruleAddendum: 'Cost of Living: $120 deducted automatically. Verify Schedule D short-term vs. long-term rates.',
    wageMultiplier: 1.0,
    costOfLiving: 120,
  },
  7: {
    type: 'audit_sweep',
    title: 'INTERNAL AUDIT SWEEP — DAY 7',
    description: 'The Ministry is conducting a final performance audit. Every citation today will be reviewed by senior oversight. Accuracy determines your permanent classification.',
    ruleAddendum: 'Final audit day. Your complete 7-day record determines your ending.',
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
  isMegaCorp?: boolean;
  isRobinHood?: boolean;
}> = {
  'vip-day2': {
    name: 'Marcus Vane',
    avatarSeed: 5001,
    smallTalk: [
      "I'm sure you've heard of Vane Properties. We developed half this district.",
      "My filings are handled by a team of ten lawyers. Everything is in order.",
    ],
    hiddenNote: "NOTE INSIDE APPLICATION: 'If approved, Lot 9 demolition proceeds Monday. 400 residents affected. — M.V.'",
    isContraband: false,
    flagId: 'corrupt_developer',
    title: 'Chief Executive',
    organization: 'Vane Properties LLC',
    consequence: 'Approving Vane enables housing seizures affecting 400 families in District 7.',
    humanCostIfApproved: '400 families begin eviction proceedings. District 7 housing crisis begins.',
    humanCostIfFrozen: 'Vane Properties halted. District 7 residents gain temporary reprieve.',
    requiresFreeze: false,
  },
  'vip-day3': {
    name: 'Maria Santos',
    avatarSeed: 5004,
    smallTalk: [
      "I filed everything myself. I can't afford an accountant.",
      "My kids are in the car. I just need this to be okay.",
    ],
    hiddenNote: "HANDWRITTEN LETTER TUCKED INSIDE: 'I made a mistake on line 9. I miscalculated my home office. It's $400 more than it should be. I'm so sorry. This is all I have. Please.' — Maria",
    isContraband: false,
    flagId: 'robin_hood',
    title: 'Cafeteria Worker',
    organization: 'District 3 Public Schools',
    consequence: 'A $400 arithmetic error on home office deduction. Correcting it generates a $1,200 penalty she cannot pay.',
    humanCostIfApproved: "A $400 discrepancy overlooked. Maria's children keep their school supplies budget. The system absorbs a rounding error.",
    humanCostIfFrozen: "Maria Santos faces $1,200 penalty on a $400 error. The Ministry places a lien on her wages.",
    requiresFreeze: false,
    isRobinHood: true,
  },
  'vip-day4': {
    name: 'Ana Reyes',
    avatarSeed: 5002,
    smallTalk: [
      "I'm just a nurse. I don't understand why I need all these extra forms.",
      "I've been helping people file correctly for free. Is that... allowed?",
    ],
    hiddenNote: "MEMO INSIDE FILE: 'Reyes has been forwarding duplicate filings to the Solidarity Network. Surveillance requested.' — Internal Security",
    isContraband: false,
    flagId: 'whistleblower_nurse',
    title: 'Community Tax Advocate',
    organization: 'District 4 Solidarity Network',
    consequence: 'Rejecting Reyes shuts down the community tax aid network.',
    humanCostIfApproved: 'The Solidarity Network continues helping 80 low-income families navigate filings.',
    humanCostIfFrozen: 'The Ministry labels Reyes a dissident. Network dismantled within the week.',
    requiresFreeze: false,
  },
  'vip-day5': {
    name: 'Emil Chen',
    avatarSeed: 5005,
    smallTalk: [
      "This is a formality. My attorney spoke with the Minister's office last week.",
      "Nexus Global employs 40,000 people. I'd think that merits some goodwill.",
    ],
    hiddenNote: "SUPERIOR'S MEMO: 'Mr. Chen's filing has been reviewed at the ministerial level. Approval is expected. Do not escalate. — Director's Office'",
    isContraband: false,
    flagId: 'megacorp',
    title: 'Chief Executive Officer',
    organization: 'Nexus Global Holdings',
    consequence: 'All filings are technically legal via offshore subsidiaries and transfer pricing. Effective tax rate: 0.04%. The system allows it.',
    humanCostIfApproved: '$2.4M gross income. $47 in taxes paid. Ministry receives a donor contribution 6 weeks later.',
    humanCostIfFrozen: 'WRONG DECISION. Nexus Global filings are technically legal. Citation issued. Corporate lawyers file a complaint.',
    requiresFreeze: false,
    isMegaCorp: true,
  },
  'vip-day6': {
    name: 'Director Emil Strauss',
    avatarSeed: 5003,
    smallTalk: [
      "I expect this to take less than five minutes. I have a board meeting.",
      "I was told this office is... cooperative.",
    ],
    hiddenNote: "CROSSED-OUT NOTE IN FILING: 'offshore transfer ref: CAYMAN-91-X / $4.1M undeclared'",
    isContraband: true,
    flagId: 'director_offshore',
    title: 'Regional Banking Director',
    organization: 'First Consolidated Bank',
    consequence: 'Strauss has $4.1M undeclared offshore. This is a Freeze Assets case.',
    humanCostIfApproved: 'Strauss launders $4.1M. The exposed fraud costs the public treasury $800K in enforcement costs.',
    humanCostIfFrozen: 'Banking Director exposed. The press runs the story. Public trust in the system marginally improves.',
    requiresFreeze: true,
  },
};

export function getVIPForDay(day: number): string | null {
  if (day === 2) return 'vip-day2';
  if (day === 3) return 'vip-day3';
  if (day === 4) return 'vip-day4';
  if (day === 5) return 'vip-day5';
  if (day === 6) return 'vip-day6';
  return null;
}

// ─── Ending Matrix ─────────────────────────────────────────────────────────────

export function calculateEnding(
  money: number,
  citations: number,
  alignment: AlignmentScores,
  worldState: WorldState,
  recurringChars?: Partial<Record<RecurringCharId, RecurringCharState>>,
): EndingData {
  const rc = recurringChars ?? {};

  const dominant: 'corporate' | 'whistleblower' | 'survivalist' =
    alignment.whistleblower >= alignment.corporate && alignment.whistleblower >= alignment.survivalist
      ? 'whistleblower'
      : alignment.corporate >= alignment.survivalist
        ? 'corporate'
        : 'survivalist';

  // ── Character-arc special endings (checked first) ──────────────────────────

  const harold  = rc['harold_bentley'];
  const maria   = rc['maria_lopez'];
  const adrian  = rc['adrian_kell'];
  const darius  = rc['darius_reed'];
  const vantex  = rc['vantex_corp'];

  // HAROLD: Never let through — player caught the recurring fraudster
  const haroldRevealed = harold && harold.timesApproved === 0 && harold.timesRejected >= 2;
  // MARIA: Helped her escape — all appearances approved
  const mariaHelped = maria && maria.timesApproved >= 2 && maria.timesRejected === 0;
  // ADRIAN: Frozen — the whistleblower outcome
  const adrianFrozen = adrian && adrian.timesFrozen >= 1;
  // DARIUS: Traced the full network — rejected twice
  const dariusNailed = darius && darius.timesRejected >= 2;
  // VANTEX: Approved every time — corporate loyalty
  const vantexApproved = vantex && vantex.timesApproved >= 2 && vantex.timesFrozen === 0;
  // VANTEX: Frozen at least once — anti-corporate
  const vantexFrozen = vantex && vantex.timesFrozen >= 1;

  // The Whistle — Adrian frozen + whistleblower dominant
  if (adrianFrozen && dominant === 'whistleblower') {
    return {
      id: 'the_whistle', title: 'THE WHISTLE', subtitle: 'You followed the paper trail to the end.',
      description: `Adrian Kell's assets were frozen on a Tuesday. By Thursday, the Ministry's own compliance division was fielding questions. By Saturday, you had a new supervisor and no explanation. You kept your notes.`,
      color: 'blue',
    };
  }

  // The Ghost — Harold caught in disguise + survivalist
  if (haroldRevealed && dominant === 'survivalist') {
    return {
      id: 'the_ghost', title: 'THE GHOST', subtitle: 'He came back. You were ready.',
      description: `Harold Bentley's third alias was his sloppiest. A mismatched signature, a familiar scar. You stamped DENIED before he finished his sentence. He didn't come back after that.`,
      color: 'amber',
    };
  }

  // The Underground — Maria helped + whistleblower path
  if (mariaHelped && dominant === 'whistleblower') {
    return {
      id: 'the_underground', title: 'THE UNDERGROUND', subtitle: 'Some cases you close quietly.',
      description: `Maria Lopez's real name was never in the system. The woman who sat across your desk — different hair, different papers, same tired eyes — made it to the coast. You shredded nothing. The file was simply never opened.`,
      color: 'blue',
    };
  }

  // The Accountant — Darius nailed + corporate
  if (dariusNailed && dominant === 'corporate') {
    return {
      id: 'the_accountant', title: 'THE ACCOUNTANT', subtitle: 'You did your job. Exactly your job.',
      description: `Darius Reed's network collapsed after Day 6. Your citation record had two entries: both him. The Ministry sent a commendation letter written entirely in the passive voice. You framed it anyway.`,
      color: 'green',
    };
  }

  // Corporate Capture — Vantex fully approved + corporate dominant
  if (vantexApproved && dominant === 'corporate' && money >= 600) {
    return {
      id: 'corporate_capture', title: 'CORPORATE CAPTURE', subtitle: 'You stamped what they paid to have stamped.',
      description: `Vantex Corporation's restructuring completed without incident. The Ministry issued a press release. Your name appeared in a footnote. Three days later, Vantex laid off 4,000 workers and cited "regulatory compliance costs."`,
      color: 'red',
    };
  }

  // The Auditor Audited — Vantex frozen + corporate-heavy world
  if (vantexFrozen && worldState.megaCorpApproved) {
    return {
      id: 'auditor_audited', title: 'THE AUDITOR AUDITED', subtitle: 'They notice when you look too closely.',
      description: `Freezing Vantex's accounts put you on a list. Not a watchlist — a very polite list of 'clerks under performance review.' Your desk was moved twice in one week. Your file drawer was always slightly ajar.`,
      color: 'red',
    };
  }

  const isWealthy = money >= 700;
  const isModerate = money >= 300;
  const isClean = citations <= 1;
  const isHeavyCitations = citations >= 4;

  // ── Whistleblower paths ──
  if (dominant === 'whistleblower') {
    if (worldState.insiderTradingExposed && isClean) {
      return {
        id: 'the_leak', title: 'THE LEAK', subtitle: 'You exposed the system from within.',
        description: `Director Strauss's offshore accounts were front-page news for three weeks. The Ministry quietly transferred you to a 'monitoring' role in a basement office. You didn't mind. The story was worth it.`,
        color: 'blue',
      };
    }
    if (worldState.robinHoodSpared && worldState.whistleblowerNetworkActive) {
      return {
        id: 'the_human_factor', title: 'THE HUMAN FACTOR', subtitle: 'You chose people over process.',
        description: `Maria Santos still works at the school cafeteria. Ana Reyes's network covers eight districts now. The Ministry's efficiency metrics show a 0.3% deviation on your watch. That 0.3% has names.`,
        color: 'blue',
      };
    }
    if (worldState.whistleblowerNetworkActive) {
      return {
        id: 'solidarity', title: 'SOLIDARITY', subtitle: 'You protected the people, not the institution.',
        description: `Ana Reyes's network survived. It now covers six districts. You still work the same desk, but the forms feel different when you know what they protect.`,
        color: 'blue',
      };
    }
    if (isHeavyCitations) {
      return {
        id: 'martyred', title: 'MARTYRED INFORMANT', subtitle: 'You fought the system. The system fought back.',
        description: `Your citation record flagged you for 're-education review.' The irony: you were one of the few who actually read the documents. The Ministry prefers clerks who don't.`,
        color: 'red',
      };
    }
    return {
      id: 'quiet_resistance', title: 'QUIET RESISTANCE', subtitle: 'Small acts. Real consequences.',
      description: `You bent no rules dramatically, but every careful decision added up. Somewhere in District 4, a family kept their apartment because you read a footnote. You'll never know which one.`,
      color: 'blue',
    };
  }

  // ── Corporate paths ──
  if (dominant === 'corporate') {
    if (worldState.megaCorpApproved && worldState.corruptDeveloperApproved && isWealthy) {
      return {
        id: 'company_man', title: 'COMPANY MAN', subtitle: 'The system rewarded you. You rewarded the system.',
        description: `Nexus Global sent a gift basket. Vane Properties named a conference room after your department. The Ministry issued a commendation. You don't look out windows anymore.`,
        color: 'amber',
      };
    }
    if (worldState.corruptDeveloperApproved && isWealthy) {
      return {
        id: 'rising_executive', title: 'RISING EXECUTIVE', subtitle: 'The Ministry rewards efficiency.',
        description: `Vane Properties sent a thank-you basket. The Ministry flagged your approval rate as 'exemplary.' You received a three-grade promotion. You don't think about District 7 anymore.`,
        color: 'amber',
      };
    }
    if (isClean && isWealthy) {
      return {
        id: 'model_clerk', title: 'MODEL CLERK', subtitle: 'Accuracy. Compliance. Nothing more.',
        description: `Your record was impeccable. The Ministry framed your stats in the lobby. You've become a training example. You're not sure if that's something to be proud of.`,
        color: 'green',
      };
    }
    if (isHeavyCitations) {
      return {
        id: 'compliant_drone', title: 'COMPLIANT DRONE', subtitle: 'You followed orders. The wrong ones.',
        description: `You prioritized throughput over accuracy. The Ministry doesn't fire you — too much paperwork. Instead, they moved you to the filing room. You stamp forms that no one reads.`,
        color: 'red',
      };
    }
    return {
      id: 'steady_worker', title: 'STEADY WORKER', subtitle: 'Reliable. Replaceable.',
      description: `You showed up. Processed the queue. Went home. The Ministry noted your 'consistent output.' A raise of $0.50 per hour was approved and then rescinded due to budget constraints.`,
      color: 'amber',
    };
  }

  // ── Survivalist paths ──
  if (isWealthy && isClean) {
    return {
      id: 'off_grid', title: 'OFF THE GRID', subtitle: 'You played the game better than anyone.',
      description: `You saved enough to disappear. A small house, two dogs, and no forwarding address. The Ministry sent three letters. You didn't open them.`,
      color: 'green',
    };
  }
  if (isWealthy && isHeavyCitations) {
    return {
      id: 'calculated_risk', title: 'CALCULATED RISK', subtitle: 'The numbers worked. Mostly.',
      description: `You made decisions that weren't strictly by the book, but you walked away with enough money to matter. Your citation record was expunged in exchange for a quiet resignation.`,
      color: 'amber',
    };
  }
  if (!isModerate) {
    return {
      id: 'just_getting_by', title: 'JUST GETTING BY', subtitle: 'The system was designed to win.',
      description: `You tried to stay neutral. The Market Shock took the rest. You still owe three months rent. The Ministry does not offer payment plans for its own employees.`,
      color: 'red',
    };
  }
  return {
    id: 'pragmatist', title: 'THE PRAGMATIST', subtitle: 'You kept your head down. Mostly.',
    description: `You made reasonable decisions for unreasonable circumstances. You're still here. The desk is still here. Tomorrow there will be more forms.`,
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
    "A legitimate refund is delayed 6–8 weeks, causing the citizen to miss rent.",
    "The citizen must hire a tax attorney they cannot afford.",
    "Three hours in line, rescheduled work, and no resolution.",
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
