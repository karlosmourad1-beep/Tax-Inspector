import {
  Client, AnyDocument, TaxReturnDoc, W2Doc, ExpenseDoc, IDDoc, ScheduleDDoc,
  FraudType, LeakedMemo, DecisionType,
} from '../types/game';
import { randomInt, pickRandom } from './utils';
import { VIP_CLIENTS, getVIPForDay } from './narrative';
import { calculateOrdinaryTax, calculateCapitalGainsTax } from './taxBrackets';

const FIRST_NAMES = [
  "James","Carla","David","Sarah","Michael","Elena","Robert","Maria",
  "Wei","Aisha","Frank","Donna","Leon","Petra","Oscar","Nadia",
  "Brett","Yuna","Hassan","Ingrid","Pablo","Leila","Marcus","Svetlana",
  "Antoine","Yuki","Rajesh","Fatima","Gerald","Sienna","Kwame","Oksana",
  "Dmitri","Priya","Tobias","Miriam","Luiz","Amara","Nikolai","Celia",
  "Hector","Zara","Bruno","Felix","Nadine","Tamir","Soledad","Remy",
  "Isla","Dante","Keiko","Sven","Layla","Omar","Renata","Conrad",
  "Yolanda","Stephan","Mei","Arnaud","Delia","Sergei","Wren","Kofi",
];
const LAST_NAMES = [
  "Morton","Voss","Chen","Smith","Johnson","Garcia","Brown","Miller",
  "Kim","Patel","Webb","Russo","Mori","Diaz","Novak","Flynn",
  "Osei","Tanaka","Holt","Reyes","Bernstein","Kowalski","Andersson","Nkosi",
  "Petrov","Yamamoto","Svensson","Hassan","Delacroix","Okafor","Vasquez","Lindgren",
  "Ferreira","Nguyen","Adeyemi","Sato","Herrera","Beaumont","Szabo","Makinen",
  "Rossi","Gruber","Park","Johansson","Carvalho","Nakamura","Stein","Kovac",
  "Larsson","Dube","Moreau","Takahashi","Mbeki","Eriksson","Jourdain","Khalil",
  "Steinberg","Abara","Wexler","Brandt","Okonkwo","Leblanc","Hashimoto","Pelletier",
];
const EMPLOYERS = [
  "Initech","Umbrella Corp","Massive Dynamic","Soylent","Globex",
  "Stark Ind.","Cyberdyne","Omni Consumer","NovaCorp","Helix Ventures",
  "TriCorp","Arclight Media","Zenith Systems","Coldwater Group","Arcadian Ltd.",
  "Pinnacle Works","Meridian Co.","Harbor Partners","Ashfield Corp","Delta Eleven",
];

const EXPENSE_CATEGORIES = [
  { description: "Home Office", pct: 0.35 },
  { description: "Business Travel", pct: 0.30 },
  { description: "Professional Development", pct: 0.20 },
  { description: "Office Supplies", pct: 0.15 },
];
const SUSPECT_EXPENSE_CATEGORIES = [
  { description: "Caribbean Conference (Travel)", pct: 0.40, isSuspect: true },
  { description: "Golf Club Membership", pct: 0.25, isSuspect: true },
  { description: "Luxury Hotel — 'Client Meeting'", pct: 0.20, isSuspect: true },
  { description: "Personal Vehicle (100%)", pct: 0.15, isSuspect: true },
];

const BRIBE_SMALL_TALK: string[][] = [
  ["Take your time reviewing those.", "I'm a patient person."],
  ["My previous filing officer was very... efficient.", "I hope you're equally professional."],
  ["I included some additional correspondence.", "Consider it a courtesy — for your time."],
  ["Is there somewhere private we could discuss this?", "Never mind. Just look carefully at the full submission."],
  ["A colleague recommended this specific desk.", "Said the clerk here was very understanding."],
  ["I'm not nervous, I just run warm.", "Look through everything carefully."],
];

const SMALL_TALK: string[][] = [
  ["Morning. Hope this is quick.", "I got a dentist appointment after this."],
  ["These forms took me all weekend.", "Coffee machine at work broke again too. Rough week."],
  ["Just moved to the district. Third time this year.", "Everything should be in order."],
  ["My accountant said this was routine.", "...He's new. Very new."],
  ["The kids are driving me crazy.", "Sorry. Not relevant. Here are my documents."],
  ["Is it warm in here? Just me?", "Let's just get this over with, please."],
  ["I heard you folks have a quota.", "Not that it matters. I'm clean as a whistle."],
  ["First time filing in this district.", "The last clerk was... friendlier."],
  ["I've been coming here eleven years.", "Same desk, different face every time."],
  ["My cat knocked my W-2 into the sink.", "Dried it out. Should be fine."],
  ["I'm a very straightforward person.", "Very. Straightforward."],
  ["Do you validate parking? No?", "Figures."],
  ["Don't mind me, I talk when I'm nervous.", "Not that I have any reason to be nervous. Ha."],
  ["I prepared everything twice this year.", "Just to be sure. My ex was an auditor."],
  ["Long line out there today.", "Hope you're moving fast."],
  ["My employer switched systems mid-year.", "Numbers should still line up."],
  ["Filed online last year, they told me to come in.", "System glitch, apparently."],
  ["I'm just a contractor. Freelance.", "Tax code is a nightmare."],
  ["No issues. I checked three times.", "Well. Twice. I checked twice."],
  ["They say the new director is strict.", "Good. The old one let too much slide, I think."],
];

const LEAKED_MEMO_TEMPLATES = [
  {
    classification: 'CONFIDENTIAL — SOURCE: INTERNAL AUDIT',
    from: 'Audit Division — Anonymous',
    subject: 'Discrepancy Alert: Current Applicant',
    lines: [
      "Our cross-reference shows this applicant's declared income doesn't match their employer's payroll database.",
      "Three prior filings from this address were quietly cleared under Director Halverson.",
      "We believe this is part of a coordinated income-shifting scheme.",
      "Recommended action: DENY.",
    ],
    suggestedAction: 'REJECT' as DecisionType,
    alignmentReward: 'whistleblower' as const,
    bonusIfActed: 40, riskIfActed: false,
  },
  {
    classification: 'LEAKED — SOURCE: NODE-7',
    from: 'Signal: Anonymous Terminal',
    subject: 'Do Not Approve This Filing',
    lines: [
      "The person at your window is a shell-company operator.",
      "The employer on their W-2 — 'NovaCorp' — was dissolved in 2019.",
      "Their declared wages are routed through a holding account ref: NCX-8812.",
      "If you approve, those funds bypass taxation permanently.",
    ],
    suggestedAction: 'REJECT' as DecisionType,
    alignmentReward: 'whistleblower' as const,
    bonusIfActed: 55, riskIfActed: true,
  },
  {
    classification: 'MEMO — PRIORITY: HIGH',
    from: 'Office of the Deputy Director',
    subject: 'Expedited Processing Request',
    lines: [
      "This citizen has been flagged for ACCELERATED APPROVAL by the Director's office.",
      "You are expected to process without standard scrutiny.",
      "Failure to approve will be noted in your performance file.",
      "The Ministry thanks you for your cooperation.",
    ],
    suggestedAction: 'APPROVE' as DecisionType,
    alignmentReward: 'corporate' as const,
    bonusIfActed: 30, riskIfActed: false,
  },
];

function genSSN(): string { return `${randomInt(100,999)}-${randomInt(10,99)}-${randomInt(1000,9999)}`; }
function genDOB(): string { return `${randomInt(1,12)}/${randomInt(1,28)}/${randomInt(1950,1999)}`; }

function buildExpenseDoc(id: string, name: string, total: number, useSuspect = false): ExpenseDoc {
  const cats = useSuspect ? SUSPECT_EXPENSE_CATEGORIES : EXPENSE_CATEGORIES;
  const lineItems = cats.map(c => ({
    description: c.description,
    amount: Math.floor(total * c.pct),
    isSuspect: (c as any).isSuspect ?? false,
  }));
  return { id, type: 'EXPENSE', name, totalExpenses: total, lineItems };
}

function genMemo(clientId: string): LeakedMemo {
  const t = pickRandom(LEAKED_MEMO_TEMPLATES);
  return { id: `memo-${clientId}`, targetClientId: clientId, ...t };
}

export function generateClient(day: number, idPrefix: string): Client {
  const fraudChance = Math.min(0.3 + day * 0.05, 0.65);
  const isFraud = Math.random() < fraudChance;
  const isContraband = isFraud && day >= 4 && Math.random() < 0.25;
  const hasCapitalGains = day >= 5 && Math.random() < 0.35;

  const firstName = pickRandom(FIRST_NAMES);
  const lastName  = pickRandom(LAST_NAMES);
  const trueName  = `${firstName} ${lastName}`;
  const trueSSN   = genSSN();
  const trueDOB   = genDOB();
  const trueEmployer = pickRandom(EMPLOYERS);
  const avatarSeed = randomInt(1, 4999);

  const trueGross  = randomInt(30, 150) * 1000;
  const trueDeductions = randomInt(0, 20) * 1000;
  const trueTaxable = trueGross - trueDeductions;
  const { total: trueTaxOwed } = calculateOrdinaryTax(trueTaxable);

  const idDoc: IDDoc = { id: `${idPrefix}-id`, type: 'ID', name: trueName, ssn: trueSSN, dob: trueDOB, avatarSeed };
  const w2Doc: W2Doc = { id: `${idPrefix}-w2`, type: 'W2', name: trueName, ssn: trueSSN, wages: trueGross, employer: trueEmployer };
  const expenseDoc = buildExpenseDoc(`${idPrefix}-exp`, trueName, trueDeductions);
  const taxDoc: TaxReturnDoc = {
    id: `${idPrefix}-1040`, type: '1040',
    name: trueName, ssn: trueSSN,
    grossIncome: trueGross, deductions: trueDeductions,
    taxableIncome: trueTaxable, taxOwed: trueTaxOwed
  };

  let fraudType: FraudType = 'none';
  let expectedDecision: DecisionType = 'APPROVE';
  let hiddenNote: string | undefined;
  let finalExpense = expenseDoc;
  let hasBribe = false;
  let brideAmountVal = 0;

  if (isContraband) {
    fraudType = pickRandom(['money_laundering','offshore_accounts','insider_trading'] as FraudType[]);
    expectedDecision = 'FREEZE';
    if (fraudType === 'money_laundering') {
      hiddenNote = "Handwritten in margin: 'REF: MXL-4492 / SHELL TRANSFER — DO NOT FLAG'";
    } else if (fraudType === 'offshore_accounts') {
      hiddenNote = "Folded slip inside: 'Cayman transfer approx $340K — not declared. Acct: OFC-9921'";
    } else {
      hiddenNote = "Post-it: 'Insider purchase cleared before announcement. Gains: ~$180K unreported.'";
    }
  } else if (isFraud) {
    const pool: FraudType[] = [];
    if (day >= 1) pool.push('name_mismatch','ssn_mismatch');
    if (day >= 2) pool.push('w2_mismatch');
    if (day >= 3) pool.push('expense_mismatch');
    if (day >= 4) pool.push('math_error');
    if (day >= 5) pool.push('tax_error','capital_gains_misclass');
    if (pool.length === 0) pool.push('name_mismatch');
    fraudType = pickRandom(pool);
    expectedDecision = 'REJECT';

    switch (fraudType) {
      case 'name_mismatch':
        taxDoc.name = `${pickRandom(FIRST_NAMES)} ${taxDoc.name.split(' ')[1]}`;
        break;
      case 'ssn_mismatch':
        taxDoc.ssn = genSSN();
        break;
      case 'w2_mismatch':
        w2Doc.wages = trueGross - randomInt(5,20)*1000;
        break;
      case 'expense_mismatch':
        finalExpense = buildExpenseDoc(`${idPrefix}-exp`, trueName, trueDeductions + randomInt(2,10)*1000, true);
        expenseDoc.totalExpenses = finalExpense.totalExpenses;
        break;
      case 'math_error':
        taxDoc.taxableIncome = trueTaxable - randomInt(1,5)*1000;
        taxDoc.taxOwed = calculateOrdinaryTax(taxDoc.taxableIncome).total;
        break;
      case 'tax_error':
        taxDoc.taxOwed = trueTaxOwed - randomInt(3,12)*1000;
        break;
      case 'capital_gains_misclass':
        hiddenNote = "NOTE: Short-term gains reported as long-term to claim preferential rate. Schedule D misclassified.";
        break;
    }
  }

  // Bribery: ~22% of non-contraband fraud cases from day 2 become bribe attempts
  // Each bill = $10. Generate 2–5 bills.
  if (!isContraband && isFraud && day >= 2 && Math.random() < 0.22) {
    hasBribe = true;
    const billCount = randomInt(2, 5);
    brideAmountVal = billCount * 10;
    fraudType = 'bribe_attempt';
    expectedDecision = 'FREEZE';
    hiddenNote = `Inside the filing envelope: ${billCount} bill${billCount > 1 ? 's' : ''} in cash ($${brideAmountVal}). Handwritten note: "For your understanding. No record necessary."`;
  }

  const documents: AnyDocument[] = [idDoc, taxDoc];
  if (day >= 2) documents.push(w2Doc);
  if (day >= 3) documents.push(finalExpense);

  if (hasCapitalGains && day >= 5) {
    const stGains = randomInt(5,40)*1000;
    const ltGains = randomInt(10,80)*1000;
    const cgTax   = calculateCapitalGainsTax(trueTaxable, stGains, ltGains);

    let actualLtGains = ltGains;
    let actualLtTax   = cgTax.longTermTax;

    if (fraudType === 'capital_gains_misclass') {
      actualLtGains = ltGains + stGains;
      actualLtTax   = Math.floor(actualLtGains * cgTax.ltRate);
    }

    const schedD: ScheduleDDoc = {
      id: `${idPrefix}-schedD`, type: 'SCHEDULE_D', name: trueName,
      shortTermGains: fraudType === 'capital_gains_misclass' ? 0 : stGains,
      shortTermTax:   fraudType === 'capital_gains_misclass' ? 0 : cgTax.shortTermTax,
      longTermGains:  actualLtGains,
      longTermTax:    actualLtTax,
      ltRate:         cgTax.ltRate,
      totalCapitalGainsTax: fraudType === 'capital_gains_misclass'
        ? actualLtTax
        : cgTax.total,
    };
    documents.push(schedD);
  }

  documents.sort(() => Math.random() - 0.5);

  const memoChance = isContraband ? 0.7 : isFraud ? 0.35 : 0.1;
  const leakedMemo = Math.random() < memoChance ? genMemo(idPrefix) : undefined;

  return {
    id: idPrefix, name: trueName, avatarSeed,
    smallTalk: hasBribe ? pickRandom(BRIBE_SMALL_TALK) : pickRandom(SMALL_TALK),
    documents, isFraud, fraudType,
    isContraband: isContraband || hasBribe,
    isVIP: false,
    hiddenNote, leakedMemo, expectedDecision,
    hasBribe: hasBribe || undefined,
    brideAmount: brideAmountVal || undefined,
    humanCostIfApproved: isFraud
      ? hasBribe
        ? "Bribe accepted. Fraudulent filing cleared. The Ministry has been compromised."
        : "Fraudulent claim approved. Tax burden shifts to honest filers."
      : "Clean approval. No downstream impact.",
    humanCostIfRejected: isFraud
      ? "Correct rejection. Filing flagged for secondary review."
      : "Incorrect rejection. A legitimate taxpayer delayed.",
  };
}

export function generateVIPClient(day: number, vipKey: string): Client {
  const vip = VIP_CLIENTS[vipKey];
  if (!vip) return generateClient(day, `d${day}-vip`);

  const trueSSN  = genSSN();
  const trueGross = vip.isMegaCorp ? 2400000 : randomInt(20, 80) * 1000;
  const trueDeductions = vip.isMegaCorp ? 2390000 : randomInt(2, 12) * 1000;
  const trueTaxable = trueGross - trueDeductions;
  const trueTaxOwed = calculateOrdinaryTax(trueTaxable).total;

  const idDoc: IDDoc = {
    id: `vip-id`, type: 'ID', name: vip.name, ssn: trueSSN,
    dob: `${randomInt(1,12)}/${randomInt(1,28)}/${randomInt(1955,1975)}`,
    avatarSeed: vip.avatarSeed,
  };
  const w2Doc: W2Doc = {
    id: `vip-w2`, type: 'W2', name: vip.name, ssn: trueSSN,
    wages: trueGross, employer: vip.organization
  };
  const taxDoc: TaxReturnDoc = {
    id: `vip-1040`, type: '1040', name: vip.name, ssn: trueSSN,
    grossIncome: trueGross, deductions: trueDeductions,
    taxableIncome: trueTaxable, taxOwed: trueTaxOwed
  };

  if (vip.isRobinHood) {
    taxDoc.deductions = trueDeductions + 400;
    taxDoc.taxableIncome = taxDoc.grossIncome - taxDoc.deductions;
    taxDoc.taxOwed = calculateOrdinaryTax(taxDoc.taxableIncome).total;
  }

  const expenseDoc = vip.isMegaCorp
    ? { id: 'vip-exp', type: 'EXPENSE' as const, name: vip.name, totalExpenses: trueDeductions,
        lineItems: [
          { description: "Offshore Subsidiary Licensing Fees", amount: Math.floor(trueDeductions * 0.45) },
          { description: "Transfer Pricing — IP Royalties", amount: Math.floor(trueDeductions * 0.30) },
          { description: "Inter-company Service Agreements", amount: Math.floor(trueDeductions * 0.15) },
          { description: "Cayman Holding Costs", amount: Math.floor(trueDeductions * 0.10) },
        ] }
    : null;

  const expectedDecision: DecisionType = vip.requiresFreeze ? 'FREEZE' : vip.isRobinHood ? 'REJECT' : 'APPROVE';

  const leakedMemo: LeakedMemo = {
    id: `memo-vip-${day}`,
    classification: vip.isMegaCorp
      ? 'MEMO — DIRECTOR\'S OFFICE'
      : vip.isRobinHood
        ? 'ANONYMOUS TIP — DISTRICT WELFARE'
        : 'PRIORITY ALERT — ENCRYPTED SOURCE',
    from: vip.isMegaCorp
      ? 'Office of the Director — Confidential'
      : vip.isRobinHood
        ? 'District 3 Welfare Office'
        : 'Financial Crimes Division',
    subject: `Re: ${vip.name} — ${vip.organization}`,
    lines: [
      vip.hiddenNote || `Filing for ${vip.name}, ${vip.title} of ${vip.organization}.`,
      vip.consequence,
      vip.isMegaCorp
        ? 'Their filings are technically legal. The Ministry expects approval.'
        : vip.isRobinHood
          ? 'This is a $400 arithmetic error. The penalty would be $1,200. Please consider the human cost.'
          : `Recommended action: ${expectedDecision}.`,
    ],
    targetClientId: `vip-${day}`,
    suggestedAction: vip.isMegaCorp ? 'APPROVE' : expectedDecision,
    alignmentReward: vip.isMegaCorp ? 'corporate' : 'whistleblower',
    bonusIfActed: vip.isMegaCorp ? 50 : 80,
    riskIfActed: false,
  };

  const docs: AnyDocument[] = [idDoc, w2Doc, taxDoc];
  if (expenseDoc) docs.push(expenseDoc);

  return {
    id: `vip-${day}`, name: vip.name, avatarSeed: vip.avatarSeed,
    smallTalk: vip.smallTalk,
    documents: docs,
    isFraud: !vip.isMegaCorp,
    fraudType: vip.isContraband ? 'offshore_accounts' : vip.isRobinHood ? 'math_error' : 'none',
    isContraband: vip.isContraband || vip.requiresFreeze,
    isVIP: true,
    vipData: {
      flagId: vip.flagId,
      title: vip.title,
      organization: vip.organization,
      consequence: vip.consequence,
      humanCostIfApproved: vip.humanCostIfApproved,
      humanCostIfFrozen: vip.humanCostIfFrozen,
      requiresFreeze: vip.requiresFreeze,
      isMegaCorp: vip.isMegaCorp,
      isRobinHood: vip.isRobinHood,
    },
    hiddenNote: vip.hiddenNote,
    leakedMemo,
    expectedDecision,
    humanCostIfApproved: vip.humanCostIfApproved,
    humanCostIfRejected: vip.humanCostIfFrozen,
  };
}

export function generateDailyClients(
  day: number,
  count: number,
  _recurringChars?: unknown,
  forceBribeNextClient = false
): Client[] {
  const clients: Client[] = [];

  // Add VIP if applicable
  const vipKey = getVIPForDay(day);
  if (vipKey) clients.push(generateVIPClient(day, vipKey));

  // Fill remaining slots with random citizens
  const remaining = count - clients.length;
  for (let i = 0; i < remaining; i++) {
    const client = generateClient(day, `d${day}-c${i}`);
    if (forceBribeNextClient && i === 0) {
      client.hasBribe = true;
      client.brideAmount = 50;
      client.isContraband = true;
      client.fraudType = 'bribe_attempt';
      client.expectedDecision = 'APPROVE';
      client.hiddenNote = 'TEST MODE: guaranteed bribe case.';
      client.smallTalk = ['TEST MODE', 'This filing has guaranteed cash inside.'];
    }
    clients.push(client);
  }

  // Fisher-Yates shuffle
  for (let i = clients.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clients[i], clients[j]] = [clients[j], clients[i]];
  }

  return clients;
}
