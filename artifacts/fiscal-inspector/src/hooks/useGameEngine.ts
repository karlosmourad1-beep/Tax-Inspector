import { useState, useCallback, useRef } from 'react';
import { GameState, DailyLog, AlignmentPath, DecisionType, WorldState } from '../types/game';
import { generateDailyClients } from '../lib/generator';
import { DAILY_EVENTS, calculateEnding, HUMAN_COSTS } from '../lib/narrative';
import { pickRandom } from '../lib/utils';
import confetti from 'canvas-confetti';

const INITIAL_MONEY = 0;
const MAX_CITATIONS = 5;
const MAX_DAYS = 7;
const CLIENTS_PER_DAY = 4;

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
  });

  const [stampAction, setStampAction] = useState<DecisionType | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const playThud = useCallback((type: DecisionType = 'APPROVE') => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      // Freeze sounds different (deeper)
      const freq = type === 'FREEZE' ? 60 : type === 'APPROVE' ? 110 : 90;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
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

        if (isCorrect) {
          if (decision === 'APPROVE') {
            baseEarnings = 50;
            alignmentShift = client.vipData?.isMegaCorp ? 'corporate' : 'corporate';
            humanCostMsg = pickRandom(HUMAN_COSTS.correct_approve);
          } else if (decision === 'REJECT') {
            const circledBonus = Math.min(circledCount, 4) * 25;
            baseEarnings = 75 + circledBonus;
            alignmentShift = 'whistleblower';
            humanCostMsg = pickRandom(HUMAN_COSTS.correct_reject);
          } else if (decision === 'FREEZE') {
            baseEarnings = 150;
            alignmentShift = 'whistleblower';
            humanCostMsg = pickRandom(HUMAN_COSTS.freeze_correct);
          }
        } else {
          if (decision === 'APPROVE') {
            baseEarnings = client.isContraband ? -50 : -25;
            citationsAdded = event?.type === 'audit_sweep' ? 2 : 1;
            alignmentShift = 'survivalist';
            humanCostMsg = pickRandom(HUMAN_COSTS.approve_fraud);
          } else {
            baseEarnings = -10;
            citationsAdded = 1;
            alignmentShift = 'survivalist';
            humanCostMsg = pickRandom(HUMAN_COSTS.reject_innocent);
          }
        }

        // Memo intel bonus
        if (prev.memoActed && prev.activeMemo && decision === prev.activeMemo.suggestedAction && isCorrect) {
          baseEarnings += prev.activeMemo.bonusIfActed;
          alignmentShift = prev.activeMemo.alignmentReward;
        }

        const earnings = Math.round(baseEarnings * wageMult);

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
      if (prev.day >= MAX_DAYS) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        const ending = calculateEnding(prev.money, prev.citations, prev.alignment, prev.worldState);
        return { ...prev, status: 'VICTORY', ending };
      }
      const nextDay = prev.day + 1;
      return { ...prev, day: nextDay, status: 'DAY_START', activeEvent: DAILY_EVENTS[nextDay] || null };
    });
  }, []);

  const returnToMenu = useCallback(() => {
    setState(prev => ({ ...prev, status: 'TITLE' }));
  }, []);

  return { state, stampAction, startGame, startDay, callNextClient, processDecision, actOnMemo, dismissMemo, endDay, returnToMenu };
}
