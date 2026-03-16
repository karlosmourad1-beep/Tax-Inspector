import { Client, AnyDocument, TaxReturnDoc, W2Doc, ExpenseDoc, IDDoc, FraudType } from '../types/game';
import { randomInt, pickRandom } from './utils';

const FIRST_NAMES = ["James", "Carla", "David", "Sarah", "Michael", "Elena", "Robert", "Maria", "Wei", "Aisha"];
const LAST_NAMES = ["Morton", "Voss", "Chen", "Smith", "Johnson", "Garcia", "Brown", "Miller", "Kim", "Patel"];
const EMPLOYERS = ["Initech", "Umbrella Corp", "Massive Dynamic", "Soylent", "Globex", "Stark Ind."];

function generateSSN(): string {
  return `${randomInt(100, 999)}-${randomInt(10, 99)}-${randomInt(1000, 9999)}`;
}

function generateDOB(): string {
  return `${randomInt(1, 12)}/${randomInt(1, 28)}/${randomInt(1950, 1999)}`;
}

export function generateClient(day: number, idPrefix: string): Client {
  // Fraud chance increases slightly each day, capped at 60%
  const fraudChance = Math.min(0.3 + (day * 0.05), 0.6);
  const isFraud = Math.random() < fraudChance;
  
  const trueName = `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
  const trueSSN = generateSSN();
  const trueDOB = generateDOB();
  const trueEmployer = pickRandom(EMPLOYERS);
  
  const trueGross = randomInt(30, 150) * 1000;
  const trueDeductions = randomInt(0, 20) * 1000;
  const trueTaxable = trueGross - trueDeductions;
  const trueTaxOwed = Math.floor(trueTaxable * 0.15); // 15% flat rate

  // Initialize documents with truth
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

    // Fallback if none available (e.g. somehow day 0)
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
        w2Doc.wages = trueGross - randomInt(5, 20) * 1000; // Underreported on W2 or forged
        break;
      case 'expense_mismatch':
        expenseDoc.totalExpenses = trueDeductions + randomInt(2, 10) * 1000; // Forged expenses
        break;
      case 'math_error':
        // Taxable income is lower than it should be
        taxDoc.taxableIncome = trueTaxable - randomInt(1, 5) * 1000;
        // Adjust tax owed to match the fake taxable so it's strictly a math error on taxable line
        taxDoc.taxOwed = Math.floor(taxDoc.taxableIncome * 0.15); 
        break;
      case 'tax_error':
        // Did the math right, but just lied on the final tax owed calculation
        taxDoc.taxOwed = trueTaxOwed - randomInt(1, 5) * 1000;
        break;
    }
  }

  // Determine which docs to give based on day to avoid overwhelming early on
  const documents: AnyDocument[] = [idDoc, taxDoc];
  if (day >= 2) documents.push(w2Doc);
  if (day >= 3) documents.push(expenseDoc);

  // Shuffle documents so they don't always appear in the same order
  documents.sort(() => Math.random() - 0.5);

  return {
    id: idPrefix,
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
