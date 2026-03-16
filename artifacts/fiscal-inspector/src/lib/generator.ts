import { Client, AnyDocument, TaxReturnDoc, W2Doc, ExpenseDoc, IDDoc, FraudType, LeakedMemo, DecisionType } from '../types/game';
import { randomInt, pickRandom } from './utils';
import { VIP_CLIENTS, getVIPForDay } from './narrative';

const FIRST_NAMES = ["James", "Carla", "David", "Sarah", "Michael", "Elena", "Robert", "Maria", "Wei", "Aisha", "Frank", "Donna", "Leon", "Petra", "Oscar", "Nadia", "Brett", "Yuna"];
const LAST_NAMES = ["Morton", "Voss", "Chen", "Smith", "Johnson", "Garcia", "Brown", "Miller", "Kim", "Patel", "Webb", "Russo", "Mori", "Diaz", "Novak", "Flynn", "Osei", "Tanaka"];
const EMPLOYERS = ["Initech", "Umbrella Corp", "Massive Dynamic", "Soylent", "Globex", "Stark Ind.", "Cyberdyne", "Omni Consumer", "NovaCorp", "Helix Ventures"];

const SMALL_TALK_LINES: string[][] = [
  ["Morning. Hope this is quick.", "I got a dentist appointment after this."],
  ["These forms took me all weekend, I'll have you know.", "Coffee machine at work broke again too. Rough week."],
  ["Just moved to the district. Third time this year.", "Anyway, everything should be in order."],
  ["My accountant said this was routine.", "...He's new. Very new."],
  ["The kids are driving me crazy.", "Sorry. Not relevant. Here are my documents."],
  ["Is it warm in here? Just me?", "Let's just get this over with, please."],
  ["I heard you folks have a quota.", "Not that it matters. I'm clean as a whistle."],
  ["First time filing in this district.", "The last clerk was... friendlier."],
  ["I've been coming here for eleven years.", "Same documents, same desk, different face every time."],
  ["My cat knocked my W-2 into the sink this morning.", "Dried it out though. Should be fine."],
  ["I'm a very straightforward person.", "Very. Straightforward."],
  ["Do you validate parking? No?", "Figures."],
  ["The line outside was insane.", "You'd think people never filed taxes before."],
  ["I prepared everything digitally first.", "Then printed it. Then reprinted it. Just to be safe."],
  ["Don't mind me, I talk when I'm nervous.", "Not that I have any reason to be nervous. Ha."],
  ["My neighbor said just smile and it goes faster.", "I don't think that's how auditing works, but here we are."],
  ["The forms changed again this year.", "I miss the old forms. Simple. Clean."],
];

const LEAKED_MEMO_TEMPLATES = [
  {
    classification: 'CONFIDENTIAL — SOURCE: INTERNAL AUDIT',
    from: 'Audit Division — Anonymous',
    subject: 'Discrepancy Alert: Current Applicant',
    lines: [
      'Our internal cross-reference shows this applicant\'s declared income does not match their registered employer\'s payroll database.',
      'Three prior filings from this address were flagged and quietly cleared under Director Halverson.',
      'We believe this is part of a coordinated income-shifting scheme.',
      'Recommended action: DENY. Proceed at your own discretion.',
    ],
    suggestedAction: 'REJECT' as DecisionType,
    alignmentReward: 'whistleblower' as const,
    bonusIfActed: 40,
    riskIfActed: false,
  },
  {
    classification: 'LEAKED — SOURCE: UNKNOWN TERMINAL',
    from: 'Signal: Node-7',
    subject: 'Do Not Approve This Filing',
    lines: [
      'The person standing at your window is a shell-company operator.',
      'The employer listed on their W-2 does not exist. "NovaCorp" was dissolved in 2019.',
      'Their declared wages are routed through a holding account — ref: NCX-8812.',
      'If you approve, those funds bypass taxation permanently.',
      'Trust your eyes. The numbers don\'t add up.',
    ],
    suggestedAction: 'REJECT' as DecisionType,
    alignmentReward: 'whistleblower' as const,
    bonusIfActed: 55,
    riskIfActed: true,
  },
  {
    classification: 'MEMO — PRIORITY: HIGH',
    from: 'Office of the Deputy Director',
    subject: 'Expedited Processing Request',
    lines: [
      'This citizen has been flagged for ACCELERATED APPROVAL by the Director\'s office.',
      'You are expected to process without standard scrutiny.',
      'Failure to approve will be noted in your performance file.',
      'The Ministry thanks you for your cooperation.',
    ],
    suggestedAction: 'APPROVE' as DecisionType,
    alignmentReward: 'corporate' as const,
    bonusIfActed: 30,
    riskIfActed: false,
  },
];

function generateSSN(): string {
  return `${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(1000, 9999)}`;
}

function generateDOB(): string {
  return `${randomInt(1, 12)}/${randomInt(1, 28)}/${randomInt(1950, 1999)}`;
}

function generateLeakedMemo(clientId: string): LeakedMemo {
  const template = pickRandom(LEAKED_MEMO_TEMPLATES);
  return {
    id: `memo-${clientId}`,
    targetClientId: clientId,
    ...template,
  };
}

export function generateClient(day: number, idPrefix: string): Client {
  const fraudChance = Math.min(0.3 + (day * 0.05), 0.65);
  const isFraud = Math.random() < fraudChance;
  const isContraband = isFraud && day >= 4 && Math.random() < 0.25;

  const firstName = pickRandom(FIRST_NAMES);
  const lastName = pickRandom(LAST_NAMES);
  const trueName = `${firstName} ${lastName}`;
  const trueSSN = generateSSN();
  const trueDOB = generateDOB();
  const trueEmployer = pickRandom(EMPLOYERS);
  const avatarSeed = randomInt(1, 4999);
  const smallTalk = pickRandom(SMALL_TALK_LINES);

  const trueGross = randomInt(30, 150) * 1000;
  const trueDeductions = randomInt(0, 20) * 1000;
  const trueTaxable = trueGross - trueDeductions;
  const trueTaxOwed = Math.floor(trueTaxable * 0.15);

  const idDoc: IDDoc = { id: `${idPrefix}-id`, type: 'ID', name: trueName, ssn: trueSSN, dob: trueDOB };
  const w2Doc: W2Doc = { id: `${idPrefix}-w2`, type: 'W2', name: trueName, ssn: trueSSN, wages: trueGross, employer: trueEmployer };
  const expenseDoc: ExpenseDoc = { id: `${idPrefix}-exp`, type: 'EXPENSE', name: trueName, totalExpenses: trueDeductions };
  const taxDoc: TaxReturnDoc = {
    id: `${idPrefix}-1040`,
    type: '1040',
    name: trueName,
    ssn: trueSSN,
    grossIncome: trueGross,
    deductions: trueDeductions,
    taxableIncome: trueTaxable,
    taxOwed: trueTaxOwed
  };

  let fraudType: FraudType = 'none';
  let expectedDecision: DecisionType = 'APPROVE';
  let hiddenNote: string | undefined;

  if (isContraband) {
    fraudType = pickRandom(['money_laundering', 'offshore_accounts', 'insider_trading'] as FraudType[]);
    expectedDecision = 'FREEZE';
    // Encode a hidden clue in the documents
    if (fraudType === 'money_laundering') {
      taxDoc.grossIncome = randomInt(8, 20) * 100000;
      taxDoc.taxableIncome = taxDoc.grossIncome - taxDoc.deductions;
      taxDoc.taxOwed = Math.floor(taxDoc.taxableIncome * 0.15);
      hiddenNote = "Handwritten in margin: 'REF: MXL-4492 / SHELL TRANSFER — DO NOT FLAG'";
    } else if (fraudType === 'offshore_accounts') {
      hiddenNote = "Folded slip inside: 'Cayman transfer approx $340K — not declared. Acct: OFC-9921'";
    } else {
      hiddenNote = "Post-it attached: 'Insider purchase cleared before public announcement. Gains: ~$180K unreported.'";
    }
  } else if (isFraud) {
    const possibleFrauds: FraudType[] = [];
    if (day >= 1) possibleFrauds.push('name_mismatch', 'ssn_mismatch');
    if (day >= 2) possibleFrauds.push('w2_mismatch');
    if (day >= 3) possibleFrauds.push('expense_mismatch');
    if (day >= 4) possibleFrauds.push('math_error');
    if (day >= 5) possibleFrauds.push('tax_error');
    if (possibleFrauds.length === 0) possibleFrauds.push('name_mismatch');
    fraudType = pickRandom(possibleFrauds);
    expectedDecision = 'REJECT';

    switch (fraudType) {
      case 'name_mismatch':
        taxDoc.name = `${pickRandom(FIRST_NAMES)} ${taxDoc.name.split(' ')[1]}`;
        break;
      case 'ssn_mismatch':
        taxDoc.ssn = generateSSN();
        break;
      case 'w2_mismatch':
        w2Doc.wages = trueGross - randomInt(5, 20) * 1000;
        break;
      case 'expense_mismatch':
        expenseDoc.totalExpenses = trueDeductions + randomInt(2, 10) * 1000;
        break;
      case 'math_error':
        taxDoc.taxableIncome = trueTaxable - randomInt(1, 5) * 1000;
        taxDoc.taxOwed = Math.floor(taxDoc.taxableIncome * 0.15);
        break;
      case 'tax_error':
        taxDoc.taxOwed = trueTaxOwed - randomInt(1, 5) * 1000;
        break;
    }
  }

  const documents: AnyDocument[] = [idDoc, taxDoc];
  if (day >= 2) documents.push(w2Doc);
  if (day >= 3) documents.push(expenseDoc);
  documents.sort(() => Math.random() - 0.5);

  // 20% chance of a leaked memo (more likely on fraud/contraband cases)
  const memoChance = isContraband ? 0.7 : isFraud ? 0.35 : 0.1;
  const leakedMemo = Math.random() < memoChance ? generateLeakedMemo(idPrefix) : undefined;

  return {
    id: idPrefix,
    name: trueName,
    avatarSeed,
    smallTalk,
    documents,
    isFraud,
    fraudType,
    isContraband,
    isVIP: false,
    hiddenNote,
    leakedMemo,
    expectedDecision,
    humanCostIfApproved: isFraud
      ? "Fraudulent claim approved. Tax burden shifts to honest filers."
      : "Clean approval. No downstream impact.",
    humanCostIfRejected: isFraud
      ? "Correct rejection. Filing flagged for secondary review."
      : "Incorrect rejection. A legitimate taxpayer delayed.",
  };
}

export function generateVIPClient(day: number, vipKey: string): Client {
  const vip = VIP_CLIENTS[vipKey];
  if (!vip) return generateClient(day, `d${day}-vip`);

  const trueSSN = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const trueGross = randomInt(180, 500) * 1000;
  const trueDeductions = randomInt(20, 80) * 1000;
  const trueTaxable = trueGross - trueDeductions;
  const trueTaxOwed = Math.floor(trueTaxable * 0.15);

  const idDoc: IDDoc = {
    id: `vip-id`, type: 'ID', name: vip.name, ssn: trueSSN,
    dob: `${Math.floor(1 + Math.random() * 11)}/${Math.floor(1 + Math.random() * 27)}/${Math.floor(1955 + Math.random() * 20)}`
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

  const expectedDecision: DecisionType = vip.requiresFreeze ? 'FREEZE' : vip.isContraband ? 'FREEZE' : 'REJECT';

  const leakedMemo: LeakedMemo = {
    id: `memo-vip-${day}`,
    classification: 'PRIORITY ALERT — ENCRYPTED SOURCE',
    from: vip.requiresFreeze ? 'Financial Crimes Division' : 'Anonymous — Internal',
    subject: `Re: ${vip.name} — ${vip.organization}`,
    lines: [
      `Filing for ${vip.name}, ${vip.title} of ${vip.organization}.`,
      vip.hiddenNote || `This individual has connections to active investigations.`,
      vip.consequence,
      vip.requiresFreeze ? 'RECOMMENDED ACTION: FREEZE ASSETS' : 'RECOMMENDED ACTION: DENY',
    ],
    targetClientId: `vip-${day}`,
    suggestedAction: expectedDecision,
    alignmentReward: 'whistleblower',
    bonusIfActed: 80,
    riskIfActed: false,
  };

  return {
    id: `vip-${day}`,
    name: vip.name,
    avatarSeed: vip.avatarSeed,
    smallTalk: vip.smallTalk,
    documents: [idDoc, w2Doc, taxDoc],
    isFraud: true,
    fraudType: vip.requiresFreeze ? 'offshore_accounts' : 'name_mismatch',
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
    },
    hiddenNote: vip.hiddenNote,
    leakedMemo,
    expectedDecision,
    humanCostIfApproved: vip.humanCostIfApproved,
    humanCostIfRejected: vip.humanCostIfFrozen,
  };
}

export function generateDailyClients(day: number, count: number): Client[] {
  const clients: Client[] = [];
  const vipKey = getVIPForDay(day);
  const vipPosition = vipKey ? Math.floor(Math.random() * count) : -1;

  for (let i = 0; i < count; i++) {
    if (i === vipPosition && vipKey) {
      clients.push(generateVIPClient(day, vipKey));
    } else {
      clients.push(generateClient(day, `d${day}-c${i}`));
    }
  }
  return clients;
}
