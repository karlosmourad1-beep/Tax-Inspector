export type DocType = '1040' | 'W2' | 'EXPENSE' | 'ID' | 'SCHEDULE_D';

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
  lineItems: { description: string; amount: number; isSuspect?: boolean }[];
}

export interface IDDoc extends BaseDocument {
  type: 'ID';
  name: string;
  ssn: string;
  dob: string;
}

export interface ScheduleDDoc extends BaseDocument {
  type: 'SCHEDULE_D';
  name: string;
  shortTermGains: number;
  shortTermTax: number;
  longTermGains: number;
  longTermTax: number;
  ltRate: number;
  totalCapitalGainsTax: number;
}

export type AnyDocument = TaxReturnDoc | W2Doc | ExpenseDoc | IDDoc | ScheduleDDoc;

export type FraudType =
  | 'none'
  | 'name_mismatch'
  | 'ssn_mismatch'
  | 'w2_mismatch'
  | 'expense_mismatch'
  | 'math_error'
  | 'tax_error'
  | 'capital_gains_misclass'
  | 'money_laundering'
  | 'offshore_accounts'
  | 'insider_trading'
  | 'shell_company_legal';

export type DecisionType = 'APPROVE' | 'REJECT' | 'FREEZE';

export type AlignmentPath = 'corporate' | 'whistleblower' | 'survivalist';

export interface AlignmentScores {
  corporate: number;
  whistleblower: number;
  survivalist: number;
}

export type MacroEventType = 'market_shock' | 'hyperinflation' | 'audit_sweep' | 'banking_crisis';

export interface MacroEvent {
  type: MacroEventType;
  title: string;
  description: string;
  ruleAddendum: string;
  wageMultiplier: number;
  costOfLiving: number;
}

export interface LeakedMemo {
  id: string;
  classification: string;
  from: string;
  subject: string;
  lines: string[];
  targetClientId: string;
  suggestedAction: DecisionType;
  alignmentReward: AlignmentPath;
  bonusIfActed: number;
  riskIfActed: boolean;
}

export interface VIPData {
  flagId: string;
  title: string;
  organization: string;
  consequence: string;
  humanCostIfApproved: string;
  humanCostIfFrozen: string;
  requiresFreeze: boolean;
  isMegaCorp?: boolean;
  isRobinHood?: boolean;
}

export interface HumanCostEntry {
  clientName: string;
  impact: string;
  isPositive: boolean;
}

export interface Client {
  id: string;
  name: string;
  avatarSeed: number;
  smallTalk: string[];
  documents: AnyDocument[];
  isFraud: boolean;
  fraudType: FraudType;
  isContraband: boolean;
  isVIP: boolean;
  vipData?: VIPData;
  hiddenNote?: string;
  leakedMemo?: LeakedMemo;
  expectedDecision: DecisionType;
  humanCostIfApproved?: string;
  humanCostIfRejected?: string;
}

export interface DailyLog {
  clientId: string;
  clientName: string;
  decision: DecisionType;
  wasCorrect: boolean;
  earnings: number;
  citations: number;
  humanCost?: HumanCostEntry;
  alignmentShift?: AlignmentPath;
  citationReason?: string;
}

export interface WorldState {
  housingCrisisTriggered: boolean;
  whistleblowerNetworkActive: boolean;
  bankingSystemStrained: boolean;
  insiderTradingExposed: boolean;
  corruptDeveloperApproved: boolean;
  robinHoodSpared: boolean;
  megaCorpApproved: boolean;
}

export type GameStatus = 'TITLE' | 'DAY_START' | 'PLAYING' | 'DAY_END' | 'GAME_OVER' | 'VICTORY';

export interface EndingData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: 'green' | 'red' | 'amber' | 'blue' | 'purple';
}

export interface GameState {
  status: GameStatus;
  day: number;
  money: number;
  citations: number;
  clientsQueue: Client[];
  currentClient: Client | null;
  dailyLogs: DailyLog[];
  allTimeLogs: DailyLog[];
  alignment: AlignmentScores;
  worldState: WorldState;
  activeEvent: MacroEvent | null;
  costOfLiving: number;
  activeMemo: LeakedMemo | null;
  memoActed: boolean;
  ending: EndingData | null;
}
