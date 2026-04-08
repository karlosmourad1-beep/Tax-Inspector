import { useState, useCallback, useRef } from 'react';
import { GameState, DailyLog, AlignmentPath, DecisionType, WorldState, FamilyMember, FamilyMemberStatus, RecurringCharId, RecurringCharState } from '../types/game';
import { generateDailyClients } from '../lib/generator';
import { DAILY_EVENTS, calculateEnding, HUMAN_COSTS } from '../lib/narrative';
import { pickRandom } from '../lib/utils';
import { RENT_BY_DAY } from '../lib/eveningEvents';
import { ALL_RECURRING_IDS, defaultCharState } from '../lib/recurringChars';
import confetti from 'canvas-confetti';

const INITIAL_MONEY  = 120;
const MAX_CITATIONS  = 5;
const MAX_DAYS       = 7;
const CLIENTS_PER_DAY = 4;

export const DAILY_GOALS = [0, 200, 250, 300, 350, 400, 450, 500];

// ─── Costs ────────────────────────────────────────────────────────────────────
export const FEED_COST     = 25;
export const MEDICINE_COST = 45;

// ─── Status progression ───────────────────────────────────────────────────────
const STATUS_ORDER: FamilyMemberStatus[] = ['OK', 'HUNGRY', 'WEAK', 'SICK', 'CRITICAL', 'DEAD'];

function worsen(s: FamilyMemberStatus, steps = 1): FamilyMemberStatus {
  if (s === 'DEAD') return 'DEAD';
  let i = STATUS_ORDER.indexOf(s);
  i = Math.min(i + steps, STATUS_ORDER.length - 1);
  return STATUS_ORDER[i];
}
function improve(s: FamilyMemberStatus): FamilyMemberStatus {
  if (s === 'DEAD') return 'DEAD';
  const i = STATUS_ORDER.indexOf(s);
  return STATUS_ORDER[Math.max(i - 1, 0)];
}

function familyPerfMod(family: FamilyMember[]): number {
  let mod = 1.0;
  for (const m of family) {
    if (m.status === 'HUNGRY')   mod -= 0.05;
    if (m.status === 'WEAK')     mod -= 0.10;
    if (m.status === 'SICK')     mod -= 0.16;
    if (m.status === 'CRITICAL') mod -= 0.22;
    if (m.status === 'DEAD')     mod -= 0.30;
  }
  return Math.max(0.2, mod);
}

// ─── Initial family ───────────────────────────────────────────────────────────
const INITIAL_FAMILY: FamilyMember[] = [
  { id: 'wife',     name: 'Elena',  role: 'wife',     status: 'OK', needsMedicine: false },
  { id: 'son',      name: 'Mark',   role: 'son',      status: 'OK', needsMedicine: false },
  { id: 'daughter', name: 'Lily',   role: 'daughter', status: 'OK', needsMedicine: false },
  { id: 'dog',      name: 'Rex',    role: 'dog',      status: 'OK', needsMedicine: false },
];

const FRAUD_REASONS: Record<string, string> = {
  name_mismatch:          'Name does not match across documents — identity fraud.',
  ssn_mismatch:           'SSN does not match across documents — falsified identity.',
  w2_mismatch:            'Reported gross income does not match W-2 wages.',
  expense_mismatch:       'Expense deductions do not match the Expense Report total.',
  math_error:             'Taxable Income calculation is incorrect (Gross − Deductions ≠ Taxable).',
  tax_error:              'Tax Owed does not match the progressive bracket calculation.',
  capital_gains_misclass: 'Capital gains misclassified on Schedule D — short-term filed as long-term.',
  money_laundering:       'Suspicious transaction patterns indicate money laundering.',
  offshore_accounts:      'Undeclared offshore income detected — unreported assets.',
  insider_trading:        'Trading pattern on Schedule D suggests insider knowledge.',
  shell_company_legal:    'Shell company structure flagged — legal but requires review.',
  bribe_attempt:          'Bribery detected — cash found inside filing. Must be frozen and reported.',
};

const INITIAL_WORLD: WorldState = {
  housingCrisisTriggered:      false,
  whistleblowerNetworkActive:  false,
  bankingSystemStrained:       false,
  insiderTradingExposed:       false,
  corruptDeveloperApproved:    false,
  robinHoodSpared:             false,
  megaCorpApproved:            false,
};

function buildInitialRecurringChars(): Record<RecurringCharId, RecurringCharState> {
  return Object.fromEntries(
    ALL_RECURRING_IDS.map(id => [id, defaultCharState(id)])
  ) as Record<RecurringCharId, RecurringCharState>;
}

export function useGameEngine() {
  const [forcedBribeNextClient, setForcedBribeNextClient] = useState(false);
  const forcedBribeRef = useRef(false); // ref for synchronous reads inside callNextClient
  const [state, setState] = useState<GameState>({
    status: 'TITLE',
    day: 1,
    money: INITIAL_MONEY,
    citations: 0,
    clientsQueue: [],
    currentClient: null,
    dailyLogs: [],
    allTimeLogs: [],
    alignment: { corporate: 0, whistleblower: 0, survivalist: 0 },
    worldState: { ...INITIAL_WORLD },
    activeEvent: null,
    costOfLiving: 0,
    activeMemo: null,
    memoActed: false,
    ending: null,
    performanceMod: 1.0,
    family: INITIAL_FAMILY.map(m => ({ ...m })),
    rentMissed: 0,
    recurringChars: buildInitialRecurringChars(),
  });

  const [stampAction, setStampAction] = useState<DecisionType | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const playThud = useCallback((type: DecisionType = 'APPROVE') => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioRef.current;
      const now = ctx.currentTime;

      const tone = (freq: number, endFreq: number, dur: number, vol: number, shape: OscillatorType, delay = 0) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = shape;
        osc.frequency.setValueAtTime(freq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + delay + dur);
        g.gain.setValueAtTime(vol, now + delay);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + dur + 0.01);
      };

      if (type === 'APPROVE') {
        tone(90,  30,  0.22, 0.75, 'sine');
        tone(240, 120, 0.07, 0.35, 'triangle');
      } else if (type === 'REJECT') {
        tone(200, 55, 0.28, 0.65, 'sawtooth');
        tone(170, 45, 0.22, 0.45, 'sawtooth', 0.06);
      } else if (type === 'FREEZE') {
        ([523, 659, 784] as number[]).forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g   = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + i * 0.045);
          g.gain.setValueAtTime(0, now + i * 0.045);
          g.gain.linearRampToValueAtTime(0.30, now + i * 0.045 + 0.015);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.55);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + i * 0.045);
          osc.stop(now + i * 0.045 + 0.6);
        });
      }
    } catch (_) { /* ignore */ }
  }, []);

  const startGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'DAY_START',
      day: 1,
      money: INITIAL_MONEY,
      citations: 0,
      dailyLogs: [],
      allTimeLogs: [],
      alignment: { corporate: 0, whistleblower: 0, survivalist: 0 },
      worldState: { ...INITIAL_WORLD },
      activeEvent: DAILY_EVENTS[1] || null,
      costOfLiving: DAILY_EVENTS[1]?.costOfLiving || 0,
      activeMemo: null,
      memoActed: false,
      ending: null,
      performanceMod: 1.0,
      family: INITIAL_FAMILY.map(m => ({ ...m })),
      rentMissed: 0,
      recurringChars: buildInitialRecurringChars(),
    }));
  }, []);

  const startDay = useCallback(() => {
    setState(prev => {
      const event = DAILY_EVENTS[prev.day] || null;
      const queue = generateDailyClients(prev.day, CLIENTS_PER_DAY, prev.recurringChars, forcedBribeNextClient);
      const costDeduction = event?.costOfLiving || 0;
      return {
        ...prev,
        status: 'PLAYING',
        clientsQueue: queue,
        currentClient: null,
        dailyLogs: [],
        activeEvent: event,
        money: prev.money - costDeduction,
        activeMemo: null,
        memoActed: false,
      };
    });
    setForcedBribeNextClient(false);
  }, [forcedBribeNextClient]);

  const callNextClient = useCallback(() => {
    // Read the ref synchronously — safe even when called in the same tick as forceNextBribeCase()
    const injectBribe = forcedBribeRef.current;
    if (injectBribe) {
      forcedBribeRef.current = false;
      setForcedBribeNextClient(false);
    }
    setState(prev => {
      if (prev.clientsQueue.length === 0) {
        return { ...prev, status: 'DAY_END', currentClient: null, activeMemo: null };
      }
      const nextQueue = [...prev.clientsQueue];
      let nextClient = nextQueue.shift() || null;
      // Inject bribe into the client if the test-bribe flag was set
      if (nextClient && injectBribe) {
        nextClient = { ...nextClient, hasBribe: true, brideAmount: 50 };
      }
      return {
        ...prev,
        clientsQueue: nextQueue,
        currentClient: nextClient,
        activeMemo: nextClient?.leakedMemo || null,
        memoActed: false,
      };
    });
  }, []);

  const actOnMemo = useCallback(() => {
    setState(prev => {
      if (!prev.activeMemo || prev.memoActed) return prev;
      return { ...prev, memoActed: true };
    });
  }, []);

  const dismissMemo = useCallback(() => {
    setState(prev => ({ ...prev, activeMemo: null }));
  }, []);

  const processDecision = useCallback((decision: DecisionType, circledCount = 0) => {
    setStampAction(decision);
    playThud(decision);

    setTimeout(() => {
      setStampAction(null);
      setState(prev => {
        if (!prev.currentClient) return prev;
        const client  = prev.currentClient;
        const event   = prev.activeEvent;
        const wageMult = event?.wageMultiplier ?? 1.0;
        const isCorrect =
          client.expectedDecision === decision ||
          (decision === 'FREEZE' && (client.isFraud || client.isContraband));

        let baseEarnings   = 0;
        let citationsAdded = 0;
        let alignmentShift: AlignmentPath | undefined;
        let humanCostMsg: string | undefined;
        let citationReason: string | undefined;

        if (isCorrect) {
          if (decision === 'APPROVE') {
            baseEarnings = 30;
            alignmentShift = 'corporate';
            humanCostMsg = pickRandom(HUMAN_COSTS.correct_approve);
          } else if (decision === 'REJECT') {
            baseEarnings = 55;
            alignmentShift = 'whistleblower';
            humanCostMsg = pickRandom(HUMAN_COSTS.correct_reject);
          } else if (decision === 'FREEZE') {
            baseEarnings = 100;
            alignmentShift = 'whistleblower';
            humanCostMsg = pickRandom(HUMAN_COSTS.freeze_correct);
          }
        } else {
          if (decision === 'APPROVE') {
            baseEarnings = client.isContraband ? -80 : -60;
            citationsAdded = event?.type === 'audit_sweep' ? 2 : 1;
            alignmentShift = 'survivalist';
            humanCostMsg = pickRandom(HUMAN_COSTS.approve_fraud);
            citationReason = client.fraudType !== 'none'
              ? (FRAUD_REASONS[client.fraudType] ?? 'Fraud was present in this filing.')
              : 'Contraband financial activity was approved.';
          } else if (decision === 'REJECT') {
            baseEarnings = -50;
            citationsAdded = 1;
            alignmentShift = 'survivalist';
            humanCostMsg = pickRandom(HUMAN_COSTS.reject_innocent);
            citationReason = 'This filing contained no discrepancies — an innocent citizen was rejected.';
          } else {
            baseEarnings = -50;
            citationsAdded = 1;
            alignmentShift = 'survivalist';
            humanCostMsg = pickRandom(HUMAN_COSTS.reject_innocent);
            citationReason = client.isContraband
              ? 'Correct approach, but the standard decision was expected here.'
              : 'This filing contained no contraband — freeze was unwarranted.';
          }
        }

        // ── Bribery overrides ──────────────────────────────────────────────────
        if (client.hasBribe) {
          if (!isCorrect && decision === 'APPROVE') {
            // Player pockets the bribe — override to positive earnings, still cited
            baseEarnings    = client.brideAmount ?? 100;
            citationsAdded  = 1;
            alignmentShift  = 'survivalist';
            humanCostMsg    = "Bribe accepted. Fraudulent filing cleared without scrutiny. The Ministry has been compromised.";
            citationReason  = `Bribery: ¢${client.brideAmount} accepted. Fraudulent filing approved without audit.`;
          } else if (isCorrect && decision === 'FREEZE') {
            // Extra reward for reporting bribery
            baseEarnings  += 80;
            humanCostMsg   = "Bribery reported and cash seized. Criminal case opened against the filer.";
          }
        }

        if (prev.memoActed && prev.activeMemo && decision === prev.activeMemo.suggestedAction && isCorrect) {
          baseEarnings += prev.activeMemo.bonusIfActed;
          alignmentShift = prev.activeMemo.alignmentReward;
        }

        const earnings = Math.round(baseEarnings * wageMult * prev.performanceMod);

        const log: DailyLog = {
          clientId:    client.id,
          clientName:  client.name,
          decision,
          wasCorrect:  isCorrect,
          earnings,
          citations:   citationsAdded,
          humanCost:   humanCostMsg
            ? { clientName: client.name, impact: humanCostMsg, isPositive: isCorrect }
            : undefined,
          alignmentShift,
          citationReason,
          fraudType:   client.fraudType,
          isVIP:       client.isVIP,
          recurringId: client.recurringId,
          hasBribe:    client.hasBribe,
          brideAmount: client.brideAmount,
        };

        const newCitations = prev.citations + citationsAdded;
        const newMoney     = prev.money + earnings;
        const newAlignment = { ...prev.alignment };
        if (alignmentShift) newAlignment[alignmentShift] += 1;

        const newWorld = { ...prev.worldState };
        if (client.isVIP && client.vipData) {
          const flag = client.vipData.flagId;
          if (flag === 'corrupt_developer'  && decision === 'APPROVE') newWorld.corruptDeveloperApproved = true;
          if (flag === 'corrupt_developer'  && decision !== 'APPROVE') newWorld.housingCrisisTriggered   = true;
          if (flag === 'whistleblower_nurse' && decision === 'APPROVE') newWorld.whistleblowerNetworkActive = true;
          if (flag === 'director_offshore'  && decision === 'FREEZE')  newWorld.insiderTradingExposed    = true;
          if (flag === 'robin_hood'         && decision === 'APPROVE') newWorld.robinHoodSpared          = true;
          if (flag === 'megacorp'           && decision === 'APPROVE') newWorld.megaCorpApproved         = true;
        }

        // Track recurring character outcomes
        let newRecurring = { ...prev.recurringChars };
        if (client.recurringId) {
          const cid = client.recurringId;
          const cur = newRecurring[cid] ?? defaultCharState(cid);
          const updated: RecurringCharState = {
            ...cur,
            lastSeenDay:   prev.day,
            timesApproved: cur.timesApproved + (decision === 'APPROVE' ? 1 : 0),
            timesRejected: cur.timesRejected + (decision === 'REJECT'  ? 1 : 0),
            timesFrozen:   cur.timesFrozen   + (decision === 'FREEZE'  ? 1 : 0),
          };
          // Disappear logic: Harold/Maria give up after being rejected twice
          if ((cid === 'harold_bentley' || cid === 'maria_lopez') && updated.timesRejected >= 2) {
            updated.disappeared = true;
          }
          // Adrian: freeze resolves the arc
          if (cid === 'adrian_kell' && decision === 'FREEZE') {
            updated.resolved = true;
            updated.disappeared = true;
          }
          newRecurring = { ...newRecurring, [cid]: updated };
        }

        const newDailyLogs = [...prev.dailyLogs, log];
        const newAllLogs   = [...prev.allTimeLogs, log];

        if (newCitations >= MAX_CITATIONS) {
          const ending = calculateEnding(newMoney, newCitations, newAlignment, newWorld, newRecurring);
          return {
            ...prev,
            money: newMoney, citations: newCitations,
            dailyLogs: newDailyLogs, allTimeLogs: newAllLogs,
            alignment: newAlignment, worldState: newWorld,
            recurringChars: newRecurring,
            status: 'GAME_OVER', currentClient: null, activeMemo: null, ending,
          };
        }

        const nextQueue  = [...prev.clientsQueue];

        // Auto-end shift when all clients processed
        if (nextQueue.length === 0) {
          return {
            ...prev,
            money: newMoney, citations: newCitations,
            dailyLogs: newDailyLogs, allTimeLogs: newAllLogs,
            alignment: newAlignment, worldState: newWorld,
            recurringChars: newRecurring,
            status: 'EVENING', clientsQueue: nextQueue,
            currentClient: null, activeMemo: null, memoActed: false,
          };
        }

        const nextClient = nextQueue.shift() || null;
        return {
          ...prev,
          money: newMoney, citations: newCitations,
          dailyLogs: newDailyLogs, allTimeLogs: newAllLogs,
          alignment: newAlignment, worldState: newWorld,
          recurringChars: newRecurring,
          status: 'PLAYING', clientsQueue: nextQueue,
          currentClient: nextClient,
          activeMemo: nextClient?.leakedMemo || null,
          memoActed: false,
        };
      });
    }, 900);
  }, [playThud]);

  const endDay = useCallback(() => {
    setState(prev => ({ ...prev, status: 'EVENING' }));
  }, []);

  // ─── confirmEvening ─────────────────────────────────────────────────────────
  const confirmEvening = useCallback((opts: {
    fedIds:     string[];   // family member IDs the player chose to feed
    treatedIds: string[];   // family member IDs the player chose to treat
  }) => {
    setState(prev => {
      const { fedIds, treatedIds } = opts;
      const rent = RENT_BY_DAY[prev.day] ?? 60;

      const feedCost    = fedIds.length * FEED_COST;
      const treatCost   = treatedIds.length * MEDICINE_COST;
      const canPayRent  = prev.money >= rent;
      const rentMissed  = canPayRent ? 0 : prev.rentMissed + 1;
      const rentDeducted = canPayRent ? rent : 0;

      const newMoney = prev.money - rentDeducted - feedCost - treatCost;

      // Update each family member's status
      const newFamily: FamilyMember[] = prev.family.map(m => {
        if (m.status === 'DEAD') return m;

        const fed     = fedIds.includes(m.id);
        const treated = treatedIds.includes(m.id);

        let newStatus = m.status;
        if (treated && (m.status === 'SICK' || m.status === 'CRITICAL')) {
          newStatus = improve(improve(m.status));
        } else if (fed) {
          newStatus = improve(m.status);
        } else {
          const decaySteps = (m.status === 'SICK' || m.status === 'CRITICAL') ? 2 : 1;
          newStatus = worsen(m.status, decaySteps);
        }

        return {
          ...m,
          status: newStatus,
          needsMedicine: newStatus === 'SICK' || newStatus === 'CRITICAL',
        };
      });

      const hasDeath = newFamily.some(m => m.status === 'DEAD');
      const newPerfMod = familyPerfMod(newFamily);
      const newAlignment = { ...prev.alignment };

      if (hasDeath) {
        const ending = calculateEnding(newMoney, prev.citations, newAlignment, prev.worldState, prev.recurringChars);
        return {
          ...prev,
          status: 'GAME_OVER' as const,
          money: newMoney,
          family: newFamily,
          performanceMod: newPerfMod,
          rentMissed,
          ending: {
            ...ending,
            id: 'family_death',
            title: 'A Family Lost',
            subtitle: 'The cost was too high.',
            description: `You pushed through the shifts, but your family paid the price. ${newFamily.filter(m => m.status === 'DEAD').map(m => m.name).join(' and ')} didn't survive. The Ministry sends its condolences — and your termination notice.`,
            color: 'red' as const,
          },
        };
      }

      if (prev.day >= MAX_DAYS) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        const ending = calculateEnding(newMoney, prev.citations, newAlignment, prev.worldState, prev.recurringChars);
        return {
          ...prev,
          status: 'VICTORY', ending,
          money: newMoney, family: newFamily,
          performanceMod: newPerfMod, rentMissed,
        };
      }

      const nextDay = prev.day + 1;
      return {
        ...prev,
        status: 'DAY_START',
        day: nextDay,
        money: newMoney,
        family: newFamily,
        performanceMod: newPerfMod,
        rentMissed,
        alignment: newAlignment,
        activeEvent: DAILY_EVENTS[nextDay] || null,
        dailyLogs: [],
      };
    });
  }, []);

  const returnToMenu = useCallback(() => {
    setState(prev => ({ ...prev, status: 'TITLE' }));
  }, []);

  const addMoney = useCallback((amount: number) => {
    setState(prev => ({ ...prev, money: prev.money + amount }));
  }, []);

  const forceNextBribeCase = useCallback(() => {
    forcedBribeRef.current = true; // set ref immediately for synchronous reads
    setForcedBribeNextClient(true);
  }, []);

  const triggerBribeCaught = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'GAME_OVER',
      currentClient: null,
      activeMemo: null,
      ending: {
        id: 'bribe_caught',
        title: 'ARRESTED',
        subtitle: 'Internal Affairs Division — Case #4471-B',
        description:
          'You were caught accepting a bribe from a filing citizen. ' +
          'Ministry surveillance flagged the transaction. Your employment is immediately terminated ' +
          'and you have been remanded to the detention facility pending formal charges. ' +
          'The family has been notified.',
        color: 'red',
      },
    }));
  }, []);

  return {
    state, stampAction,
    startGame, startDay, callNextClient,
    processDecision, actOnMemo, dismissMemo,
    endDay, confirmEvening, returnToMenu,
    addMoney,
    forceNextBribeCase,
    triggerBribeCaught,
  };
}
