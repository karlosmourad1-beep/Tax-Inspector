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
  green:  '#3fa35c',
  red:    '#b4473f',
  text:   '#f3dfb2',
  muted:  '#7a5520',
};

export default function EveningScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, confirmEvening } = engine;
  const [buyFood, setBuyFood]   = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const rent      = RENT_BY_DAY[state.day] ?? 60;
  const foodCost  = buyFood ? 30 : 0;
  const totalSpend = rent + foodCost;

  const earned = state.dailyLogs.reduce((a, l) => a + l.earnings, 0);
  const remaining = state.money - totalSpend;

  const isLastDay     = state.day >= 7;
  const lowFood       = state.food <= 1 && !buyFood;

  function handleConfirm() {
    if (confirmed) return;
    setConfirmed(true);
    setTimeout(() => {
      confirmEvening({ extraFood: buyFood ? 1 : 0, buyBoost: false });
    }, 300);
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: C.bg, color: C.text }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-10 w-full max-w-sm px-6"
      >

        {/* Day label */}
        <div className="font-terminal text-sm uppercase tracking-[0.3em]" style={{ color: C.muted }}>
          Day {state.day} — Shift Over
        </div>

        {/* Big earned number */}
        <div className="flex flex-col items-center gap-1">
          <div className="font-stamped text-8xl font-bold leading-none"
               style={{ color: earned >= 0 ? C.green : C.red }}>
            {formatMoney(earned)}
          </div>
          <div className="font-terminal text-sm uppercase tracking-widest" style={{ color: C.muted }}>
            Earned Today
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t" style={{ borderColor: C.border }} />

        {/* Spend your money */}
        <div className="w-full flex flex-col gap-4">
          <div className="text-center font-terminal text-base uppercase tracking-[0.25em]" style={{ color: C.accent }}>
            Spend Your Money
          </div>

          {/* Rent — mandatory */}
          <div className="flex items-center justify-between px-5 py-4 border rounded"
               style={{ borderColor: C.border, background: 'rgba(180,71,63,0.08)' }}>
            <div>
              <div className="font-terminal text-base font-bold" style={{ color: C.text }}>Rent</div>
              <div className="font-terminal text-xs mt-0.5" style={{ color: C.muted }}>Required · Day {state.day}</div>
            </div>
            <div className="font-terminal text-xl font-bold" style={{ color: C.red }}>
              −{formatMoney(rent)}
            </div>
          </div>

          {/* Food — optional */}
          <button
            onClick={() => setBuyFood(b => !b)}
            className="flex items-center justify-between px-5 py-4 border rounded transition-all text-left"
            style={{
              borderColor: buyFood ? C.green : C.border,
              background: buyFood ? 'rgba(63,163,92,0.10)' : 'rgba(0,0,0,0.2)',
            }}
          >
            <div>
              <div className="font-terminal text-base font-bold" style={{ color: C.text }}>
                {buyFood ? '✓ ' : ''}Buy Food
              </div>
              <div className="font-terminal text-xs mt-0.5" style={{ color: C.muted }}>
                {state.food <= 1 ? 'Running low — performance penalty without food' : 'Optional ration'}
              </div>
            </div>
            <div className="font-terminal text-xl font-bold" style={{ color: buyFood ? C.green : C.muted }}>
              {buyFood ? `−$30` : `$30`}
            </div>
          </button>

          {/* Save — just shows what's left */}
          <div className="flex items-center justify-between px-5 py-4 border rounded"
               style={{ borderColor: C.border + '44', background: 'transparent' }}>
            <div className="font-terminal text-base" style={{ color: C.muted }}>Save</div>
            <div className="font-terminal text-xl font-bold" style={{ color: C.muted }}>—</div>
          </div>
        </div>

        {/* Remaining balance */}
        <div className="w-full flex flex-col items-center gap-1 py-4 border-t border-b"
             style={{ borderColor: C.border }}>
          <div className="font-terminal text-xs uppercase tracking-[0.25em]" style={{ color: C.muted }}>
            Remaining
          </div>
          <motion.div
            key={remaining}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
            className="font-stamped text-5xl font-bold"
            style={{ color: remaining >= 0 ? C.text : C.red }}
          >
            {formatMoney(remaining)}
          </motion.div>
          {remaining < 0 && (
            <div className="font-terminal text-sm font-bold" style={{ color: C.red }}>
              ⚠ You will go into debt
            </div>
          )}
        </div>

        {/* Warnings */}
        {lowFood && (
          <div className="w-full px-4 py-3 border rounded font-terminal text-sm text-center"
               style={{ borderColor: C.red + '55', background: 'rgba(180,71,63,0.10)', color: C.red }}>
            ⚠ No food — wage penalty applies tomorrow
          </div>
        )}

        {/* Confirm */}
        <motion.button
          onClick={handleConfirm}
          disabled={confirmed}
          whileTap={{ scale: 0.97 }}
          className="w-full py-5 font-terminal text-base font-bold uppercase tracking-widest border-2 transition-all disabled:opacity-40"
          style={{
            borderColor: C.accent,
            background: 'rgba(224,161,27,0.10)',
            color: C.accent,
          }}
        >
          {confirmed
            ? 'Going home...'
            : isLastDay
              ? 'Submit Final Report →'
              : `Begin Day ${state.day + 1} →`}
        </motion.button>

      </motion.div>
    </div>
  );
}
