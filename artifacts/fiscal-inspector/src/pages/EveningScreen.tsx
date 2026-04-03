import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameEngine, DAILY_GOALS } from '@/hooks/useGameEngine';
import { formatMoney } from '@/lib/utils';
import { RENT_BY_DAY } from '@/lib/eveningEvents';

const C = {
  bg:     '#120d0a',
  panel:  '#16110e',
  border: '#6f4b1f',
  accent: '#e0a11b',
  muted:  '#7a5520',
  green:  '#3fa35c',
  red:    '#b4473f',
  text:   '#f3dfb2',
  dim:    '#c9aa7a',
};

export default function EveningScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, confirmEvening } = engine;
  const [eventChoice, setEventChoice] = useState<string | undefined>(undefined);
  const [buyFood, setBuyFood]         = useState(false);
  const [confirmed, setConfirmed]     = useState(false);

  const evt      = state.activeEveningEvent;
  const rent     = RENT_BY_DAY[state.day] ?? 60;
  const isChoice = evt?.type === 'choice';
  const canNext  = !isChoice || !!eventChoice;
  const isLastDay = state.day >= 7;

  // Shift totals
  const earned   = state.dailyLogs.filter(l => l.earnings > 0).reduce((a, l) => a + l.earnings, 0);
  const lost     = state.dailyLogs.filter(l => l.earnings < 0).reduce((a, l) => a + l.earnings, 0);
  const goal     = DAILY_GOALS[state.day] ?? 300;
  const goalMet  = (earned + lost) >= goal;

  function handleConfirm() {
    if (!canNext || confirmed) return;
    setConfirmed(true);
    setTimeout(() => {
      confirmEvening({ extraFood: buyFood ? 1 : 0, buyBoost: false, eventChoiceId: eventChoice });
    }, 300);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center"
         style={{ background: C.bg, color: C.text }}>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md flex flex-col border"
        style={{ background: C.panel, borderColor: C.border }}
      >

        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b" style={{ borderColor: C.border }}>
          <div className="font-terminal text-[10px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>
            End of Day {state.day}
          </div>
          <div className="font-stamped text-2xl tracking-widest" style={{ color: C.accent }}>
            SHIFT OVER
          </div>
        </div>

        {/* A. Earnings summary */}
        <div className="px-8 py-6 border-b" style={{ borderColor: C.border + '55' }}>
          <div className="flex flex-col gap-2 font-terminal text-sm">
            <div className="flex justify-between">
              <span style={{ color: C.dim }}>Earned</span>
              <span style={{ color: C.green }}>+{formatMoney(earned)}</span>
            </div>
            {lost < 0 && (
              <div className="flex justify-between">
                <span style={{ color: C.dim }}>Penalties</span>
                <span style={{ color: C.red }}>{formatMoney(lost)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 mt-1" style={{ borderColor: C.border + '44' }}>
              <span style={{ color: C.dim }}>Today's pay</span>
              <span className="font-bold" style={{ color: goalMet ? C.green : C.red }}>
                {formatMoney(earned + lost)}
                {!goalMet && <span className="font-normal opacity-60 text-xs ml-2">(target: {formatMoney(goal)})</span>}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: C.dim }}>Balance after rent</span>
              <span className="font-bold" style={{ color: (state.money - rent) >= 0 ? C.text : C.red }}>
                {formatMoney(state.money - rent)}
              </span>
            </div>
          </div>
        </div>

        {/* B. Evening event */}
        {evt && (
          <div className="px-8 py-6 border-b" style={{ borderColor: C.border + '55' }}>
            <div className="font-terminal text-[10px] uppercase tracking-widest mb-3" style={{ color: C.muted }}>
              Tonight
            </div>
            <p className="font-terminal text-sm leading-relaxed mb-4" style={{ color: C.dim }}>
              {evt.description}
            </p>

            {evt.type === 'auto' && evt.autoEffect && (
              <div className="font-terminal text-xs px-3 py-2 border rounded-sm" style={{ borderColor: C.border + '44', color: C.muted, background: 'rgba(224,161,27,0.04)' }}>
                {evt.autoEffect.label}
              </div>
            )}

            {evt.type === 'choice' && evt.choices && (
              <div className="flex flex-col gap-2">
                {evt.choices.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setEventChoice(ch.id)}
                    className="w-full text-left px-4 py-3 border rounded-sm transition-all font-terminal text-sm"
                    style={{
                      borderColor: eventChoice === ch.id ? C.accent : C.border + '55',
                      background: eventChoice === ch.id ? 'rgba(224,161,27,0.08)' : 'rgba(14,10,8,0.4)',
                      color: C.text,
                    }}
                  >
                    <div className="font-bold">{ch.label}</div>
                    {(ch.moneyDelta !== 0 || ch.foodDelta !== 0) && (
                      <div className="flex gap-3 mt-1 font-terminal text-[11px]" style={{ color: C.muted }}>
                        {ch.moneyDelta !== 0 && (
                          <span style={{ color: ch.moneyDelta > 0 ? C.green : C.red }}>
                            {ch.moneyDelta > 0 ? '+' : ''}{formatMoney(ch.moneyDelta)}
                          </span>
                        )}
                        {ch.foodDelta !== 0 && (
                          <span style={{ color: ch.foodDelta > 0 ? C.green : C.red }}>
                            {ch.foodDelta > 0 ? '+' : ''}{ch.foodDelta} rations
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* C. Buy food? */}
        {state.food <= 2 && (
          <div className="px-8 py-5 border-b" style={{ borderColor: C.border + '55' }}>
            <div className="font-terminal text-[10px] uppercase tracking-widest mb-3" style={{ color: C.muted }}>
              Supplies
            </div>
            <button
              onClick={() => setBuyFood(b => !b)}
              className="w-full text-left px-4 py-3 border rounded-sm transition-all font-terminal text-sm"
              style={{
                borderColor: buyFood ? C.green : C.border + '55',
                background: buyFood ? 'rgba(63,163,92,0.08)' : 'rgba(14,10,8,0.4)',
                color: C.text,
              }}
            >
              <div className="font-bold">Buy rations — {formatMoney(30)}</div>
              <div className="font-terminal text-[11px] mt-0.5" style={{ color: C.muted }}>
                {state.food <= 1
                  ? 'You are nearly out of food. Missing meals hurts your performance.'
                  : 'Low on food. Buy now to stay sharp tomorrow.'}
              </div>
            </button>
          </div>
        )}

        {/* Confirm */}
        <div className="px-8 py-6">
          <motion.button
            onClick={handleConfirm}
            disabled={!canNext || confirmed}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 font-terminal text-sm font-bold uppercase tracking-widest border transition-all disabled:opacity-30"
            style={{
              borderColor: canNext ? C.accent : C.border,
              background: canNext ? 'rgba(224,161,27,0.10)' : 'transparent',
              color: canNext ? C.accent : C.muted,
            }}
          >
            {confirmed
              ? 'On your way home...'
              : isLastDay
                ? 'Submit Final Report →'
                : `Begin Day ${state.day + 1} →`}
          </motion.button>
          {isChoice && !eventChoice && (
            <div className="font-terminal text-[10px] text-center mt-2" style={{ color: C.muted }}>
              Make a choice above to continue
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
