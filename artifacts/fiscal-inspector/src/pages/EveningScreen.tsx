import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine, FEED_COST, MEDICINE_COST } from '@/hooks/useGameEngine';
import { formatMoney } from '@/lib/utils';
import { RENT_BY_DAY } from '@/lib/eveningEvents';
import { FamilyMember, FamilyMemberStatus } from '@/types/game';
import markArt from '@assets/image_1775621787627.png';
import lilyArt from '@assets/image_1775621970319.png';
import elenaArt from '@assets/image_1775622093518.png';

const C = {
  bg:     '#0e0a07',
  panel:  '#16110e',
  border: '#6f4b1f',
  accent: '#e0a11b',
  green:  '#3fa35c',
  red:    '#b4473f',
  blue:   '#6aabf0',
  text:   '#f3dfb2',
  muted:  '#7a5520',
};

const STATUS_LABEL: Record<FamilyMemberStatus, string> = {
  OK:       'Healthy',
  HUNGRY:   'Hungry',
  WEAK:     'Starving',
  SICK:     'Sick',
  CRITICAL: 'Critical',
  DEAD:     'Dead',
};

const STATUS_COLOR: Record<FamilyMemberStatus, string> = {
  OK:       C.green,
  HUNGRY:   '#d4a017',
  WEAK:     '#c17f24',
  SICK:     C.red,
  CRITICAL: '#cc2200',
  DEAD:     '#666666',
};

const ROLE_EMOJI: Record<string, string> = {
  wife:     '👩',
  son:      '👦',
  daughter: '👧',
  dog:      '🐕',
};

export default function EveningScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, confirmEvening } = engine;

  const [fedIds,     setFedIds]     = useState<Set<string>>(new Set());
  const [treatedIds, setTreatedIds] = useState<Set<string>>(new Set());
  const [confirmed,  setConfirmed]  = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [costFlash, setCostFlash]   = useState<{ id: string; amount: number; type: 'feed' | 'med' } | null>(null);

  const aliveMembers = state.family.filter(m => m.status !== 'DEAD');
  const rent      = RENT_BY_DAY[state.day] ?? 60;
  const feedCost  = fedIds.size * FEED_COST;
  const treatCost = treatedIds.size * MEDICINE_COST;
  const totalSpent = rent + feedCost + treatCost;
  const remaining = state.money - totalSpent;
  const isLastDay = state.day >= 7;

  const fedCount = fedIds.size;
  const savedForTomorrow = Math.max(0, remaining);

  useEffect(() => {
    const timer = setTimeout(() => setCanContinue(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  function toggleFeed(id: string) {
    setFedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCostFlash(null);
      } else {
        next.add(id);
        setCostFlash({ id, amount: FEED_COST, type: 'feed' });
        setTimeout(() => setCostFlash(null), 800);
      }
      return next;
    });
  }

  function toggleTreat(id: string) {
    setTreatedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCostFlash(null);
      } else {
        next.add(id);
        setCostFlash({ id, amount: MEDICINE_COST, type: 'med' });
        setTimeout(() => setCostFlash(null), 800);
      }
      return next;
    });
  }

  function handleConfirm() {
    if (confirmed || !canContinue) return;
    setConfirmed(true);
    setTimeout(() => {
      confirmEvening({ fedIds: [...fedIds], treatedIds: [...treatedIds] });
    }, 280);
  }

  return (
    <div
      className="h-screen w-full flex flex-col items-center justify-center overflow-hidden relative"
      style={{ background: C.bg, color: C.text }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(224,161,27,0.04) 0%, transparent 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex flex-col w-[94vw] max-w-6xl gap-4"
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="font-terminal text-[10px] uppercase tracking-[0.4em]" style={{ color: C.muted }}>
              Day {state.day} — Evening
            </div>
            <div className="font-terminal text-xs uppercase tracking-widest mt-0.5" style={{ color: C.accent }}>
              Feed Your Family
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1.15fr_1fr] gap-4 items-start">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

          <div className="border px-5 py-4 sticky top-4" style={{ borderColor: C.border + '55', background: 'rgba(22,17,14,0.8)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-terminal text-xs uppercase tracking-[0.3em]" style={{ color: C.muted }}>
                Today's Earnings
              </span>
              <span className="font-stamped text-3xl" style={{ color: C.text }}>
                {formatMoney(state.money)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: C.border + '33' }}>
              <div className="flex items-center justify-between font-terminal text-xs" style={{ color: '#e07070' }}>
                <span className="uppercase tracking-wider">Rent / Heat</span>
                <span>−{formatMoney(rent)}</span>
              </div>
              {feedCost > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between font-terminal text-xs" style={{ color: '#d4a017' }}
                >
                  <span className="uppercase tracking-wider">Food ({fedIds.size}×)</span>
                  <span>−{formatMoney(feedCost)}</span>
                </motion.div>
              )}
              {treatCost > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between font-terminal text-xs" style={{ color: C.blue }}
                >
                  <span className="uppercase tracking-wider">Medicine ({treatedIds.size}×)</span>
                  <span>−{formatMoney(treatCost)}</span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: C.border + '33' }}>
              <span className="font-terminal text-sm uppercase tracking-[0.25em] font-bold" style={{ color: C.muted }}>
                Remaining
              </span>
              <motion.span
                key={remaining}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.15 }}
                className="font-stamped text-4xl"
                style={{
                  color: remaining < 0 ? C.red : C.accent,
                  textShadow: remaining >= 0 ? '0 0 12px rgba(224,161,27,0.35)' : '0 0 12px rgba(180,71,63,0.35)',
                }}
              >
                {formatMoney(remaining)}
              </motion.span>
            </div>

            <AnimatePresence>
              {costFlash && (
                <motion.div
                  key={costFlash.id + costFlash.type}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -20 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-right font-stamped text-xl"
                  style={{ color: C.red }}
                >
                  −${costFlash.amount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center justify-between border px-5 py-3" style={{ borderColor: C.border + '55', background: 'rgba(22,17,14,0.8)' }}>
          <div className="font-terminal text-xs uppercase tracking-widest" style={{ color: C.muted }}>
            {fedCount} fed • {aliveMembers.length} alive • {formatMoney(savedForTomorrow)} saved for tomorrow
          </div>
          <div className="font-terminal text-xs uppercase tracking-wider" style={{ color: C.muted }}>
            {isLastDay ? 'Final evening' : 'Review before continuing'}
          </div>
        </div>

        <motion.button
          onClick={handleConfirm}
          disabled={!canContinue || confirmed}
          whileTap={canContinue && !confirmed ? { scale: 0.98 } : undefined}
          className="w-full py-4 font-terminal text-sm font-bold uppercase tracking-widest border transition-all disabled:opacity-40"
          style={{
            background: canContinue ? 'rgba(224,161,27,0.08)' : 'rgba(30,20,10,0.5)',
            borderColor: canContinue ? C.accent : C.border,
            color: canContinue ? C.accent : C.muted,
          }}
          onMouseOver={e => { if (canContinue && !confirmed) e.currentTarget.style.background = 'rgba(224,161,27,0.16)'; }}
          onMouseOut={e => { e.currentTarget.style.background = canContinue ? 'rgba(224,161,27,0.08)' : 'rgba(30,20,10,0.5)'; }}
        >
          {!canContinue
            ? 'Review your choices...'
            : confirmed
              ? '...'
              : isLastDay ? 'Submit Final Report →' : 'Continue →'}
        </motion.button>
      </motion.div>
    </div>
  );
}

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
  const isDead     = member.status === 'DEAD';
  const needsMed   = member.status === 'SICK' || member.status === 'CRITICAL';
  const isCritical = member.status === 'CRITICAL';
  const isWeak     = member.status === 'WEAK' || member.status === 'SICK' || isCritical;
  const isMark = member.name.toLowerCase() === 'mark' || member.role === 'son';
  const isLily = member.name.toLowerCase() === 'lily' || member.role === 'daughter';
  const isElena = member.name.toLowerCase() === 'elena' || member.role === 'wife';

  return (
    <motion.div
      className="flex flex-col border relative overflow-hidden"
      animate={
        isCritical && !treated
          ? { borderColor: ['#cc2200', '#ff4422', '#cc2200'] }
          : { borderColor: isDead ? '#44444466' : STATUS_COLOR[member.status] + '44' }
      }
      transition={{ duration: 1.1, repeat: isCritical ? Infinity : 0 }}
      style={{
        background: isDead ? 'rgba(30,30,30,0.4)' : 'rgba(22,17,14,0.8)',
        filter: isDead ? 'grayscale(1)' : isWeak && !fed ? 'grayscale(0.4)' : 'none',
      }}
    >
      <div className={`flex flex-col items-center pt-3 pb-2 gap-2 ${isMark || isLily ? 'px-2' : 'px-3'}`}>
        <div
          className={isMark || isLily || isElena ? 'w-full max-w-[160px] aspect-[4/5] flex items-center justify-center' : 'text-3xl leading-none'}
          style={{ opacity: isDead ? 0.3 : 1 }}
        >
          {isMark ? (
            <img src={markArt} alt="Mark" className="w-full h-full object-contain select-none pointer-events-none" draggable={false} />
          ) : isLily ? (
            <img src={lilyArt} alt="Lily" className="w-full h-full object-contain select-none pointer-events-none" draggable={false} />
          ) : isElena ? (
            <img src={elenaArt} alt="Elena" className="w-full h-full object-contain select-none pointer-events-none" draggable={false} />
          ) : (
            ROLE_EMOJI[member.role]
          )}
        </div>
        <span className="font-terminal text-sm font-bold uppercase tracking-wider" style={{ color: isDead ? '#666' : C.text }}>
          {member.name}
        </span>
        <span
          className="font-terminal text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5"
          style={{
            color: STATUS_COLOR[member.status],
            background: STATUS_COLOR[member.status] + '18',
            border: `1px solid ${STATUS_COLOR[member.status]}33`,
          }}
        >
          {STATUS_LABEL[member.status]}
        </span>
      </div>

      {isDead ? (
        <div className="px-3 pb-4 pt-1 text-center">
          <span className="font-terminal text-[10px] uppercase tracking-wider" style={{ color: '#666' }}>
            Gone
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-3 pb-4 pt-1">
          <button
            onClick={onToggleFeed}
            disabled={!fed && !canFeed}
            className="w-full py-2.5 font-terminal text-xs font-bold uppercase tracking-widest border transition-all disabled:opacity-25 relative overflow-hidden"
            style={{
              borderColor: fed ? C.green : C.border,
              background:  fed ? 'rgba(63,163,92,0.15)' : 'rgba(255,255,255,0.02)',
              color:       fed ? C.green : C.text,
            }}
          >
            {fed ? '🍽 Fed' : `Feed $${FEED_COST}`}
          </button>

          <AnimatePresence>
            {needsMed && (
              <motion.button
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onClick={onToggleTreat}
                disabled={!treated && !canTreat}
                className="w-full py-2.5 font-terminal text-xs font-bold uppercase tracking-widest border transition-all disabled:opacity-25"
                style={{
                  borderColor: treated ? C.blue : C.red + '77',
                  background:  treated ? 'rgba(106,171,240,0.12)' : 'rgba(180,71,63,0.07)',
                  color:       treated ? C.blue : '#e07070',
                }}
              >
                {treated ? '💊 Treated' : `Med $${MEDICINE_COST}`}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
