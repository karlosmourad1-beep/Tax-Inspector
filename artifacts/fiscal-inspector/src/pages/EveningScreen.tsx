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
  CRITICAL: '#cc2200',
};

const STATUS_BG: Record<FamilyMemberStatus, string> = {
  OK:       'rgba(63,163,92,0.08)',
  HUNGRY:   'rgba(212,160,23,0.08)',
  WEAK:     'rgba(193,127,36,0.09)',
  SICK:     'rgba(180,71,63,0.11)',
  CRITICAL: 'rgba(204,34,0,0.15)',
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

  const rent      = RENT_BY_DAY[state.day] ?? 60;
  const feedCost  = fedIds.size * FEED_COST;
  const treatCost = treatedIds.size * MEDICINE_COST;
  const remaining = state.money - rent - feedCost - treatCost;
  const isLastDay = state.day >= 7;

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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col w-[88vw] max-w-4xl gap-6"
      >

        {/* ── TOP ROW: header + balance + rent ── */}
        <div className="flex items-end justify-between">
          {/* Left: label + big money */}
          <div className="flex flex-col gap-1">
            <div className="font-terminal text-xs uppercase tracking-[0.35em]" style={{ color: C.muted }}>
              Day {state.day} — Shift Over
            </div>
            <div className="font-stamped leading-none" style={{ fontSize: '6.5rem', color: C.text, lineHeight: 1 }}>
              {formatMoney(state.money)}
            </div>
            <div className="font-terminal text-xs uppercase tracking-[0.25em]" style={{ color: C.muted }}>
              Available
            </div>
          </div>

          {/* Right: rent + remaining stacked */}
          <div className="flex flex-col items-end gap-3">
            {/* Rent */}
            <div
              className="flex items-center gap-6 px-6 py-3 border"
              style={{ borderColor: C.red + '55', background: 'rgba(180,71,63,0.08)' }}
            >
              <span className="font-terminal text-sm uppercase tracking-widest" style={{ color: '#e07070' }}>
                Rent — Day {state.day}
              </span>
              <span className="font-stamped text-4xl" style={{ color: C.red }}>
                −{formatMoney(rent)}
              </span>
            </div>

            {/* Remaining */}
            <div className="flex items-center gap-4">
              <span className="font-terminal text-sm uppercase tracking-[0.25em]" style={{ color: C.muted }}>
                Remaining
              </span>
              <motion.span
                key={remaining}
                initial={{ opacity: 0.5, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.1 }}
                className="font-stamped text-5xl"
                style={{ color: remaining < 0 ? C.red : C.accent }}
              >
                {formatMoney(remaining)}
              </motion.span>
            </div>

            {remaining < 0 && (
              <div className="font-terminal text-xs uppercase tracking-wider text-right" style={{ color: C.red }}>
                ⚠ Over budget — remove a choice
              </div>
            )}
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="border-t" style={{ borderColor: C.border }} />

        {/* ── FAMILY CARDS ── */}
        <div className="grid grid-cols-4 gap-4">
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

        {/* ── CONTINUE ── */}
        {remaining < 0 && (
          <div className="w-full text-center font-terminal text-sm uppercase tracking-wider px-4 py-3 border"
               style={{ borderColor: C.red + '66', background: 'rgba(180,71,63,0.08)', color: C.red }}>
            Continuing with debt will have consequences
          </div>
        )}

        <motion.button
          onClick={handleConfirm}
          disabled={confirmed}
          whileTap={{ scale: 0.98 }}
          className="w-full py-5 font-terminal text-base font-bold uppercase tracking-[0.4em] border-2 transition-all disabled:opacity-40"
          style={{ borderColor: C.accent, background: 'rgba(224,161,27,0.08)', color: C.accent }}
          onMouseOver={e => { if (!confirmed) e.currentTarget.style.background = 'rgba(224,161,27,0.16)'; }}
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
  const needsMed   = member.status === 'SICK' || member.status === 'CRITICAL';
  const isCritical = member.status === 'CRITICAL';

  return (
    <motion.div
      className="flex flex-col border"
      animate={isCritical && !treated
        ? { borderColor: ['#cc2200', '#ff4422', '#cc2200'] }
        : { borderColor: STATUS_COLOR[member.status] + '44' }}
      transition={{ duration: 1.1, repeat: isCritical ? Infinity : 0 }}
      style={{ background: STATUS_BG[member.status] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{ROLE_ICON[member.role]}</span>
          <span className="font-terminal text-base font-bold uppercase tracking-wide" style={{ color: C.text }}>
            {member.name}
          </span>
        </div>
        <span
          className="font-terminal text-xs font-bold uppercase tracking-wider px-2 py-1"
          style={{
            color:      STATUS_COLOR[member.status],
            background: STATUS_COLOR[member.status] + '20',
            border:     `1px solid ${STATUS_COLOR[member.status]}55`,
          }}
        >
          {member.status}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 px-3 pb-4 pt-1">
        {/* Feed */}
        <button
          onClick={onToggleFeed}
          disabled={!fed && !canFeed}
          className="w-full py-3 font-terminal text-sm font-bold uppercase tracking-widest border-2 transition-all disabled:opacity-30"
          style={{
            borderColor: fed ? C.green : C.border,
            background:  fed ? 'rgba(63,163,92,0.15)' : 'rgba(255,255,255,0.02)',
            color:       fed ? C.green : C.text,
          }}
        >
          {fed ? `✓ Fed  −$${FEED_COST}` : `Feed  $${FEED_COST}`}
        </button>

        {/* Medicine */}
        <AnimatePresence>
          {needsMed && (
            <motion.button
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              onClick={onToggleTreat}
              disabled={!treated && !canTreat}
              className="w-full py-3 font-terminal text-sm font-bold uppercase tracking-widest border-2 transition-all disabled:opacity-30"
              style={{
                originY:     0,
                borderColor: treated ? C.blue : C.red + '77',
                background:  treated ? 'rgba(106,171,240,0.12)' : 'rgba(180,71,63,0.07)',
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
