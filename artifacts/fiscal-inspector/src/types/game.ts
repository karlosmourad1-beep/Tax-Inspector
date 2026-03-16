export type DocType = '1040' | 'W2' | 'EXPENSE' | 'ID';

export interface BaseDocument {
  id: string;
  type: DocType;
}

export interface TaxReturnDoc extends BaseDocument {
  type: '1040';
  name: string;
  ssn: string;
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  taxOwed: number;
}

export interface W2Doc extends BaseDocument {
  type: 'W2';
  name: string;
  ssn: string;
  wages: number;
  employer: string;
}

export interface ExpenseDoc extends BaseDocument {
  type: 'EXPENSE';
  name: string;
  totalExpenses: number;
}

export interface IDDoc extends BaseDocument {
  type: 'ID';
  name: string;
  ssn: string;
  dob: string;
}

export type AnyDocument = TaxReturnDoc | W2Doc | ExpenseDoc | IDDoc;

export type FraudType =
  | 'none'
  | 'name_mismatch'
  | 'ssn_mismatch'
  | 'w2_mismatch'
  | 'expense_mismatch'
  | 'math_error'
  | 'tax_error';

export interface Client {
  id: string;
  name: string;
  avatarSeed: number;
  smallTalk: string[];
  documents: AnyDocument[];
  isFraud: boolean;
  fraudType: FraudType;
  expectedDecision: 'APPROVE' | 'REJECT';
}

export interface DailyLog {
  clientId: string;
  clientName: string;
  decision: 'APPROVE' | 'REJECT';
  wasCorrect: boolean;
  earnings: number;
  citations: number;
}

export type GameStatus = 'TITLE' | 'DAY_START' | 'PLAYING' | 'DAY_END' | 'GAME_OVER' | 'VICTORY';

export interface GameState {
  status: GameStatus;
  day: number;
  money: number;
  citations: number;
  clientsQueue: Client[];
  currentClient: Client | null;
  dailyLogs: DailyLog[];
}
