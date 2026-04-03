import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine, DAILY_GOALS } from '@/hooks/useGameEngine';
import { formatMoney } from '@/lib/utils';
import { RENT_BY_DAY, MAX_FOOD, FOOD_LABELS } from '@/lib/eveningEvents';
import { EveningEventChoice } from '@/types/game';
import { Moon, DollarSign, Utensils, ShieldAlert, TrendingDown, TrendingUp, Zap } from 'lucide-react';

const C = {
  bg:     '#120d0a',
  panel:  '#16110e',
  border: '#6f4b1f',
  accent: '#e0a11b',
  muted:  '#7a5520',
  green:  '#3fa35c',
  red:    '#b4473f',
  text:   '#f3dfb2',
};

function FoodBar({ food }: { food: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: MAX_FOOD }).map((_, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-sm border transition-all"
          style={{
            background: i < food ? (food <= 1 ? C.red : food <= 2 ? C.accent : C.green) : 'transparent',
            borderColor: i < food ? (food <= 1 ? C.red : food <= 2 ? C.accent : C.green) : C.border + '44',
          }}
        />
      ))}
      <span className="font-terminal text-xs ml-1" style={{ color: food <= 1 ? C.red : food <= 2 ? C.accent : C.muted }}>
        {FOOD_LABELS[food] ?? 'Unknown'}
      </span>
    </div>
  );
}

export default function EveningScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, confirmEvening } = engine;
  const [extraFood, setExtraFood]     = useState(0);
  const [buyBoost, setBuyBoost]       = useState(false);
  const [eventChoice, setEventChoice] = useState<string | undefined>(undefined);
  const [confirmed, setConfirmed]     = useState(false);

  const evt = state.activeEveningEvent;
  const rent = RENT_BY_DAY[state.day] ?? 60;
  const foodBuyCost = extraFood * 30;
  const boostCost = buyBoost ? 40 : 0;

  // Event effect preview
  let evtMoney = 0;
  let evtFood  = 0;
  let evtPerf  = 0;
  if (evt) {
    if (evt.type === 'auto' && evt.autoEffect) {
      evtMoney = evt.autoEffect.moneyDelta;
      evtFood  = evt.autoEffect.foodDelta;
      evtPerf  = evt.autoEffect.perfDelta;
    } else if (evt.type === 'choice' && eventChoice && evt.choices) {
      const c = evt.choices.find(ch => ch.id === eventChoice);
      if (c) { evtMoney = c.moneyDelta; evtFood = c.foodDelta; evtPerf = c.perfDelta; }
    }
  }

  const totalSpend   = rent + foodBuyCost + boostCost;
  const netMoney     = state.money - totalSpend + evtMoney;
  const netFood      = Math.max(0, Math.min(MAX_FOOD, state.food - 1 + extraFood + evtFood));
  const dailyEarned  = state.dailyLogs.reduce((a, l) => a + l.earnings, 0);
  const dailyGoal    = DAILY_GOALS[state.day] ?? 300;
  const goalMet      = dailyEarned >= dailyGoal;

  const canConfirm = evt?.type === 'choice' ? !!eventChoice : true;
  const isLastDay  = state.day >= 7;

  function handleConfirm() {
    if (!canConfirm || confirmed) return;
    setConfirmed(true);
    setTimeout(() => {
      confirmEvening({ extraFood, buyBoost, eventChoiceId: eventChoice });
    }, 400);
  }

  const categoryColor: Record<string, string> = {
    FINANCIAL: C.accent,
    PERSONAL:  '#c9aa7a',
    PROFESSIONAL: '#7ab0f0',
    MORAL: '#b888e8',
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6"
         style={{ background: C.bg, color: C.text }}>

      {/* Subtle grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
           style={{
             backgroundImage: 'radial-gradient(circle, #e0a11b 1px, transparent 1px)',
             backgroundSize: '24px 24px',
           }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[820px] flex flex-col gap-0 border"
        style={{ background: C.panel, borderColor: C.border }}
      >

        {/* Header */}
        <div className="px-8 py-5 border-b flex items-center justify-between"
             style={{ borderColor: C.border, background: '#0d0906' }}>
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5" style={{ color: C.accent }} />
            <div>
              <div className="font-stamped text-xl tracking-widest" style={{ color: C.accent }}>
                END OF SHIFT — DAY {state.day}
              </div>
              <div className="font-terminal text-[10px] mt-0.5" style={{ color: C.muted }}>
                Evening Resource Management
              </div>
            </div>
          </div>
          <div className="font-terminal text-xs" style={{ color: C.muted }}>
            {isLastDay ? 'FINAL SHIFT' : `Day ${state.day + 1} begins tomorrow`}
          </div>
        </div>

        <div className="flex divide-x divide-amber-900/40">

          {/* ── Left column: Summary + Event ─────────────────────────────────── */}
          <div className="flex-1 flex flex-col divide-y divide-amber-900/25">

            {/* Shift Summary */}
            <div className="px-6 py-5">
              <div className="font-terminal text-[10px] uppercase tracking-widest mb-3" style={{ color: C.muted }}>
                Today's Shift Summary
              </div>
              <div className="grid grid-cols-4 text-[10px] font-terminal mb-2 pb-1.5 border-b" style={{ borderColor: C.border + '44', color: C.muted }}>
                <span>Citizen</span><span>Decision</span><span>Result</span><span className="text-right">Pay</span>
              </div>
              {state.dailyLogs.length === 0 ? (
                <div className="font-terminal text-xs opacity-30 py-2">No cases processed today.</div>
              ) : (
                state.dailyLogs.map((log, i) => (
                  <div key={i} className="grid grid-cols-4 font-terminal text-xs py-1 border-b last:border-0" style={{ borderColor: C.border + '22' }}>
                    <span className="truncate opacity-70">{log.clientName}</span>
                    <span className={log.decision === 'APPROVE' ? 'text-green-400' : log.decision === 'FREEZE' ? 'text-blue-400' : 'text-red-400'}>{log.decision}</span>
                    <span className={log.wasCorrect ? 'text-green-400' : 'text-red-400'}>{log.wasCorrect ? '✓' : '✗'}</span>
                    <span className="text-right" style={{ color: log.earnings >= 0 ? C.green : C.red }}>{formatMoney(log.earnings)}</span>
                  </div>
                ))
              )}

              {/* Goal status */}
              <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: C.border + '44' }}>
                <div className="font-terminal text-xs" style={{ color: C.muted }}>
                  Shift Target: {formatMoney(dailyGoal)}
                </div>
                <div className="font-terminal text-sm font-bold" style={{ color: goalMet ? C.green : C.red }}>
                  {goalMet ? `✓ Target Met` : `✗ Shortfall: ${formatMoney(dailyGoal - dailyEarned)}`}
                </div>
              </div>
            </div>

            {/* Evening Event */}
            {evt && (
              <div className="px-6 py-5">
                <div className="font-terminal text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: C.muted }}>
                  <Zap className="w-3 h-3" />
                  Evening Dispatch
                </div>

                <div className="border rounded-sm p-4" style={{ borderColor: C.border, background: 'rgba(14,10,8,0.5)' }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-terminal text-[9px] uppercase tracking-widest mb-0.5"
                           style={{ color: categoryColor[evt.category] ?? C.muted }}>
                        {evt.category}
                      </div>
                      <div className="font-terminal text-sm font-bold" style={{ color: C.text }}>{evt.title}</div>
                    </div>
                    {evt.type === 'auto' && evt.autoEffect && (
                      <div className={`font-terminal text-sm font-bold shrink-0 ${evt.autoEffect.moneyDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {evt.autoEffect.moneyDelta >= 0 ? '+' : ''}{formatMoney(evt.autoEffect.moneyDelta)}
                      </div>
                    )}
                  </div>

                  <p className="font-terminal text-xs leading-relaxed mb-4" style={{ color: '#c9aa7a' }}>
                    {evt.description}
                  </p>

                  {evt.type === 'auto' && evt.autoEffect && (
                    <div className="font-terminal text-[10px] px-3 py-2 border rounded-sm" style={{ borderColor: C.border + '44', color: C.muted, background: 'rgba(224,161,27,0.04)' }}>
                      Auto-applied: {evt.autoEffect.label}
                      {evt.autoEffect.foodDelta < 0 && ` · ${evt.autoEffect.foodDelta} rations`}
                    </div>
                  )}

                  {evt.type === 'choice' && evt.choices && (
                    <div className="flex flex-col gap-2">
                      {evt.choices.map((ch: EveningEventChoice) => (
                        <button
                          key={ch.id}
                          onClick={() => setEventChoice(ch.id)}
                          className="w-full text-left px-4 py-3 border rounded-sm transition-all font-terminal text-xs"
                          style={{
                            borderColor: eventChoice === ch.id ? C.accent : C.border + '55',
                            background: eventChoice === ch.id ? 'rgba(224,161,27,0.08)' : 'rgba(14,10,8,0.4)',
                            color: C.text,
                          }}
                        >
                          <div className="font-bold mb-0.5">{ch.label}</div>
                          <div className="opacity-60 text-[10px]">{ch.description}</div>
                          <div className="flex gap-3 mt-1.5 text-[10px]">
                            {ch.moneyDelta !== 0 && (
                              <span className={ch.moneyDelta > 0 ? 'text-green-400' : 'text-red-400'}>
                                {ch.moneyDelta > 0 ? '+' : ''}{formatMoney(ch.moneyDelta)}
                              </span>
                            )}
                            {ch.foodDelta !== 0 && (
                              <span className={ch.foodDelta > 0 ? 'text-green-400' : 'text-red-400'}>
                                {ch.foodDelta > 0 ? '+' : ''}{ch.foodDelta} rations
                              </span>
                            )}
                            {ch.perfDelta !== 0 && (
                              <span className={ch.perfDelta > 0 ? 'text-blue-400' : 'text-orange-400'}>
                                {ch.perfDelta > 0 ? '+' : ''}{Math.round(ch.perfDelta * 100)}% performance
                              </span>
                            )}
                            {ch.alignment && (
                              <span className="opacity-50">
                                [{ch.alignment === 'corporate' ? 'Corporate' : ch.alignment === 'whistleblower' ? 'Resistance' : 'Survivalist'}]
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: Resources + Purchases ──────────────────────────── */}
          <div className="w-72 shrink-0 flex flex-col divide-y divide-amber-900/25">

            {/* Current Resources */}
            <div className="px-5 py-5">
              <div className="font-terminal text-[10px] uppercase tracking-widest mb-4" style={{ color: C.muted }}>
                Resources
              </div>

              <div className="flex flex-col gap-4">
                {/* Money */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3 h-3" style={{ color: C.green }} />
                    <span className="font-terminal text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>Balance</span>
                  </div>
                  <div className="font-terminal text-2xl font-bold" style={{ color: C.green }}>
                    {formatMoney(state.money)}
                  </div>
                </div>

                {/* Food */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Utensils className="w-3 h-3" style={{ color: C.muted }} />
                    <span className="font-terminal text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>Rations</span>
                  </div>
                  <FoodBar food={state.food} />
                  {state.food <= 1 && (
                    <div className="font-terminal text-[10px] mt-1.5" style={{ color: C.red }}>
                      ⚠ Low rations — wage penalty active tomorrow
                    </div>
                  )}
                </div>

                {/* Performance mod */}
                {state.performanceMod !== 1.0 && (
                  <div>
                    <div className="font-terminal text-[9px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>
                      Performance Modifier (current)
                    </div>
                    <div className="font-terminal text-sm" style={{ color: state.performanceMod >= 1.0 ? C.green : C.red }}>
                      {state.performanceMod >= 1.0 ? '▲' : '▼'} {Math.round(state.performanceMod * 100)}% wages
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tonight's Fixed Expenses */}
            <div className="px-5 py-4">
              <div className="font-terminal text-[10px] uppercase tracking-widest mb-3" style={{ color: C.muted }}>
                Fixed Expenses
              </div>
              <div className="flex flex-col gap-2 font-terminal text-xs">
                <div className="flex justify-between">
                  <span style={{ color: '#c9aa7a' }}>Rent (Day {state.day})</span>
                  <span style={{ color: C.red }}>−{formatMoney(rent)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#c9aa7a' }}>Daily food consumed</span>
                  <span style={{ color: C.muted }}>−1 ration</span>
                </div>
              </div>
            </div>

            {/* Optional Purchases */}
            <div className="px-5 py-4">
              <div className="font-terminal text-[10px] uppercase tracking-widest mb-3" style={{ color: C.muted }}>
                Optional Purchases
              </div>
              <div className="flex flex-col gap-2">

                {/* Buy rations */}
                <div className="border rounded-sm p-3" style={{ borderColor: C.border + '55', background: 'rgba(14,10,8,0.4)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-terminal text-xs">Buy Rations</span>
                    <span className="font-terminal text-[10px]" style={{ color: C.muted }}>$30 each</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExtraFood(f => Math.max(0, f - 1))}
                      disabled={extraFood === 0}
                      className="w-7 h-7 border font-terminal text-lg leading-none disabled:opacity-30"
                      style={{ borderColor: C.border }}
                    >−</button>
                    <span className="flex-1 text-center font-terminal text-sm" style={{ color: extraFood > 0 ? C.green : C.muted }}>
                      {extraFood}
                    </span>
                    <button
                      onClick={() => setExtraFood(f => Math.min(MAX_FOOD - state.food + 1, f + 1))}
                      disabled={state.food + extraFood >= MAX_FOOD}
                      className="w-7 h-7 border font-terminal text-lg leading-none disabled:opacity-30"
                      style={{ borderColor: C.border }}
                    >+</button>
                  </div>
                  {extraFood > 0 && (
                    <div className="font-terminal text-[10px] mt-1.5 text-center" style={{ color: C.green }}>
                      +{extraFood} rations · −{formatMoney(foodBuyCost)}
                    </div>
                  )}
                </div>

                {/* Performance boost */}
                <button
                  onClick={() => setBuyBoost(b => !b)}
                  className="w-full border rounded-sm p-3 text-left transition-all"
                  style={{
                    borderColor: buyBoost ? '#7ab0f0' : C.border + '55',
                    background: buyBoost ? 'rgba(58,106,191,0.10)' : 'rgba(14,10,8,0.4)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-terminal text-xs" style={{ color: C.text }}>Focus Training</span>
                    <span className="font-terminal text-[10px]" style={{ color: buyBoost ? '#7ab0f0' : C.muted }}>$40</span>
                  </div>
                  <div className="font-terminal text-[10px] mt-0.5 opacity-60">
                    +10% wage multiplier tomorrow
                  </div>
                </button>
              </div>
            </div>

            {/* Net Impact Preview */}
            <div className="px-5 py-4">
              <div className="font-terminal text-[10px] uppercase tracking-widest mb-3" style={{ color: C.muted }}>
                After Tonight
              </div>
              <div className="flex flex-col gap-1.5 font-terminal text-xs">
                <div className="flex justify-between">
                  <span style={{ color: '#c9aa7a' }}>Balance</span>
                  <span style={{ color: netMoney >= 0 ? C.green : C.red }} className="font-bold">
                    {formatMoney(netMoney)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#c9aa7a' }}>Rations</span>
                  <span style={{ color: netFood <= 1 ? C.red : netFood <= 2 ? C.accent : C.green }}>
                    {netFood}/{MAX_FOOD}
                  </span>
                </div>
                {(evtPerf !== 0 || buyBoost) && (
                  <div className="flex justify-between">
                    <span style={{ color: '#c9aa7a' }}>Perf. modifier</span>
                    <span style={{ color: (evtPerf + (buyBoost ? 0.10 : 0)) >= 0 ? '#7ab0f0' : C.red }}>
                      {evtPerf + (buyBoost ? 0.10 : 0) >= 0 ? '+' : ''}{Math.round((evtPerf + (buyBoost ? 0.10 : 0)) * 100)}%
                    </span>
                  </div>
                )}
                {netMoney < 0 && (
                  <div className="mt-1 font-terminal text-[10px] px-2 py-1.5 border rounded-sm" style={{ borderColor: C.red + '55', background: 'rgba(180,71,63,0.08)', color: C.red }}>
                    ⚠ Negative balance. Debt carries over.
                  </div>
                )}
              </div>
            </div>

            {/* Confirm button */}
            <div className="px-5 py-5">
              <motion.button
                onClick={handleConfirm}
                disabled={!canConfirm || confirmed}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 font-terminal text-sm font-bold uppercase tracking-widest border transition-all disabled:opacity-30"
                style={{
                  borderColor: canConfirm ? C.accent : C.border,
                  background: canConfirm ? 'rgba(224,161,27,0.10)' : 'transparent',
                  color: canConfirm ? C.accent : C.muted,
                }}
              >
                {confirmed ? 'Heading home...' : isLastDay ? 'Submit Final Report →' : 'End Shift — Begin Day ' + (state.day + 1) + ' →'}
              </motion.button>
              {evt?.type === 'choice' && !eventChoice && (
                <div className="font-terminal text-[10px] text-center mt-2" style={{ color: C.muted }}>
                  Choose a response to the evening event first
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Citations warning strip */}
        {state.citations > 0 && (
          <div className="px-6 py-2.5 border-t flex items-center gap-2 font-terminal text-[10px]"
               style={{ borderColor: C.border, background: 'rgba(180,71,63,0.06)', color: state.citations >= 4 ? C.red : C.muted }}>
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" style={{ color: state.citations >= 4 ? C.red : C.muted }} />
            {state.citations}/5 citations issued — {5 - state.citations} more before termination
            {state.citations >= 4 && ' — CRITICAL: one more citation ends your employment'}
          </div>
        )}
      </motion.div>
    </div>
  );
}
