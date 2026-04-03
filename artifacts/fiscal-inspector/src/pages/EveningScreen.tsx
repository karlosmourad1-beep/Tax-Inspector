import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { formatMoney } from '@/lib/utils';
import { RENT_BY_DAY } from '@/lib/eveningEvents';

const C = {
  bg:     '#120d0a',
  border: '#6f4b1f',
  accent: '#e0a11b',
  green:  '#3fa35c',
  red:    '#b4473f',
  text:   '#f3dfb2',
  muted:  '#7a5520',
};

export default function EveningScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, confirmEvening } = engine;
  const [buyFood, setBuyFood]     = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const rent      = RENT_BY_DAY[state.day] ?? 60;
  const foodCost  = buyFood ? 30 : 0;
  const remaining = state.money - rent - foodCost;
  const isLastDay = state.day >= 7;

  function handleConfirm() {
    if (confirmed) return;
    setConfirmed(true);
    setTimeout(() => confirmEvening({ extraFood: buyFood ? 1 : 0, buyBoost: false }), 280);
  }

  return (
    <div
      className="h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: C.bg, color: C.text }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center w-full max-w-xs gap-7"
        style={{ paddingBottom: 0 }}
      >

        {/* Header */}
        <div className="font-terminal text-xs uppercase tracking-[0.35em]" style={{ color: C.muted }}>
          Day {state.day} — Shift Over
        </div>

        {/* Big balance */}
        <div className="flex flex-col items-center gap-0.5">
          <div
            className="font-stamped leading-none"
            style={{ fontSize: '5.5rem', color: C.text }}
          >
            {formatMoney(state.money)}
          </div>
          <div className="font-terminal text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
            Available
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t" style={{ borderColor: C.border }} />

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-2.5">

          {/* Rent — locked/mandatory */}
          <div
            className="w-full flex items-center justify-between px-5 py-4 border"
            style={{
              borderColor: C.red + '88',
              background: 'rgba(180,71,63,0.12)',
            }}
          >
            <span className="font-terminal text-sm font-bold uppercase tracking-widest" style={{ color: '#e07070' }}>
              Pay Rent
            </span>
            <span className="font-terminal text-lg font-bold" style={{ color: C.red }}>
              −{formatMoney(rent)}
            </span>
          </div>

          {/* Food — toggle */}
          <button
            onClick={() => setBuyFood(b => !b)}
            className="w-full flex items-center justify-between px-5 py-4 border transition-all"
            style={{
              borderColor: buyFood ? C.green : C.border,
              background:  buyFood ? 'rgba(63,163,92,0.12)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <span className="font-terminal text-sm font-bold uppercase tracking-widest"
                  style={{ color: buyFood ? C.green : C.text }}>
              {buyFood ? '✓ Buy Food' : 'Buy Food'}
            </span>
            <span className="font-terminal text-lg font-bold"
                  style={{ color: buyFood ? C.green : C.muted }}>
              {buyFood ? `−$30` : `$30`}
            </span>
          </button>

          {/* Save — passive */}
          <button
            onClick={() => setBuyFood(false)}
            className="w-full flex items-center justify-between px-5 py-4 border transition-all"
            style={{
              borderColor: !buyFood ? C.accent + '55' : C.border + '33',
              background: 'transparent',
            }}
          >
            <span className="font-terminal text-sm font-bold uppercase tracking-widest"
                  style={{ color: !buyFood ? C.accent : C.muted }}>
              {!buyFood ? '✓ Save' : 'Save'}
            </span>
            <span className="font-terminal text-lg font-bold" style={{ color: C.muted }}>—</span>
          </button>
        </div>

        {/* Remaining */}
        <div className="w-full flex items-center justify-between px-1">
          <span className="font-terminal text-xs uppercase tracking-[0.3em]" style={{ color: C.muted }}>
            Remaining
          </span>
          <motion.span
            key={remaining}
            initial={{ opacity: 0.5, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.12 }}
            className="font-stamped text-3xl"
            style={{ color: remaining < 0 ? C.red : C.text }}
          >
            {formatMoney(remaining)}
          </motion.span>
        </div>

        {remaining < 0 && (
          <div className="w-full text-center font-terminal text-xs uppercase tracking-wider"
               style={{ color: C.red, marginTop: -16 }}>
            ⚠ Going into debt
          </div>
        )}

        {state.food <= 1 && !buyFood && (
          <div className="w-full text-center font-terminal text-xs uppercase tracking-wider"
               style={{ color: '#e07070', marginTop: -16 }}>
            ⚠ No food — wage penalty tomorrow
          </div>
        )}

        {/* Continue */}
        <motion.button
          onClick={handleConfirm}
          disabled={confirmed}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 font-terminal text-sm font-bold uppercase tracking-[0.35em] border-2 transition-all disabled:opacity-40"
          style={{ borderColor: C.accent, background: 'rgba(224,161,27,0.08)', color: C.accent }}
          onMouseOver={e => { if (!confirmed) e.currentTarget.style.background = 'rgba(224,161,27,0.18)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(224,161,27,0.08)'; }}
        >
          {confirmed ? '...' : isLastDay ? 'Submit Final Report →' : 'Continue →'}
        </motion.button>

      </motion.div>
    </div>
  );
}
