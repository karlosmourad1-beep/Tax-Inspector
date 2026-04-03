import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine, FEED_COST, MEDICINE_COST } from '@/hooks/useGameEngine';
import { formatMoney } from '@/lib/utils';
import { RENT_BY_DAY } from '@/lib/eveningEvents';
import { FamilyMember, FamilyMemberStatus } from '@/types/game';

const C = {
  bg:     '#120d0a',
  panel:  '#16110e',
  border: '#6f4b1f',
  accent: '#e0a11b',
  green:  '#3fa35c',
  red:    '#b4473f',
  blue:   '#6aabf0',
  text:   '#f3dfb2',
  muted:  '#7a5520',
};

const STATUS_COLOR: Record<FamilyMemberStatus, string> = {
  OK:       C.green,
  HUNGRY:   '#d4a017',
  WEAK:     '#c17f24',
  SICK:     C.red,
  CRITICAL: '#8b0000',
};

const STATUS_BG: Record<FamilyMemberStatus, string> = {
  OK:       'rgba(63,163,92,0.10)',
  HUNGRY:   'rgba(212,160,23,0.10)',
  WEAK:     'rgba(193,127,36,0.10)',
  SICK:     'rgba(180,71,63,0.12)',
  CRITICAL: 'rgba(139,0,0,0.18)',
};

const ROLE_ICON: Record<string, string> = {
  wife:     '♀',
  son:      '♂',
  daughter: '♀',
  dog:      '🐕',
};

export default function EveningScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, confirmEvening } = engine;

  const [fedIds,     setFedIds]     = useState<Set<string>>(new Set());
  const [treatedIds, setTreatedIds] = useState<Set<string>>(new Set());
  const [confirmed,  setConfirmed]  = useState(false);

  const rent        = RENT_BY_DAY[state.day] ?? 60;
  const feedCost    = fedIds.size * FEED_COST;
  const treatCost   = treatedIds.size * MEDICINE_COST;
  const remaining   = state.money - rent - feedCost - treatCost;
  const isLastDay   = state.day >= 7;

  function toggleFeed(id: string) {
    setFedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleTreat(id: string) {
    setTreatedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    if (confirmed) return;
    setConfirmed(true);
    setTimeout(() => {
      confirmEvening({ fedIds: [...fedIds], treatedIds: [...treatedIds] });
    }, 280);
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
        className="flex flex-col items-center w-full max-w-sm gap-5 px-4"
      >
        {/* Header */}
        <div className="font-terminal text-xs uppercase tracking-[0.35em]" style={{ color: C.muted }}>
          Day {state.day} — Shift Over
        </div>

        {/* Balance */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="font-stamped leading-none" style={{ fontSize: '4.5rem', color: C.text }}>
            {formatMoney(state.money)}
          </div>
          <div className="font-terminal text-[10px] uppercase tracking-[0.3em]" style={{ color: C.muted }}>
            Available
          </div>
        </div>

        {/* Rent row */}
        <div
          className="w-full flex items-center justify-between px-4 py-2.5 border"
          style={{ borderColor: C.red + '66', background: 'rgba(180,71,63,0.08)' }}
        >
          <span className="font-terminal text-xs uppercase tracking-widest" style={{ color: '#e07070' }}>
            Rent — Day {state.day}
          </span>
          <span className="font-terminal text-base font-bold" style={{ color: C.red }}>
            −{formatMoney(rent)}
          </span>
        </div>

        {/* Family cards */}
        <div className="w-full grid grid-cols-2 gap-2">
          {state.family.map(member => (
            <FamilyCard
              key={member.id}
              member={member}
              fed={fedIds.has(member.id)}
              treated={treatedIds.has(member.id)}
              canFeed={remaining + (fedIds.has(member.id) ? FEED_COST : 0) >= FEED_COST}
              canTreat={remaining + (treatedIds.has(member.id) ? MEDICINE_COST : 0) >= MEDICINE_COST}
              onToggleFeed={() => toggleFeed(member.id)}
              onToggleTreat={() => toggleTreat(member.id)}
            />
          ))}
        </div>

        {/* Remaining */}
        <div className="w-full flex items-center justify-between px-1">
          <span className="font-terminal text-xs uppercase tracking-[0.3em]" style={{ color: C.muted }}>
            Remaining
          </span>
          <motion.span
            key={remaining}
            initial={{ opacity: 0.6, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1 }}
            className="font-stamped text-3xl"
            style={{ color: remaining < 0 ? C.red : C.text }}
          >
            {formatMoney(remaining)}
          </motion.span>
        </div>

        {remaining < 0 && (
          <div className="w-full text-center font-terminal text-xs uppercase tracking-wider"
               style={{ color: C.red, marginTop: -12 }}>
            ⚠ Over budget — remove a choice
          </div>
        )}

        {/* Continue */}
        <motion.button
          onClick={handleConfirm}
          disabled={confirmed || remaining < 0}
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

// ─── Family Card ──────────────────────────────────────────────────────────────
function FamilyCard({
  member, fed, treated,
  canFeed, canTreat,
  onToggleFeed, onToggleTreat,
}: {
  member: FamilyMember;
  fed: boolean;
  treated: boolean;
  canFeed: boolean;
  canTreat: boolean;
  onToggleFeed: () => void;
  onToggleTreat: () => void;
}) {
  const needsMed = member.status === 'SICK' || member.status === 'CRITICAL';
  const isCritical = member.status === 'CRITICAL';

  return (
    <motion.div
      className="flex flex-col border"
      animate={isCritical && !treated ? { borderColor: ['#8b0000', '#b4473f', '#8b0000'] } : {}}
      transition={{ duration: 1.2, repeat: Infinity }}
      style={{
        borderColor: isCritical && !treated ? '#8b0000' : STATUS_COLOR[member.status] + '55',
        background: STATUS_BG[member.status],
      }}
    >
      {/* Top: name + status */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{ROLE_ICON[member.role]}</span>
          <span className="font-terminal text-xs font-bold uppercase" style={{ color: C.text }}>
            {member.name}
          </span>
        </div>
        <span
          className="font-terminal text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5"
          style={{
            color: STATUS_COLOR[member.status],
            background: STATUS_COLOR[member.status] + '22',
            border: `1px solid ${STATUS_COLOR[member.status]}44`,
          }}
        >
          {member.status}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-1 px-2 pb-2.5 pt-1">
        {/* Feed button */}
        <button
          onClick={onToggleFeed}
          disabled={!fed && !canFeed}
          className="w-full py-1.5 font-terminal text-[10px] font-bold uppercase tracking-wider border transition-all disabled:opacity-30"
          style={{
            borderColor: fed ? C.green : C.border,
            background:  fed ? 'rgba(63,163,92,0.14)' : 'rgba(255,255,255,0.02)',
            color:       fed ? C.green : C.text,
          }}
        >
          {fed ? `✓ Fed  −$${FEED_COST}` : `Feed  $${FEED_COST}`}
        </button>

        {/* Medicine button — only when sick/critical */}
        <AnimatePresence>
          {needsMed && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onClick={onToggleTreat}
              disabled={!treated && !canTreat}
              className="w-full py-1.5 font-terminal text-[10px] font-bold uppercase tracking-wider border transition-all disabled:opacity-30 overflow-hidden"
              style={{
                borderColor: treated ? C.blue : C.red + '88',
                background:  treated ? 'rgba(106,171,240,0.12)' : 'rgba(180,71,63,0.08)',
                color:       treated ? C.blue : '#e07070',
              }}
            >
              {treated ? `✓ Med  −$${MEDICINE_COST}` : `💊 Med  $${MEDICINE_COST}`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
