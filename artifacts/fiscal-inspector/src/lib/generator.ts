import { Client, AnyDocument, TaxReturnDoc, W2Doc, ExpenseDoc, IDDoc, FraudType } from '../types/game';
import { randomInt, pickRandom } from './utils';

const FIRST_NAMES = ["James", "Carla", "David", "Sarah", "Michael", "Elena", "Robert", "Maria", "Wei", "Aisha", "Frank", "Donna", "Leon", "Petra", "Oscar"];
const LAST_NAMES = ["Morton", "Voss", "Chen", "Smith", "Johnson", "Garcia", "Brown", "Miller", "Kim", "Patel", "Webb", "Russo", "Mori", "Diaz", "Novak"];
const EMPLOYERS = ["Initech", "Umbrella Corp", "Massive Dynamic", "Soylent", "Globex", "Stark Ind.", "Cyberdyne", "Omni Consumer", "Weyland-Yutani"];

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
];

function generateSSN(): string {
  return `${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(1000, 9999)}`;
}

function generateDOB(): string {
  return `${randomInt(1, 12)}/${randomInt(1, 28)}/${randomInt(1950, 1999)}`;
}

export function generateClient(day: number, idPrefix: string): Client {
  const fraudChance = Math.min(0.3 + (day * 0.05), 0.6);
  const isFraud = Math.random() < fraudChance;

  const firstName = pickRandom(FIRST_NAMES);
  const lastName = pickRandom(LAST_NAMES);
  const trueName = `${firstName} ${lastName}`;
  const trueSSN = generateSSN();
  const trueDOB = generateDOB();
  const trueEmployer = pickRandom(EMPLOYERS);
  const avatarSeed = randomInt(1, 9999);
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

  if (isFraud) {
    const possibleFrauds: FraudType[] = [];
    if (day >= 1) possibleFrauds.push('name_mismatch', 'ssn_mismatch');
    if (day >= 2) possibleFrauds.push('w2_mismatch');
    if (day >= 3) possibleFrauds.push('expense_mismatch');
    if (day >= 4) possibleFrauds.push('math_error');
    if (day >= 5) possibleFrauds.push('tax_error');
    if (possibleFrauds.length === 0) possibleFrauds.push('name_mismatch');
    fraudType = pickRandom(possibleFrauds);

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

  return {
    id: idPrefix,
    name: trueName,
    avatarSeed,
    smallTalk,
    documents,
    isFraud,
    fraudType,
    expectedDecision: isFraud ? 'REJECT' : 'APPROVE'
  };
}

export function generateDailyClients(day: number, count: number): Client[] {
  const clients: Client[] = [];
  for (let i = 0; i < count; i++) {
    clients.push(generateClient(day, `d${day}-c${i}`));
  }
  return clients;
}
