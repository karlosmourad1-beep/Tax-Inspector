import {
  RecurringCharId, RecurringCharState, DisguiseType,
  Client, AnyDocument, IDDoc, W2Doc, TaxReturnDoc, ExpenseDoc,
  FraudType, DecisionType,
} from '../types/game';
import { calculateOrdinaryTax } from './taxBrackets';
import { randomInt } from './utils';

// ─── Fixed seeds for consistent face rendering ────────────────────────────────
export const RECURRING_SEEDS: Record<RecurringCharId, number> = {
  harold_bentley: 7001,
  maria_lopez:    7002,
  adrian_kell:    7003,
  darius_reed:    7004,
  vantex_corp:    7005,
};

// ─── Appearance schedule: day → characters who appear that day ────────────────
// VIP clients occupy one slot on days 2-6; recurring fill remaining slots.
export const RECURRING_SCHEDULE: Record<number, RecurringCharId[]> = {
  1: ['harold_bentley', 'darius_reed'],
  2: ['adrian_kell'],
  3: ['harold_bentley', 'adrian_kell'],
  4: ['maria_lopez', 'darius_reed', 'adrian_kell'],
  5: ['harold_bentley'],
  6: ['maria_lopez'],
  7: ['darius_reed'],
};

function genSSN(): string {
  return `${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(1000, 9999)}`;
}

function stampAvatar(docs: AnyDocument[], seed: number, disguise?: string): AnyDocument[] {
  return docs.map(d => d.type === 'ID' ? { ...d, avatarSeed: seed, disguise } as IDDoc : d);
}

// ─── Helpers to build document sets ──────────────────────────────────────────
function buildCleanDocs(
  prefix: string, name: string, ssn: string,
  gross: number, deductions: number
): AnyDocument[] {
  const taxable = gross - deductions;
  const taxOwed = calculateOrdinaryTax(taxable).total;
  const id:  IDDoc        = { id: `${prefix}-id`,   type: 'ID',   name, ssn, dob: '4/15/1968' };
  const w2:  W2Doc        = { id: `${prefix}-w2`,   type: 'W2',   name, ssn, wages: gross, employer: 'District Utilities' };
  const tax: TaxReturnDoc = { id: `${prefix}-1040`, type: '1040', name, ssn, grossIncome: gross, deductions, taxableIncome: taxable, taxOwed };
  return [id, w2, tax];
}

function buildMathErrorDocs(
  prefix: string, name: string, ssn: string,
  gross: number, deductions: number
): { docs: AnyDocument[]; fraudType: FraudType } {
  const taxable = gross - deductions;
  const taxOwed = calculateOrdinaryTax(taxable).total;
  const id:  IDDoc        = { id: `${prefix}-id`,   type: 'ID',   name, ssn, dob: '4/15/1968' };
  const w2:  W2Doc        = { id: `${prefix}-w2`,   type: 'W2',   name, ssn, wages: gross, employer: 'District Utilities' };
  // Math error: taxable income is wrong
  const wrongTaxable = taxable - randomInt(2, 6) * 1000;
  const wrongTaxOwed = calculateOrdinaryTax(wrongTaxable).total;
  const tax: TaxReturnDoc = { id: `${prefix}-1040`, type: '1040', name, ssn, grossIncome: gross, deductions, taxableIncome: wrongTaxable, taxOwed: wrongTaxOwed };
  return { docs: [id, w2, tax], fraudType: 'math_error' };
}

function buildExpenseMismatchDocs(
  prefix: string, name: string, ssn: string,
  gross: number
): { docs: AnyDocument[]; fraudType: FraudType } {
  const declared = 12000;
  const actual   = 18500;
  const taxable  = gross - declared;
  const taxOwed  = calculateOrdinaryTax(taxable).total;
  const id:  IDDoc        = { id: `${prefix}-id`,   type: 'ID',   name, ssn, dob: '4/15/1968' };
  const w2:  W2Doc        = { id: `${prefix}-w2`,   type: 'W2',   name, ssn, wages: gross, employer: 'District Utilities' };
  const tax: TaxReturnDoc = { id: `${prefix}-1040`, type: '1040', name, ssn, grossIncome: gross, deductions: declared, taxableIncome: taxable, taxOwed };
  const exp: ExpenseDoc   = {
    id: `${prefix}-exp`, type: 'EXPENSE', name, totalExpenses: actual,
    lineItems: [
      { description: 'Home Office', amount: 8000 },
      { description: 'Office Supplies', amount: 5500, isSuspect: false },
      { description: 'Professional Development', amount: 5000, isSuspect: false },
    ]
  };
  return { docs: [id, w2, tax, exp], fraudType: 'expense_mismatch' };
}

function buildW2MismatchDocs(
  prefix: string, name: string, ssn: string,
  gross: number
): { docs: AnyDocument[]; fraudType: FraudType } {
  const w2Wages = gross - randomInt(8, 20) * 1000;
  const taxable = gross - 5000;
  const taxOwed = calculateOrdinaryTax(taxable).total;
  const id:  IDDoc        = { id: `${prefix}-id`,   type: 'ID',   name, ssn, dob: '3/22/1981' };
  const w2:  W2Doc        = { id: `${prefix}-w2`,   type: 'W2',   name, ssn, wages: w2Wages, employer: 'Kell & Associates' };
  const tax: TaxReturnDoc = { id: `${prefix}-1040`, type: '1040', name, ssn, grossIncome: gross, deductions: 5000, taxableIncome: taxable, taxOwed };
  return { docs: [id, w2, tax], fraudType: 'w2_mismatch' };
}

function buildFraudOfficialDocs(
  prefix: string, name: string, altName: string, ssn: string
): { docs: AnyDocument[]; fraudType: FraudType } {
  const gross   = 95000;
  const taxable = gross - 15000;
  const taxOwed = calculateOrdinaryTax(taxable).total;
  const id:  IDDoc        = { id: `${prefix}-id`,   type: 'ID',   name: altName, ssn, dob: '3/22/1981' };
  const w2:  W2Doc        = { id: `${prefix}-w2`,   type: 'W2',   name,          ssn, wages: gross,  employer: 'Kell & Associates' };
  const tax: TaxReturnDoc = { id: `${prefix}-1040`, type: '1040', name,          ssn, grossIncome: gross, deductions: 15000, taxableIncome: taxable, taxOwed };
  return { docs: [id, w2, tax], fraudType: 'name_mismatch' };
}

// ─── Consequence messages ─────────────────────────────────────────────────────
export const RECURRING_CONSEQUENCES: Record<RecurringCharId, { approved: string; rejected: string; frozen: string }> = {
  harold_bentley: {
    approved: 'Harold Bentley\'s filing was processed. He did not return.',
    rejected: 'Harold Bentley was turned away. He did not return.',
    frozen:   'Harold Bentley\'s assets were flagged. No further contact.',
  },
  maria_lopez: {
    approved: 'Benefits restored. Maria Lopez\'s household stayed afloat.',
    rejected: 'Benefits suspended. Maria Lopez did not return.',
    frozen:   'Maria Lopez\'s wages were placed under lien.',
  },
  adrian_kell: {
    approved: 'Adrian Kell was approved. Fraud ring activity traced to prior approvals.',
    rejected: 'Adrian Kell rejected. Pattern disrupted.',
    frozen:   'Adrian Kell frozen. Fraud ring uncovered. Major enforcement action follows.',
  },
  darius_reed: {
    approved: 'Darius Reed thanked the office in writing. Third consecutive clean filing.',
    rejected: 'Darius Reed filed a formal complaint. Investigation cleared him.',
    frozen:   'Darius Reed\'s freeze was overturned on appeal. Citation issued against clerk.',
  },
  vantex_corp: {
    approved: 'Vantex Group approved. Deductions upheld. No further review.',
    rejected: 'Vantex Group rejected. Corporate lawyers have filed a counter-complaint.',
    frozen:   'Vantex Group frozen. Audit reveals wider systemic abuse.',
  },
};

// ─── Main factory ─────────────────────────────────────────────────────────────
export function generateRecurringClient(
  charId: RecurringCharId,
  state:  RecurringCharState,
  day:    number
): Client {
  const seed      = RECURRING_SEEDS[charId];
  const appeared  = state.lastSeenDay > 0 ? (state.timesApproved + state.timesRejected + state.timesFrozen) : 0;

  let client: Client;
  switch (charId) {
    case 'harold_bentley': client = buildHarold(seed, state, day, appeared); break;
    case 'maria_lopez':    client = buildMaria(seed, state, day, appeared);  break;
    case 'adrian_kell':    client = buildAdrian(seed, state, day, appeared); break;
    case 'darius_reed':    client = buildDarius(seed, state, day, appeared); break;
    case 'vantex_corp':    client = buildVantex(seed, state, day, appeared); break;
  }

  // Stamp avatar seed + disguise onto the ID doc so the portrait shows on the ID card
  const stamped = stampAvatar(client.documents, seed, client.disguise ?? 'none');
  return { ...client, documents: stamped };
}

// ─── HAROLD BENTLEY ───────────────────────────────────────────────────────────
function buildHarold(seed: number, state: RecurringCharState, day: number, appeared: number): Client {
  const ssn   = '442-07-8831';
  const name  = 'Harold Bentley';
  const gross = 38000;
  const prefix = `harold-d${day}`;

  let disguise: DisguiseType      = 'none';
  let smallTalk: string[]         = [];
  let docs: AnyDocument[]         = [];
  let fraudType: FraudType        = 'none';
  let expectedDecision: DecisionType = 'APPROVE';
  let humanCostIfApproved         = '';
  let humanCostIfRejected         = '';

  if (appeared === 0) {
    // First visit — small math error
    disguise    = 'none';
    const built = buildMathErrorDocs(prefix, name, ssn, gross, 4000);
    docs = built.docs; fraudType = built.fraudType;
    expectedDecision  = 'REJECT';
    smallTalk = ['First time filing.', 'Hope I did this right.'];
    humanCostIfApproved = 'A calculation error overlooked. $3K underpayment passes through.';
    humanCostIfRejected = 'Correct rejection. Bentley will need to refile.';
  } else if (appeared === 1) {
    // Second visit — has glasses, still has expense issue
    disguise = 'glasses';
    if (state.timesApproved === 0) {
      // Was rejected last time — trying to fix it, still has issues
      const built = buildExpenseMismatchDocs(prefix, name, ssn, gross);
      docs = built.docs; fraudType = built.fraudType;
      expectedDecision = 'REJECT';
      smallTalk = ['They sent me back.', 'I tried to fix it, but I may have made another mistake.'];
      humanCostIfApproved = 'Expense discrepancy passed. $6.5K mismatch undetected.';
      humanCostIfRejected = 'Second rejection. Harold leaves looking defeated.';
    } else {
      // Was approved last time — he's grateful, filing is cleaner (but still one small issue)
      const built = buildMathErrorDocs(prefix, name, ssn, gross, 4000);
      docs = built.docs; fraudType = built.fraudType;
      expectedDecision = 'REJECT';
      smallTalk = ['Thank you for helping last time.', 'I still have one small problem, I think.'];
      humanCostIfApproved = 'Minor math error passed.';
      humanCostIfRejected = 'Harold notes the error and will refile again.';
    }
  } else {
    // Third visit — hat + glasses. Adapts based on history.
    disguise = 'glasses_hat';
    if (state.timesApproved >= 1) {
      // Was helped at least once — he finally got it right
      docs = buildCleanDocs(prefix, name, ssn, gross, 4000);
      fraudType = 'none';
      expectedDecision = 'APPROVE';
      smallTalk = ['I think I finally got it.', 'Someone helped me before. I followed their notes.'];
      humanCostIfApproved = 'Clean filing. Harold thanks you on his way out.';
      humanCostIfRejected = 'Wrongful rejection. Harold\'s correct filing was denied.';
    } else {
      // Rejected every time — still struggling
      const built = buildMathErrorDocs(prefix, name, ssn, gross, 4000);
      docs = built.docs; fraudType = built.fraudType;
      expectedDecision = 'REJECT';
      smallTalk = ['Please.', 'I cannot afford another rejection.'];
      humanCostIfApproved = 'Math error approved again.';
      humanCostIfRejected = 'Harold leaves quietly. He does not return after this.';
    }
  }

  return {
    id: prefix, name, avatarSeed: seed,
    smallTalk, documents: docs,
    isFraud: fraudType !== 'none',
    fraudType, isContraband: false, isVIP: false,
    expectedDecision,
    humanCostIfApproved, humanCostIfRejected,
    recurringId: 'harold_bentley',
    disguise,
    appearanceNumber: appeared + 1,
  };
}

// ─── MARIA LOPEZ ──────────────────────────────────────────────────────────────
function buildMaria(seed: number, state: RecurringCharState, day: number, appeared: number): Client {
  const ssn    = '387-54-2219';
  const name   = 'Maria Lopez';
  const gross  = 34000;
  const prefix = `maria-d${day}`;

  let disguise: DisguiseType      = 'none';
  let smallTalk: string[]         = [];
  let docs: AnyDocument[]         = [];
  let fraudType: FraudType        = 'none';
  let expectedDecision: DecisionType = 'APPROVE';
  let humanCostIfApproved         = '';
  let humanCostIfRejected         = '';

  if (appeared === 0) {
    disguise = 'none';
    const built = buildMathErrorDocs(prefix, name, ssn, gross, 3500);
    docs = built.docs; fraudType = built.fraudType;
    expectedDecision = 'REJECT';
    smallTalk = ['Please, I just need this approved.', "My kids are waiting outside."];
    humanCostIfApproved = 'Math error passed. Benefits remain active on incorrect filing.';
    humanCostIfRejected = 'Correct rejection. Maria will need to fix and refile.';
  } else {
    disguise = 'hat';
    if (state.timesApproved >= 1) {
      // Was helped — she fixed everything
      docs = buildCleanDocs(prefix, name, ssn, gross, 3500);
      fraudType = 'none';
      expectedDecision = 'APPROVE';
      smallTalk = ['I fixed what you flagged.', "I hope it's right this time."];
      humanCostIfApproved = 'Clean filing. Benefits continue. Maria\'s household stays afloat.';
      humanCostIfRejected = 'Wrongful rejection. Correct filing denied. Benefits suspended.';
    } else {
      // Was rejected — desperate
      const built = buildExpenseMismatchDocs(prefix, name, ssn, gross);
      docs = built.docs; fraudType = built.fraudType;
      expectedDecision = 'REJECT';
      smallTalk = ['My benefits stop if this fails again.', 'Please.'];
      humanCostIfApproved = 'Expense error passed. Benefits continue, underpayment unreported.';
      humanCostIfRejected = 'Second rejection. Benefits suspended. Maria Lopez does not return.';
    }
  }

  return {
    id: prefix, name, avatarSeed: seed,
    smallTalk, documents: docs,
    isFraud: fraudType !== 'none',
    fraudType, isContraband: false, isVIP: false,
    expectedDecision,
    humanCostIfApproved, humanCostIfRejected,
    recurringId: 'maria_lopez',
    disguise,
    appearanceNumber: appeared + 1,
  };
}

// ─── ADRIAN KELL ──────────────────────────────────────────────────────────────
function buildAdrian(seed: number, state: RecurringCharState, day: number, appeared: number): Client {
  const ssn    = '509-77-3344';
  const prefix = `adrian-d${day}`;

  let name: string                = 'Adrian Kell';
  let disguise: DisguiseType      = 'none';
  let smallTalk: string[]         = [];
  let docs: AnyDocument[]         = [];
  let fraudType: FraudType        = 'none';
  let expectedDecision: DecisionType = 'APPROVE';
  let humanCostIfApproved         = '';
  let humanCostIfRejected         = '';
  let hiddenNote: string | undefined;

  const gross = 88000;

  if (appeared === 0) {
    // First appearance — clean, charming
    disguise = 'none';
    docs = buildCleanDocs(prefix, name, ssn, gross, 12000);
    fraudType = 'none';
    expectedDecision = 'APPROVE';
    smallTalk = ['Everything should be in order.', 'I keep excellent records.'];
    humanCostIfApproved = 'Clean filing. No issues detected.';
    humanCostIfRejected = 'Wrongful rejection. Adrian Kell\'s clean filing was denied.';
  } else if (appeared === 1) {
    // Second appearance — fake mustache, subtle W2 mismatch
    disguise = 'mustache';
    const built = buildW2MismatchDocs(prefix, name, ssn, gross);
    docs = built.docs; fraudType = built.fraudType;
    expectedDecision = 'REJECT';
    smallTalk = ['New filing. No problems.', 'Different quarter, same story — everything checks out.'];
    humanCostIfApproved = 'W-2 income discrepancy undetected. $12K income gap unreported.';
    humanCostIfRejected = 'W-2 mismatch caught. Pattern flagged for review.';
  } else {
    // Third appearance — silly disguise, name mismatch
    disguise = 'glasses_mustache';
    name = 'A. Kellner';
    const built = buildFraudOfficialDocs(prefix, 'Adrian Kell', 'A. Kellner', genSSN());
    docs = built.docs; fraudType = built.fraudType;
    expectedDecision = 'FREEZE';
    hiddenNote = "ID NAME: A. Kellner — W-2 NAME: Adrian Kell — INCONSISTENT. Third filing this quarter under different identities.";
    smallTalk = ['You must be mistaken.', 'These are in perfect order.'];
    humanCostIfApproved = 'Identity fraud passed. Third distinct identity cleared. Fraud ring expands.';
    humanCostIfRejected = 'Should have been a Freeze — pattern fraud was present. Citation issued.';
  }

  return {
    id: prefix, name, avatarSeed: seed,
    smallTalk, documents: docs,
    isFraud: fraudType !== 'none',
    fraudType, isContraband: appeared >= 2, isVIP: false,
    expectedDecision,
    humanCostIfApproved, humanCostIfRejected,
    hiddenNote,
    recurringId: 'adrian_kell',
    disguise,
    appearanceNumber: appeared + 1,
  };
}

// ─── DARIUS REED ─────────────────────────────────────────────────────────────
function buildDarius(seed: number, state: RecurringCharState, day: number, appeared: number): Client {
  const ssn    = '228-91-5507';
  const name   = 'Darius Reed';
  const gross  = 56000;
  const prefix = `darius-d${day}`;

  const disguise: DisguiseType = 'none';
  let smallTalk: string[]      = [];
  let docs: AnyDocument[]      = [];

  docs = buildCleanDocs(prefix, name, ssn, gross, 7500);

  if (appeared === 0) {
    smallTalk = ['Just a normal filing.', 'Nothing fancy here.'];
  } else if (appeared === 1) {
    const rejectedBefore = state.timesRejected > 0;
    smallTalk = rejectedBefore
      ? ['They flagged me for no reason last time.', 'Everything is exactly the same. Still clean.']
      : ['Back again. Same situation as before.', 'Everything should match.'];
  } else {
    const rejectedBefore = state.timesRejected > 0;
    smallTalk = rejectedBefore
      ? ['This is the third time.', 'My lawyer says I have a case.']
      : ['Third filing.', 'Clean as always.'];
  }

  const humanCostIfRejected = state.timesRejected >= 1
    ? 'Repeated wrongful rejection. Darius Reed has hired a lawyer. Formal complaint filed.'
    : 'Wrongful rejection of a legitimate citizen.';

  return {
    id: prefix, name, avatarSeed: seed,
    smallTalk, documents: docs,
    isFraud: false,
    fraudType: 'none', isContraband: false, isVIP: false,
    expectedDecision: 'APPROVE',
    humanCostIfApproved: 'Clean approval. Darius Reed files correctly every time.',
    humanCostIfRejected,
    recurringId: 'darius_reed',
    disguise,
    appearanceNumber: appeared + 1,
  };
}

// ─── VANTEX CORP ─────────────────────────────────────────────────────────────
function buildVantex(seed: number, state: RecurringCharState, day: number, appeared: number): Client {
  const ssn    = '701-44-9987';
  const name   = 'V. Hartwell';
  const prefix = `vantex-d${day}`;

  let disguise: DisguiseType      = 'none';
  let smallTalk: string[]         = [];
  let docs: AnyDocument[]         = [];
  let fraudType: FraudType        = 'none';
  let expectedDecision: DecisionType = 'APPROVE';
  let humanCostIfApproved         = '';
  let humanCostIfRejected         = '';
  let hiddenNote: string | undefined;

  const gross = 240000;

  if (appeared === 0) {
    disguise = 'none';
    docs = buildCleanDocs(prefix, name, ssn, gross, 40000);
    fraudType = 'none';
    expectedDecision = 'APPROVE';
    smallTalk = ['Priority filing. Vantex Group.', 'Everything is handled by our legal team.'];
    humanCostIfApproved = 'Corporate filing cleared. High-income tax structure is legal.';
    humanCostIfRejected = 'Wrongful rejection. Corporate filing was technically compliant.';
  } else if (appeared === 1) {
    disguise = 'corporate_badge';
    const built = buildExpenseMismatchDocs(prefix, name, ssn, gross);
    docs = built.docs; fraudType = built.fraudType;
    expectedDecision = 'REJECT';
    hiddenNote = "EXPENSE REPORT: $18,500 claimed. 1040 deduction: $12,000. $6,500 gap unexplained.";
    smallTalk = ['Fast-track requested.', 'We have a time-sensitive filing window.'];
    humanCostIfApproved = '$6.5K deduction gap passed. Repeated abuse of expense classification.';
    humanCostIfRejected = 'Corporate expense mismatch caught. Penalty applied.';
  } else {
    disguise = 'glasses';
    docs = buildCleanDocs(prefix, name, ssn, gross, 40000);
    fraudType = 'none';
    expectedDecision = 'APPROVE';
    hiddenNote = "INTERNAL NOTE: 'The Ministry expects cooperation on Vantex filings.' — Director's Office Memo 7-C.";
    smallTalk = ['The Ministry expects cooperation.', 'I trust there will be no issues today.'];
    humanCostIfApproved = 'Filing cleared under political pressure. Pattern of expedited approvals noted in audit log.';
    humanCostIfRejected = 'Rejected despite political memo. Vantex files formal complaint. Director notified.';
  }

  return {
    id: prefix, name: 'V. Hartwell', avatarSeed: seed,
    smallTalk, documents: docs,
    isFraud: fraudType !== 'none',
    fraudType, isContraband: false, isVIP: false,
    expectedDecision,
    humanCostIfApproved, humanCostIfRejected,
    hiddenNote,
    recurringId: 'vantex_corp',
    disguise,
    appearanceNumber: appeared + 1,
  };
}

// ─── Default state factory ────────────────────────────────────────────────────
export function defaultCharState(id: RecurringCharId): RecurringCharState {
  return { id, timesApproved: 0, timesRejected: 0, timesFrozen: 0, lastSeenDay: 0, resolved: false, disappeared: false };
}

export const ALL_RECURRING_IDS: RecurringCharId[] = [
  'harold_bentley', 'maria_lopez', 'adrian_kell', 'darius_reed', 'vantex_corp'
];
