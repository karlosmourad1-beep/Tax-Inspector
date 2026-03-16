import { useState, useCallback, useRef } from 'react';
import { GameState, Client, DailyLog } from '../types/game';
import { generateDailyClients } from '../lib/generator';
import confetti from 'canvas-confetti';

const INITIAL_MONEY = 0;
const MAX_CITATIONS = 5;
const MAX_DAYS = 7;
const CLIENTS_PER_DAY = 4;

export function useGameEngine() {
  const [state, setState] = useState<GameState>({
    status: 'TITLE',
    day: 1,
    money: INITIAL_MONEY,
    citations: 0,
    clientsQueue: [],
    currentClient: null,
    dailyLogs: [],
  });

  const [stampAction, setStampAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playThud = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Ignore audio errors
    }
  }, []);

  const startGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'DAY_START',
      day: 1,
      money: INITIAL_MONEY,
      citations: 0,
      dailyLogs: []
    }));
  }, []);

  const startDay = useCallback(() => {
    setState(prev => {
      const queue = generateDailyClients(prev.day, CLIENTS_PER_DAY);
      return {
        ...prev,
        status: 'PLAYING',
        clientsQueue: queue,
        currentClient: null,
        dailyLogs: []
      };
    });
  }, []);

  const callNextClient = useCallback(() => {
    setState(prev => {
      if (prev.clientsQueue.length === 0) {
        return { ...prev, status: 'DAY_END', currentClient: null };
      }
      const nextQueue = [...prev.clientsQueue];
      const nextClient = nextQueue.shift() || null;
      return {
        ...prev,
        clientsQueue: nextQueue,
        currentClient: nextClient
      };
    });
  }, []);

  // circledCount = number of fields the player circled as suspicious before deciding
  const processDecision = useCallback((decision: 'APPROVE' | 'REJECT', circledCount: number = 0) => {
    setStampAction(decision);
    playThud();

    setTimeout(() => {
      setStampAction(null);

      setState(prev => {
        if (!prev.currentClient) return prev;

        const isCorrect = prev.currentClient.expectedDecision === decision;
        let earnings = 0;
        let citationsAdded = 0;

        if (isCorrect && decision === 'APPROVE') {
          earnings = 50;
        }
        if (isCorrect && decision === 'REJECT') {
          // Base reward + $25 per circled discrepancy (max 4 bonus slots)
          const circledBonus = Math.min(circledCount, 4) * 25;
          earnings = 75 + circledBonus;
        }
        if (!isCorrect && decision === 'APPROVE') {
          earnings = -25;
          citationsAdded = 1;
        }
        if (!isCorrect && decision === 'REJECT') {
          earnings = -10;
          citationsAdded = 1;
        }

        const log: DailyLog = {
          clientId: prev.currentClient.id,
          clientName: prev.currentClient.name,
          decision,
          wasCorrect: isCorrect,
          earnings,
          citations: citationsAdded
        };

        const newCitations = prev.citations + citationsAdded;
        const newMoney = prev.money + earnings;

        if (newCitations >= MAX_CITATIONS) {
          return {
            ...prev,
            money: newMoney,
            citations: newCitations,
            dailyLogs: [...prev.dailyLogs, log],
            status: 'GAME_OVER',
            currentClient: null
          };
        }

        const nextQueue = [...prev.clientsQueue];
        const nextStatus = nextQueue.length === 0 ? 'DAY_END' : 'PLAYING';
        const nextClient = nextStatus === 'PLAYING' ? nextQueue.shift() || null : null;

        return {
          ...prev,
          money: newMoney,
          citations: newCitations,
          dailyLogs: [...prev.dailyLogs, log],
          status: nextStatus,
          clientsQueue: nextQueue,
          currentClient: nextClient
        };
      });
    }, 800);
  }, [playThud]);

  const endDay = useCallback(() => {
    setState(prev => {
      if (prev.day >= MAX_DAYS) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        return { ...prev, status: 'VICTORY' };
      }
      return {
        ...prev,
        day: prev.day + 1,
        status: 'DAY_START'
      };
    });
  }, []);

  const returnToMenu = useCallback(() => {
    setState(prev => ({ ...prev, status: 'TITLE' }));
  }, []);

  return {
    state,
    stampAction,
    startGame,
    startDay,
    callNextClient,
    processDecision,
    endDay,
    returnToMenu
  };
}
