import { useState, useCallback, useRef } from 'react';
import { GameState, DailyLog, AlignmentPath, DecisionType, WorldState } from '../types/game';
import { generateDailyClients } from '../lib/generator';
import { DAILY_EVENTS, calculateEnding, HUMAN_COSTS } from '../lib/narrative';
import { pickRandom } from '../lib/utils';
import { pickEveningEvent, RENT_BY_DAY, foodToMod, MAX_FOOD } from '../lib/eveningEvents';
import confetti from 'canvas-confetti';

const INITIAL_MONEY = 0;
const MAX_CITATIONS = 5;
const MAX_DAYS = 7;
const CLIENTS_PER_DAY = 4;

// Daily goals by day index (1-7)
export const DAILY_GOALS = [0, 200, 250, 300, 350, 400, 450, 500];

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
};

const INITIAL_WORLD: WorldState = {
  housingCrisisTriggered: false,
  whistleblowerNetworkActive: false,
  bankingSystemStrained: false,
  insiderTradingExposed: false,
  corruptDeveloperApproved: false,
  robinHoodSpared: false,
  megaCorpApproved: false,
};

export function useGameEngine() {
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
    food: 3,
    performanceMod: 1.0,
    activeEveningEvent: null,
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
        // Deep rubber-stamp thud: low sine boom + quick mid pop
        tone(90,  30,  0.22, 0.75, 'sine');
        tone(240, 120, 0.07, 0.35, 'triangle');
      } else if (type === 'REJECT') {
        // Harsh descending buzz — decisive denial
        tone(200, 55, 0.28, 0.65, 'sawtooth');
        tone(170, 45, 0.22, 0.45, 'sawtooth', 0.06);
      } else if (type === 'FREEZE') {
        // Icy bell chord — C5 E5 G5 arpeggiated
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
      food: 3,
      performanceMod: 1.0,
      activeEveningEvent: null,
    }));
  }, []);

  const startDay = useCallback(() => {
    setState(prev => {
      const event = DAILY_EVENTS[prev.day] || null;
      const queue = generateDailyClients(prev.day, CLIENTS_PER_DAY);
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
  }, []);

  const callNextClient = useCallback(() => {
    setState(prev => {
      if (prev.clientsQueue.length === 0) {
        return { ...prev, status: 'DAY_END', currentClient: null, activeMemo: null };
      }
      const nextQueue = [...prev.clientsQueue];
      const nextClient = nextQueue.shift() || null;
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
        const client = prev.currentClient;
        const event = prev.activeEvent;
        const wageMult = event?.wageMultiplier ?? 1.0;

        // For MegaCorp (shell_company_legal), APPROVE is the "correct" game answer
        // but morally wrong — we track that in world state
        const isCorrect = client.expectedDecision === decision;

        let baseEarnings = 0;
        let citationsAdded = 0;
        let alignmentShift: AlignmentPath | undefined;
        let humanCostMsg: string | undefined;

        let citationReason: string | undefined;

        if (isCorrect) {
          if (decision === 'APPROVE') {
            baseEarnings = 50;
            alignmentShift = 'corporate';
            humanCostMsg = pickRandom(HUMAN_COSTS.correct_approve);
          } else if (decision === 'REJECT') {
            const circledBonus = Math.min(circledCount, 4) * 25;
            baseEarnings = 100 + circledBonus;
            alignmentShift = 'whistleblower';
            humanCostMsg = pickRandom(HUMAN_COSTS.correct_reject);
          } else if (decision === 'FREEZE') {
            baseEarnings = 200;
            alignmentShift = 'whistleblower';
            humanCostMsg = pickRandom(HUMAN_COSTS.freeze_correct);
          }
        } else {
          if (decision === 'APPROVE') {
            baseEarnings = client.isContraband ? -150 : -100;
            citationsAdded = event?.type === 'audit_sweep' ? 2 : 1;
            alignmentShift = 'survivalist';
            humanCostMsg = pickRandom(HUMAN_COSTS.approve_fraud);
            citationReason = client.fraudType !== 'none'
              ? (FRAUD_REASONS[client.fraudType] ?? 'Fraud was present in this filing.')
              : 'Contraband financial activity was approved.';
          } else if (decision === 'REJECT') {
            baseEarnings = -75;
            citationsAdded = 1;
            alignmentShift = 'survivalist';
            humanCostMsg = pickRandom(HUMAN_COSTS.reject_innocent);
            citationReason = 'This filing contained no discrepancies — an innocent citizen was rejected.';
          } else {
            // Wrong FREEZE
            baseEarnings = -75;
            citationsAdded = 1;
            alignmentShift = 'survivalist';
            humanCostMsg = pickRandom(HUMAN_COSTS.reject_innocent);
            citationReason = client.isContraband
              ? 'Correct approach, but the standard decision was expected here.'
              : 'This filing contained no contraband — freeze was unwarranted.';
          }
        }

        // Memo intel bonus
        if (prev.memoActed && prev.activeMemo && decision === prev.activeMemo.suggestedAction && isCorrect) {
          baseEarnings += prev.activeMemo.bonusIfActed;
          alignmentShift = prev.activeMemo.alignmentReward;
        }

        const earnings = Math.round(baseEarnings * wageMult * prev.performanceMod);

        const log: DailyLog = {
          clientId: client.id,
          clientName: client.name,
          decision,
          wasCorrect: isCorrect,
          earnings,
          citations: citationsAdded,
          humanCost: humanCostMsg
            ? { clientName: client.name, impact: humanCostMsg, isPositive: isCorrect }
            : undefined,
          alignmentShift,
          citationReason,
          fraudType: client.fraudType,
          isVIP: client.isVIP,
        };

        const newCitations = prev.citations + citationsAdded;
        const newMoney     = prev.money + earnings;

        const newAlignment = { ...prev.alignment };
        if (alignmentShift) newAlignment[alignmentShift] += 1;

        const newWorld = { ...prev.worldState };
        if (client.isVIP && client.vipData) {
          const flag = client.vipData.flagId;
          if (flag === 'corrupt_developer' && decision === 'APPROVE') newWorld.corruptDeveloperApproved = true;
          if (flag === 'corrupt_developer' && decision !== 'APPROVE') newWorld.housingCrisisTriggered = true;
          if (flag === 'whistleblower_nurse' && decision === 'APPROVE') newWorld.whistleblowerNetworkActive = true;
          if (flag === 'director_offshore'   && decision === 'FREEZE')  newWorld.insiderTradingExposed = true;
          if (flag === 'robin_hood'          && decision === 'APPROVE') newWorld.robinHoodSpared = true;
          if (flag === 'megacorp'            && decision === 'APPROVE') newWorld.megaCorpApproved = true;
        }

        const newDailyLogs = [...prev.dailyLogs, log];
        const newAllLogs   = [...prev.allTimeLogs, log];

        if (newCitations >= MAX_CITATIONS) {
          const ending = calculateEnding(newMoney, newCitations, newAlignment, newWorld);
          return {
            ...prev,
            money: newMoney, citations: newCitations,
            dailyLogs: newDailyLogs, allTimeLogs: newAllLogs,
            alignment: newAlignment, worldState: newWorld,
            status: 'GAME_OVER', currentClient: null, activeMemo: null, ending,
          };
        }

        const nextQueue = [...prev.clientsQueue];
        const nextStatus = nextQueue.length === 0 ? 'DAY_END' : 'PLAYING';
        const nextClient = nextStatus === 'PLAYING' ? nextQueue.shift() || null : null;

        return {
          ...prev,
          money: newMoney, citations: newCitations,
          dailyLogs: newDailyLogs, allTimeLogs: newAllLogs,
          alignment: newAlignment, worldState: newWorld,
          status: nextStatus, clientsQueue: nextQueue,
          currentClient: nextClient,
          activeMemo: nextClient?.leakedMemo || null,
          memoActed: false,
        };
      });
    }, 900);
  }, [playThud]);

  const endDay = useCallback(() => {
    setState(prev => {
      // Pick an evening event for tonight's resource screen
      const seed = prev.allTimeLogs.length;
      const eveningEvent = pickEveningEvent(prev.day, seed);
      return { ...prev, status: 'EVENING', activeEveningEvent: eveningEvent };
    });
  }, []);

  const confirmEvening = useCallback((opts: {
    extraFood: number;       // additional food bought (0-N)
    buyBoost: boolean;       // buy performance boost ($40)
    eventChoiceId?: string;  // id of chosen option (if choice event)
  }) => {
    setState(prev => {
      const { extraFood, buyBoost, eventChoiceId } = opts;
      const rent = RENT_BY_DAY[prev.day] ?? 60;
      const foodCost = extraFood * 30;
      const boostCost = buyBoost ? 40 : 0;

      // Apply auto event or chosen event effect
      let eventMoneyDelta = 0;
      let eventFoodDelta  = 0;
      let eventPerfDelta  = 0;
      let eventAlignment: AlignmentPath | undefined;

      const evt = prev.activeEveningEvent;
      if (evt) {
        if (evt.type === 'auto' && evt.autoEffect) {
          eventMoneyDelta = evt.autoEffect.moneyDelta;
          eventFoodDelta  = evt.autoEffect.foodDelta;
          eventPerfDelta  = evt.autoEffect.perfDelta;
        } else if (evt.type === 'choice' && eventChoiceId && evt.choices) {
          const choice = evt.choices.find(c => c.id === eventChoiceId);
          if (choice) {
            eventMoneyDelta = choice.moneyDelta;
            eventFoodDelta  = choice.foodDelta;
            eventPerfDelta  = choice.perfDelta;
            eventAlignment  = choice.alignment;
          }
        }
      }

      // Daily food consumption (always -1 ration)
      const totalFoodDelta = eventFoodDelta + extraFood - 1;
      const newFood = Math.max(0, Math.min(MAX_FOOD, prev.food + totalFoodDelta));
      const newMoney = prev.money - rent - foodCost - boostCost + eventMoneyDelta;
      const boostPerf = buyBoost ? 0.10 : 0;
      const rawPerf = 1.0 + eventPerfDelta + boostPerf;
      const newPerfMod = Math.max(0.5, Math.min(1.25, rawPerf)) * foodToMod(newFood);

      const newAlignment = { ...prev.alignment };
      if (eventAlignment) newAlignment[eventAlignment] += 1;

      // Move to next day
      if (prev.day >= MAX_DAYS) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        const ending = calculateEnding(newMoney, prev.citations, newAlignment, prev.worldState);
        return { ...prev, status: 'VICTORY', ending, money: newMoney, food: newFood, performanceMod: newPerfMod, alignment: newAlignment };
      }

      const nextDay = prev.day + 1;
      return {
        ...prev,
        status: 'DAY_START',
        day: nextDay,
        money: newMoney,
        food: newFood,
        performanceMod: newPerfMod,
        alignment: newAlignment,
        activeEvent: DAILY_EVENTS[nextDay] || null,
        activeEveningEvent: null,
        dailyLogs: [],
      };
    });
  }, []);

  const returnToMenu = useCallback(() => {
    setState(prev => ({ ...prev, status: 'TITLE' }));
  }, []);

  return { state, stampAction, startGame, startDay, callNextClient, processDecision, actOnMemo, dismissMemo, endDay, confirmEvening, returnToMenu };
}
