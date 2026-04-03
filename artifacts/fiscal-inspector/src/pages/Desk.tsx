import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine, DAILY_GOALS } from '@/hooks/useGameEngine';
import { Rulebook } from '@/components/workspace/Rulebook';
import { DraggablePaper } from '@/components/workspace/DraggablePaper';
import { Stamp } from '@/components/ui/Stamp';
import { formatMoney, cn } from '@/lib/utils';
import { DailyLog } from '@/types/game';
import { fieldGroup } from '@/components/forms/PaperForms';
import {
  Clock, ShieldAlert, DollarSign, CheckCircle2, XCircle,
  Snowflake, TrendingDown, FileText, AlertTriangle,
} from 'lucide-react';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:     '#120d0a',
  panel:  '#16110e',
  border: '#6f4b1f',
  accent: '#e0a11b',
  muted:  '#7a5520',
  green:  '#3fa35c',
  red:    '#b4473f',
  text:   '#f3dfb2',
  desk:   'linear-gradient(170deg, #251a12 0%, #1a110c 100%)',
};

// ─── Portrait palettes (all desaturated) ────────────────────────────────────
const SKINS  = ['#c9aa8a','#b59070','#9e7a58','#8a6445','#6b4a32','#d5c5a8','#a88a68','#7a5a3e'];
const HAIRS  = ['#1a1208','#2d200e','#4a3010','#1f1f20','#3d2c18','#8a7a62','#585040'];
const SHIRTS = ['hsl(210,14%,22%)','hsl(0,0%,18%)','hsl(25,18%,22%)','hsl(100,8%,20%)','hsl(220,10%,26%)','hsl(0,6%,22%)'];

function PortraitSVG({ seed, w, h }: { seed: number; w: number; h: number }) {
  const skin  = SKINS[(seed * 13) % SKINS.length];
  const hair  = HAIRS[(seed * 7)  % HAIRS.length];
  const shirt = SHIRTS[(seed * 11) % SHIRTS.length];
  const headRx = [13, 14, 16, 11][seed % 4];
  const headRy = [16, 14, 13, 17][seed % 4];
  const hairType  = (seed * 3) % 5;
  const accessory = (seed * 17) % 6;
  const hasGlasses = accessory === 3 || accessory === 4;
  const hasHat     = accessory === 5;
  const eyeHeavy   = (seed * 5) % 3 === 0;
  const mouthDown  = (seed * 3) % 3 > 0;
  const browStyle  = (seed * 23) % 3;
  const cx = 32, headCy = 38, eyeY = headCy - 1;
  const filterId = `vg${seed}`;
  return (
    <svg width={w} height={h} viewBox="0 0 64 80"
         style={{ filter: 'sepia(22%) contrast(0.88) saturate(0.72)', display: 'block' }}>
      <rect width="64" height="80" fill="#cec1a6" />
      <radialGradient id={filterId} cx="50%" cy="45%" r="65%">
        <stop offset="55%" stopColor="transparent" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
      </radialGradient>
      <rect width="64" height="80" fill={`url(#${filterId})`} />
      {hasHat && <>
        <rect x={cx-18} y={headCy-headRy-13} width="36" height="11" rx="2" fill={hair} />
        <rect x={cx-23} y={headCy-headRy-3}  width="46" height="4"  rx="1" fill={hair} />
      </>}
      {hairType === 0 && <ellipse cx={cx} cy={headCy-headRy+4} rx={headRx+1} ry={7} fill={hair} />}
      {hairType === 1 && <ellipse cx={cx} cy={headCy-headRy+2} rx={headRx+2} ry={10} fill={hair} />}
      {hairType === 2 && <ellipse cx={cx} cy={headCy-headRy+1} rx={headRx-2} ry={3} fill={hair} opacity="0.35" />}
      {hairType === 3 && <>
        <ellipse cx={cx-3} cy={headCy-headRy+3} rx={headRx+3} ry={7} fill={hair} />
        <path d={`M${cx+5} ${headCy-headRy+2} Q${cx+headRx+2} ${headCy-headRy+8} ${cx+headRx} ${headCy-headRy+16}`} stroke={hair} strokeWidth="4" fill="none" />
      </>}
      {hairType === 4 && <>
        <ellipse cx={cx} cy={headCy-headRy+5} rx={headRx+1} ry={8} fill={hair} />
        <path d={`M${cx-4} ${headCy-headRy+8} L${cx} ${headCy-headRy+14} L${cx+4} ${headCy-headRy+8}`} fill="#cec1a6" />
      </>}
      <ellipse cx={cx} cy={headCy} rx={headRx} ry={headRy} fill={skin} />
      <rect x={cx-5} y={headCy+headRy-2} width="10" height="10" fill={skin} />
      <path d={`M${cx-28} 80 L${cx-14} ${headCy+headRy+5} L${cx} ${headCy+headRy+9} L${cx+14} ${headCy+headRy+5} L${cx+28} 80 Z`} fill={shirt} />
      <path d={`M${cx-8} ${headCy+headRy+4} L${cx} ${headCy+headRy+13} L${cx+8} ${headCy+headRy+4}`} fill="#c4b79e" />
      {browStyle === 0 && <>
        <line x1={cx-11} y1={eyeY-7} x2={cx-4} y2={eyeY-7} stroke={hair} strokeWidth="1.5" strokeLinecap="round" />
        <line x1={cx+4}  y1={eyeY-7} x2={cx+11} y2={eyeY-7} stroke={hair} strokeWidth="1.5" strokeLinecap="round" />
      </>}
      {browStyle === 1 && <>
        <path d={`M${cx-11} ${eyeY-5} Q${cx-7} ${eyeY-9} ${cx-3} ${eyeY-8}`} stroke={hair} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d={`M${cx+3}  ${eyeY-8} Q${cx+7} ${eyeY-9} ${cx+11} ${eyeY-5}`} stroke={hair} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>}
      {browStyle === 2 && <>
        <line x1={cx-11} y1={eyeY-7} x2={cx-4} y2={eyeY-6} stroke={hair} strokeWidth="2.8" strokeLinecap="round" />
        <line x1={cx+4}  y1={eyeY-6} x2={cx+11} y2={eyeY-7} stroke={hair} strokeWidth="2.8" strokeLinecap="round" />
      </>}
      <ellipse cx={cx-7} cy={eyeY} rx="2.8" ry={eyeHeavy ? 1.7 : 2.2} fill="#1c1610" />
      <ellipse cx={cx+7} cy={eyeY} rx="2.8" ry={eyeHeavy ? 1.7 : 2.2} fill="#1c1610" />
      <circle cx={cx-6}  cy={eyeY-0.7} r="0.75" fill="rgba(255,255,255,0.32)" />
      <circle cx={cx+7.8} cy={eyeY-0.7} r="0.75" fill="rgba(255,255,255,0.32)" />
      {hasGlasses && <>
        <rect x={cx-16} y={eyeY-4} width="10" height="7" rx="2" fill="none" stroke="#1a1208" strokeWidth="1.3" />
        <rect x={cx+6}  y={eyeY-4} width="10" height="7" rx="2" fill="none" stroke="#1a1208" strokeWidth="1.3" />
        <line x1={cx-6}  y1={eyeY} x2={cx+6}  y2={eyeY} stroke="#1a1208" strokeWidth="1.3" />
        <line x1={cx-24} y1={eyeY} x2={cx-16} y2={eyeY} stroke="#1a1208" strokeWidth="1" />
        <line x1={cx+16} y1={eyeY} x2={cx+24} y2={eyeY} stroke="#1a1208" strokeWidth="1" />
      </>}
      <path d={`M${cx} ${eyeY+3} L${cx-2} ${eyeY+9} L${cx+2} ${eyeY+9}`} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeLinecap="round" />
      {mouthDown
        ? <path d={`M${cx-6} ${eyeY+15} Q${cx} ${eyeY+14} ${cx+6} ${eyeY+15}`} stroke="#5a3a28" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        : <line x1={cx-6} y1={eyeY+14} x2={cx+6} y2={eyeY+14} stroke="#5a3a28" strokeWidth="1.3" strokeLinecap="round" />
      }
    </svg>
  );
}

// ─── Tiny queue thumbnail for top bar ───────────────────────────────────────
function QueueThumb({ seed, isVIP, isActive, isDone }: {
  seed: number; isVIP?: boolean; isActive?: boolean; isDone?: boolean;
}) {
  if (isDone) return (
    <div className="w-6 h-7 border border-dashed rounded-sm opacity-20" style={{ borderColor: C.border }} />
  );
  return (
    <div className="relative shrink-0 rounded-sm overflow-hidden border"
         style={{
           width: 24, height: 30,
           borderColor: isActive ? C.accent : '#6f4b1f55',
           boxShadow: isActive ? `0 0 6px ${C.accent}55` : 'none',
           opacity: isDone ? 0.2 : 1,
         }}>
      <PortraitSVG seed={seed} w={24} h={30} />
      {isVIP && <span className="absolute top-0 right-0.5 text-yellow-300 leading-none" style={{ fontSize: 6 }}>★</span>}
    </div>
  );
}



// ─── Citation sound (standalone, no engine dependency) ───────────────────────
function playCitationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Layer 1: brutal low impact thud
    const thud = ctx.createOscillator();
    const thudG = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, now);
    thud.frequency.exponentialRampToValueAtTime(20, now + 0.3);
    thudG.gain.setValueAtTime(0.9, now);
    thudG.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    thud.connect(thudG); thudG.connect(ctx.destination);
    thud.start(now); thud.stop(now + 0.32);

    // Layer 2: harsh descending buzz
    const buzz = ctx.createOscillator();
    const buzzG = ctx.createGain();
    buzz.type = 'sawtooth';
    buzz.frequency.setValueAtTime(220, now + 0.02);
    buzz.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    buzzG.gain.setValueAtTime(0.0, now);
    buzzG.gain.linearRampToValueAtTime(0.55, now + 0.02);
    buzzG.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    buzz.connect(buzzG); buzzG.connect(ctx.destination);
    buzz.start(now); buzz.stop(now + 0.38);

    // Layer 3: high crack on impact
    const crack = ctx.createOscillator();
    const crackG = ctx.createGain();
    crack.type = 'triangle';
    crack.frequency.setValueAtTime(900, now);
    crack.frequency.exponentialRampToValueAtTime(200, now + 0.06);
    crackG.gain.setValueAtTime(0.4, now);
    crackG.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    crack.connect(crackG); crackG.connect(ctx.destination);
    crack.start(now); crack.stop(now + 0.08);
  } catch (_) { /* ignore */ }
}

// ─── Citation Modal ───────────────────────────────────────────────────────────
function CitationModal({ log, onContinue }: { log: DailyLog; onContinue: () => void }) {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    playCitationSound();
    const t = setTimeout(() => setFlash(false), 180);
    return () => clearTimeout(t);
  }, []);

  const wrongLabel =
    log.decision === 'APPROVE' ? 'INNOCENT FILING APPROVED' :
    log.decision === 'REJECT'  ? 'VALID FILING REJECTED'    :
                                 'WRONG CALL';

  const shortReason = log.citationReason
    ? log.citationReason.split('.')[0].replace(/^(The|This|An|A)\s/i, '').trim().toUpperCase()
    : 'PROCESSING ERROR';

  return (
    <>
      {/* Red screen flash */}
      {flash && (
        <div
          className="absolute inset-0 z-[300] pointer-events-none"
          style={{ background: 'rgba(180,71,63,0.55)' }}
        />
      )}

      {/* Shake + fade-in wrapper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[200] flex items-center justify-center"
        style={{ background: 'rgba(6,1,1,0.92)', backdropFilter: 'blur(2px)' }}
      >
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [0, -10, 10, -8, 8, -4, 4, 0] }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex flex-col items-center gap-0 w-[380px]"
        >
          {/* Title */}
          <div
            className="w-full text-center py-3 font-terminal text-xs font-bold uppercase tracking-[0.35em] border-t border-x"
            style={{ borderColor: C.red, background: 'rgba(180,71,63,0.22)', color: C.red }}
          >
            <ShieldAlert className="inline w-3.5 h-3.5 mb-0.5 mr-1.5" />
            Citation Issued
          </div>

          {/* Main panel */}
          <div
            className="w-full border-2 border-t-0 flex flex-col items-center gap-6 px-8 py-8"
            style={{ background: '#100202', borderColor: C.red }}
          >
            {/* Mistake label */}
            <div className="text-center">
              <div className="font-stamped text-2xl tracking-widest uppercase" style={{ color: '#e07070' }}>
                Wrong Decision
              </div>
              <div className="font-terminal text-sm mt-1 uppercase tracking-wider" style={{ color: '#c05050' }}>
                {wrongLabel}
              </div>
            </div>

            {/* Penalty — biggest element */}
            <div className="flex flex-col items-center gap-1">
              <div className="font-terminal text-[10px] uppercase tracking-widest" style={{ color: '#7a3030' }}>
                Penalty
              </div>
              <div
                className="font-stamped leading-none"
                style={{ fontSize: '5rem', color: C.red, textShadow: `0 0 24px ${C.red}88` }}
              >
                {formatMoney(log.earnings)}
              </div>
            </div>

            {/* Reason — short, no paragraph */}
            <div
              className="w-full text-center font-terminal text-xs uppercase tracking-wider px-4 py-2 border"
              style={{ borderColor: C.red + '33', color: '#b06060', background: 'rgba(180,71,63,0.06)' }}
            >
              {shortReason}
            </div>

            {/* Button */}
            <button
              onClick={onContinue}
              className="w-full py-3 font-terminal text-sm font-bold uppercase tracking-[0.3em] border transition-all"
              style={{ borderColor: C.red, color: C.text, background: 'rgba(180,71,63,0.16)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(180,71,63,0.32)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(180,71,63,0.16)')}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ─── Correct decision flash ───────────────────────────────────────────────────
function CorrectFlash({ log, onDone }: { log: DailyLog; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  const isFreeze = log.decision === 'FREEZE';
  const color = isFreeze ? '#6aabf0' : C.green;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[190] pointer-events-none"
    >
      <div className="font-stamped text-4xl uppercase tracking-[0.25em] px-10 py-5 border-4 shadow-2xl"
           style={{
             color,
             borderColor: color,
             background: 'rgba(0,0,0,0.75)',
             boxShadow: `0 0 40px ${color}55, 0 0 80px ${color}22`,
           }}>
        {log.decision === 'APPROVE' ? '✓ APPROVED' : log.decision === 'REJECT' ? '✓ REJECTED' : '✓ FROZEN'}
      </div>
      <div className="text-center mt-2 font-terminal text-sm" style={{ color }}>
        +{formatMoney(log.earnings)}
      </div>
    </motion.div>
  );
}

// ─── Fraud types that trigger escalation report ──────────────────────────────
const MAJOR_FRAUD_TYPES = new Set([
  'money_laundering', 'offshore_accounts', 'insider_trading',
  'capital_gains_misclass', 'shell_company_legal',
]);
const isMajorFraudLog = (log: DailyLog) =>
  log.wasCorrect && (log.decision === 'FREEZE' || (log.decision === 'REJECT' && MAJOR_FRAUD_TYPES.has(log.fraudType ?? '')));

const FRAUD_LABELS: Record<string, string> = {
  money_laundering:        'Money Laundering',
  offshore_accounts:       'Undeclared Offshore Assets',
  insider_trading:         'Insider Trading',
  capital_gains_misclass:  'Capital Gains Misclassification',
  shell_company_legal:     'Shell Company — Regulatory Violation',
  name_mismatch:           'Identity Falsification',
  ssn_mismatch:            'SSN Fraud',
  w2_mismatch:             'Income Misreporting',
  expense_mismatch:        'Fraudulent Deductions',
  math_error:              'Tax Calculation Fraud',
  tax_error:               'Incorrect Tax Filing',
};

const FREEZE_OUTCOMES: Record<string, string> = {
  money_laundering:       'Financial assets frozen. Criminal investigation launched. Case forwarded to Financial Crimes Unit.',
  offshore_accounts:      'Offshore holdings seized. International compliance violation registered. Assets pending repatriation.',
  insider_trading:        'Trading records impounded. Securities Enforcement Division notified. Account access suspended.',
  capital_gains_misclass: 'Portfolio records seized. Tax liability recalculated and back-taxes levied.',
  shell_company_legal:    'Corporate accounts frozen. Regulatory compliance audit initiated. Board subpoenaed.',
};
const REJECT_OUTCOMES: Record<string, string> = {
  money_laundering:       'Filing rejected. Evidence packet forwarded to Financial Intelligence Unit for further review.',
  offshore_accounts:      'Filing rejected. Undisclosed foreign accounts flagged for IRS international compliance review.',
  insider_trading:        'Filing rejected. Suspicious trading data forwarded to Securities Enforcement Division.',
  capital_gains_misclass: 'Filing rejected. Gain reclassification logged and sent to tax correction bureau.',
  shell_company_legal:    'Filing rejected. Shell company structure flagged for regulatory compliance audit.',
};
const DEFAULT_OUTCOME = 'Filing flagged. Case forwarded to the Ministry audit division for further investigation.';

// ─── Fraud Escalation Report ──────────────────────────────────────────────────
function FraudEscalationModal({ log, onContinue }: { log: DailyLog; onContinue: () => void }) {
  const fraudLabel   = FRAUD_LABELS[log.fraudType ?? '']   ?? 'Financial Irregularity';
  const isFreeze     = log.decision === 'FREEZE';
  const outcomeMap   = isFreeze ? FREEZE_OUTCOMES : REJECT_OUTCOMES;
  const outcome      = outcomeMap[log.fraudType ?? ''] ?? DEFAULT_OUTCOME;
  const caseNum      = `MF-${log.clientId.slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  const accentColor  = isFreeze ? '#6aabf0' : '#e0a11b';
  const accentBg     = isFreeze ? 'rgba(58,106,191,0.12)' : 'rgba(180,71,63,0.10)';
  const borderColor  = isFreeze ? '#3a6abf' : C.red;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(4,1,0,0.94)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 220, delay: 0.05 }}
        className="relative w-[520px] border-2 overflow-hidden"
        style={{ background: '#0c0705', borderColor }}
      >
        {/* Big rotated stamp watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div
            className="font-stamped text-7xl uppercase tracking-[0.2em] opacity-[0.06] rotate-[-18deg] whitespace-nowrap"
            style={{ color: accentColor }}
          >
            {isFreeze ? 'ASSETS FROZEN' : 'FRAUD CONFIRMED'}
          </div>
        </div>

        {/* Header bar */}
        <div className="relative px-6 py-4 border-b flex items-start justify-between gap-4"
             style={{ borderColor: borderColor + '55', background: accentBg }}>
          <div>
            <div className="font-terminal text-[9px] uppercase tracking-[0.25em] mb-1" style={{ color: accentColor, opacity: 0.7 }}>
              Ministry of Finance — Fraud Enforcement Division
            </div>
            <div className="font-stamped text-xl tracking-widest uppercase" style={{ color: accentColor }}>
              {isFreeze ? 'Assets Frozen' : 'Fraud Confirmed'}
            </div>
            <div className="font-terminal text-[9px] mt-1 opacity-50">Case No. {caseNum}</div>
          </div>
          {/* Stamp badge */}
          <div className="shrink-0 w-16 h-16 border-2 rounded-full flex flex-col items-center justify-center text-center"
               style={{ borderColor, background: accentBg }}>
            <div className="font-stamped text-[9px] leading-tight uppercase tracking-wide" style={{ color: accentColor }}>
              {isFreeze ? 'FROZEN' : 'FRAUD'}
            </div>
            <div className="font-stamped text-[8px] opacity-50 leading-tight" style={{ color: accentColor }}>
              CONFIRMED
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="relative px-6 py-5 flex flex-col gap-4">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="font-terminal text-[9px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Subject</div>
              <div className="font-terminal text-sm font-bold" style={{ color: C.text }}>
                {log.clientName}{log.isVIP && <span className="ml-1.5 text-yellow-300 text-[10px]">★ VIP</span>}
              </div>
            </div>
            <div>
              <div className="font-terminal text-[9px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Violation</div>
              <div className="font-terminal text-sm font-bold" style={{ color: accentColor }}>{fraudLabel}</div>
            </div>
          </div>

          <div>
            <div className="font-terminal text-[9px] uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Outcome</div>
            <p className="font-terminal text-xs leading-relaxed" style={{ color: '#d0bc96' }}>{outcome}</p>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-sm" style={{ borderColor: accentColor + '33', background: accentBg }}>
            <div>
              <div className="font-terminal text-[9px] uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>
                {isFreeze ? 'Enforcement Bonus' : 'Detection Reward'}
              </div>
              <div className="font-terminal text-2xl font-bold" style={{ color: C.green }}>
                {formatMoney(log.earnings)}
              </div>
            </div>
            <div className="font-terminal text-[10px] text-right" style={{ color: C.muted }}>
              <div>{isFreeze ? 'Correct FREEZE' : 'Correct REJECT'}</div>
              <div className="mt-0.5" style={{ color: accentColor }}>Major Fraud</div>
            </div>
          </div>
        </div>

        {/* Continue */}
        <div className="relative px-6 pb-6 border-t pt-4" style={{ borderColor: borderColor + '33' }}>
          <button
            onClick={onContinue}
            className="w-full py-3 font-terminal text-sm font-bold uppercase tracking-widest border transition-all"
            style={{ borderColor, color: C.text, background: accentBg }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            Confirmed — Continue Shift
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Right Panel ─────────────────────────────────────────────────────────────
function RightPanel({ state }: { state: ReturnType<typeof useGameEngine>['state'] }) {
  const dailyGoal   = DAILY_GOALS[state.day] ?? 300;
  const dailyEarned = state.dailyLogs.reduce((a, l) => a + l.earnings, 0);

  return (
    <div className="w-96 shrink-0 flex flex-col overflow-hidden border-l"
         style={{ background: C.panel, borderColor: C.border }}>

      {/* Section header */}
      <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: C.border + '44' }}>
        <div className="font-stamped text-xs tracking-widest uppercase" style={{ color: C.muted }}>
          Ministry Directives
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <Rulebook
          day={state.day}
          activeEvent={state.activeEvent}
          dailyGoal={dailyGoal}
          dailyEarned={dailyEarned}
        />
      </div>
    </div>
  );
}


// ─── Main Desk Page ──────────────────────────────────────────────────────────
export default function Desk({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, stampAction, processDecision, callNextClient, endDay, actOnMemo, dismissMemo } = engine;

  const [topZIndex, setTopZIndex]   = useState(10);
  const [docZIndices, setDocZIndices] = useState<Record<string, number>>({});
  const [highlightGroup, setHighlightGroup] = useState<{ group: string; value: string } | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<DailyLog | null>(null);
  const prevLogCount = useRef(0);

  const processedCount = 4 - state.clientsQueue.length - (state.currentClient ? 1 : 0);

  // Detect new decisions → trigger feedback
  useEffect(() => {
    if (state.dailyLogs.length > prevLogCount.current) {
      const last = state.dailyLogs[state.dailyLogs.length - 1];
      setDecisionFeedback(last);
      prevLogCount.current = state.dailyLogs.length;
    }
  }, [state.dailyLogs.length]);

  useEffect(() => {
    if (state.currentClient) {
      const z: Record<string, number> = {};
      state.currentClient.documents.forEach((d, i) => { z[d.id] = i + 1; });
      setDocZIndices(z);
      setTopZIndex(state.currentClient.documents.length + 1);
      setHighlightGroup(null);
    } else {
      setDocZIndices({});
      setHighlightGroup(null);
    }
  }, [state.currentClient?.id]);

  const bringToFront = (id: string) => {
    setTopZIndex(z => z + 1);
    setDocZIndices(prev => ({ ...prev, [id]: topZIndex }));
  };

  // Click a field → highlight matching values across all documents
  const handleFieldClick = useCallback((key: string, value: string) => {
    const suffix = key.split(':')[1];
    const group = fieldGroup(suffix);
    if (!group) return;
    setHighlightGroup(prev =>
      prev && prev.group === group && prev.value === value ? null : { group, value }
    );
  }, []);

  const isDeskDisabled = !!stampAction || !state.currentClient;
  const isContraband   = !!state.currentClient?.isContraband;
  const hasClient      = !!state.currentClient;
  const canCallNext    = state.clientsQueue.length > 0;
  const isDayEnd       = state.status === 'DAY_END';

  // Document initial positions — tight, so fields can be compared without dragging
  const DOC_POS = [
    { x: 24,  y: 60  },
    { x: 160, y: 44  },
    { x: 300, y: 72  },
    { x: 440, y: 56  },
  ];

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden relative"
      style={{ background: C.bg, color: C.text }}
    >

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 z-40 flex items-center justify-between px-5 h-12"
           style={{ background: '#0d0906', borderBottom: `1px solid ${C.border}` }}>

        {/* Left: title + queue strip + memo chip */}
        <div className="flex items-center gap-4">
          <span className="font-stamped text-base tracking-widest" style={{ color: C.accent }}>
            TAXES PLEASE
          </span>

          {/* Queue thumbnails */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: processedCount }).map((_, i) => (
              <QueueThumb key={`done-${i}`} seed={0} isDone />
            ))}
            {state.currentClient && (
              <QueueThumb seed={state.currentClient.avatarSeed} isVIP={state.currentClient.isVIP} isActive />
            )}
            {state.clientsQueue.map(c => (
              <QueueThumb key={c.id} seed={c.avatarSeed} isVIP={c.isVIP} />
            ))}
            {Array.from({ length: Math.max(0, 4 - processedCount - (hasClient ? 1 : 0) - state.clientsQueue.length) }).map((_, i) => (
              <div key={`slot-${i}`} className="w-6 h-7 border border-dashed rounded-sm opacity-10"
                   style={{ borderColor: C.border }} />
            ))}
          </div>

          {/* Event badge */}
          {state.activeEvent && (
            <div className="flex items-center gap-1.5 font-terminal text-[10px] px-2 py-0.5 rounded border"
                 style={{ color: '#e0901b', borderColor: '#e0901b44', background: 'rgba(224,144,27,0.07)' }}>
              <TrendingDown className="w-3 h-3" />
              {state.activeEvent.title}
            </div>
          )}

          {/* Inline memo chip — non-blocking, replaces the floating sticky note */}
          {state.activeMemo && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded border font-terminal text-[10px]"
                 style={{ borderColor: '#d97706aa', background: 'rgba(220,180,30,0.08)', color: '#fcd34d' }}>
              <FileText className="w-3 h-3 shrink-0" />
              <span className="max-w-[200px] truncate">{state.activeMemo.subject}</span>
              {!state.memoActed ? (
                <>
                  <button onClick={actOnMemo}
                    className="ml-1 px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                    style={{ borderColor: '#d97706', color: '#fcd34d', background: 'rgba(220,150,0,0.15)' }}>
                    Act
                  </button>
                  <button onClick={dismissMemo}
                    className="px-1 text-[10px] opacity-40 hover:opacity-70 transition-opacity">
                    ✕
                  </button>
                </>
              ) : (
                <span className="ml-1 text-green-400 text-[9px] font-bold">✓ Noted</span>
              )}
            </div>
          )}
        </div>

        {/* Right: stats */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-3 py-1 border rounded" style={{ borderColor: C.green + '44', background: 'rgba(63,163,92,0.07)' }}>
            <DollarSign className="w-4 h-4" style={{ color: C.green }} />
            <span className="font-terminal text-xl font-bold leading-none" style={{ color: C.green }}>
              {formatMoney(state.money)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-terminal text-xs" style={{ color: C.muted }}>
            <Clock className="w-3.5 h-3.5" />
            <span>DAY {state.day}/7</span>
          </div>
          <div className="flex items-center gap-1.5 font-terminal text-xs" style={{ color: state.citations > 0 ? C.red : C.muted }}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{state.citations}/5</span>
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── CENTER DESK (dominant) ─────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: C.desk }}>

          {/* Subtle grain / grid at very low opacity */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              linear-gradient(rgba(111,75,31,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(111,75,31,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }} />

          {/* Stamp animation (centered over desk) */}
          <Stamp type={stampAction} />

          {/* Highlight hint */}
          {highlightGroup && hasClient && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="font-terminal text-[11px] px-3 py-1.5 rounded-full uppercase tracking-wider border"
                   style={{ background: 'rgba(14,10,8,0.85)', borderColor: `${C.accent}55`, color: C.accent }}>
                Comparing <strong>{highlightGroup.group}</strong> — green = match · red = mismatch
              </div>
            </div>
          )}

          {/* Empty desk state */}
          {!hasClient && state.status === 'PLAYING' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="font-terminal text-[11px] uppercase tracking-[0.25em] opacity-15 border border-dashed p-8"
                   style={{ borderColor: C.border, color: C.muted }}>
                {canCallNext ? 'Next citizen waiting' : 'All cases processed'}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className={cn('absolute inset-0 transition-opacity duration-300', isDeskDisabled && 'opacity-40 pointer-events-none')}>
            {state.currentClient?.documents.map((doc, idx) => (
              <DraggablePaper
                key={state.currentClient!.id + doc.id}
                doc={doc}
                initialX={DOC_POS[idx]?.x ?? 40 + idx * 160}
                initialY={DOC_POS[idx]?.y ?? 60}
                zIndex={docZIndices[doc.id] || 1}
                onFocus={() => bringToFront(doc.id)}
                highlightGroup={highlightGroup}
                onFieldClick={handleFieldClick}
                isNew={idx === 0}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
        <RightPanel state={state} />
      </div>

      {/* ── BOTTOM ACTION BAR ────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-center gap-3 z-40 px-6 py-4"
           style={{ background: '#0d0906', borderTop: `1px solid ${C.border}` }}>

        {isDayEnd ? (
          <button
            onClick={endDay}
            className="flex items-center gap-3 px-12 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest cursor-pointer transition-all"
            style={{ background: C.panel, borderColor: C.accent, color: C.accent }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(224,161,27,0.12)'; }}
            onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
          >
            {state.day >= 7 ? 'Submit Final Report →' : 'End Shift →'}
          </button>
        ) : hasClient ? (
          <>
            {/* Approve */}
            <button
              onClick={() => processDecision('APPROVE', 0)}
              disabled={isDeskDisabled}
              className={cn(
                'flex items-center gap-3 px-10 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest transition-all',
                isDeskDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              )}
              style={{ background: C.panel, borderColor: C.green, color: C.green }}
              onMouseOver={e => { if (!isDeskDisabled) e.currentTarget.style.background = 'rgba(63,163,92,0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
            >
              <CheckCircle2 className="w-5 h-5" />
              Approve
            </button>

            {/* Reject */}
            <button
              onClick={() => processDecision('REJECT', 0)}
              disabled={isDeskDisabled}
              className={cn(
                'flex items-center gap-3 px-10 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest transition-all',
                isDeskDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              )}
              style={{ background: C.panel, borderColor: C.red, color: C.red }}
              onMouseOver={e => { if (!isDeskDisabled) e.currentTarget.style.background = 'rgba(180,71,63,0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>

            {/* Freeze */}
            <button
              onClick={() => processDecision('FREEZE', 0)}
              disabled={isDeskDisabled}
              className={cn(
                'flex items-center gap-3 px-10 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest transition-all',
                isContraband && !isDeskDisabled && 'animate-pulse',
                isDeskDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              )}
              style={{ background: C.panel, borderColor: '#3a6abf', color: '#7ab0f0' }}
              onMouseOver={e => { if (!isDeskDisabled) e.currentTarget.style.background = 'rgba(58,106,191,0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
            >
              <Snowflake className="w-5 h-5" />
              Freeze
              {isContraband && <AlertTriangle className="w-4 h-4 ml-1 text-yellow-400" />}
            </button>
          </>
        ) : (
          <button
            onClick={canCallNext ? callNextClient : undefined}
            disabled={!canCallNext}
            className={cn(
              'flex items-center gap-3 px-12 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest transition-all',
              canCallNext ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed',
            )}
            style={{ background: C.panel, borderColor: canCallNext ? C.accent : C.border, color: canCallNext ? C.accent : C.muted }}
            onMouseOver={e => { if (canCallNext) e.currentTarget.style.background = 'rgba(224,161,27,0.12)'; }}
            onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
          >
            {canCallNext ? '▶  Call Next Citizen' : 'Queue Empty — Shift Complete'}
          </button>
        )}
      </div>

      {/* ── Decision feedback overlays ───────────────────────────────────────── */}
      <AnimatePresence>
        {decisionFeedback && !decisionFeedback.wasCorrect && (
          <CitationModal
            key="citation"
            log={decisionFeedback}
            onContinue={() => setDecisionFeedback(null)}
          />
        )}
        {decisionFeedback && isMajorFraudLog(decisionFeedback) && (
          <FraudEscalationModal
            key="escalation"
            log={decisionFeedback}
            onContinue={() => setDecisionFeedback(null)}
          />
        )}
        {decisionFeedback && decisionFeedback.wasCorrect && !isMajorFraudLog(decisionFeedback) && (
          <CorrectFlash
            key="flash"
            log={decisionFeedback}
            onDone={() => setDecisionFeedback(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
