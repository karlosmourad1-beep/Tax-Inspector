import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine, DAILY_GOALS } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';
import { Rulebook } from '@/components/workspace/Rulebook';
import { DraggablePaper } from '@/components/workspace/DraggablePaper';
import { Stamp } from '@/components/ui/Stamp';
import { formatMoney, cn } from '@/lib/utils';
import { Client, DailyLog, LeakedMemo } from '@/types/game';
import {
  Clock, ShieldAlert, DollarSign, CheckCircle2, XCircle,
  Snowflake, AlertTriangle, TrendingDown, Eye, EyeOff,
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

// ─── Speech bubble (on desk surface) ────────────────────────────────────────
function DeskSpeech({ client }: { client: Client | null }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    if (!client) return;
    setLineIdx(0);
    setShowNote(false);
    if (client.smallTalk.length <= 1) return;
    const t = setInterval(() => setLineIdx(p => p + 1 < client.smallTalk.length ? p + 1 : p), 3500);
    return () => clearInterval(t);
  }, [client?.id]);

  if (!client) return null;

  const text = showNote && client.hiddenNote ? client.hiddenNote : (client.smallTalk[lineIdx] || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="absolute top-4 left-4 z-30 flex items-start gap-2 max-w-xs"
      style={{ pointerEvents: 'none' }}
    >
      {/* Tiny portrait chip */}
      <div className="shrink-0 rounded-sm overflow-hidden border mt-1" style={{ width: 26, height: 32, borderColor: C.border }}>
        <PortraitSVG seed={client.avatarSeed} w={26} h={32} />
      </div>

      {/* Bubble */}
      <div className="relative flex flex-col gap-1" style={{ pointerEvents: 'auto' }}>
        <div
          className="font-terminal text-[10px] leading-relaxed rounded px-3 py-2 border shadow-lg"
          style={{
            background: showNote && client.hiddenNote ? 'rgba(100,20,20,0.92)' : 'rgba(14,10,8,0.92)',
            borderColor: showNote && client.hiddenNote ? '#b4473f66' : C.border + '88',
            color: showNote && client.hiddenNote ? '#fca5a5' : C.text,
            maxWidth: 200,
          }}
        >
          <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>
            {client.name}{client.isVIP && <span className="ml-1 text-yellow-300">★</span>}
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={lineIdx + (showNote ? 'n' : '')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {showNote && client.hiddenNote && <span className="text-red-400 font-bold">[NOTE] </span>}
              {text}
            </motion.span>
          </AnimatePresence>
        </div>
        {client.hiddenNote && (
          <button
            onClick={() => setShowNote(s => !s)}
            className="flex items-center gap-1 font-terminal text-[9px] transition-colors px-1"
            style={{ color: showNote ? '#f87171' : C.muted }}
          >
            {showNote ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            {showNote ? 'hide note' : 'show note'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Physical Memo Paper ─────────────────────────────────────────────────────
function MemoPaper({ memo, acted, onAct, onDismiss }: {
  memo: LeakedMemo; acted: boolean; onAct: () => void; onDismiss: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const isDirective = memo.alignmentReward === 'corporate';
  const bg = isDirective ? '#f0ebe0' : '#fefce8';
  const borderClr = isDirective ? '#94a3b888' : '#d9770688';
  const hdrClr = isDirective ? '#374151' : '#92400e';

  return (
    <motion.div
      drag dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      initial={{ x: -360, y: 90, rotate: -5, opacity: 0 }}
      animate={{ x: 20, y: 90, rotate: isDragging ? -1 : -3, opacity: 1 }}
      exit={{ x: -360, rotate: -8, opacity: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 160, delay: 0.1 }}
      whileDrag={{ scale: 1.02, rotate: -1, boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
      style={{ zIndex: 200, background: bg, border: `1px solid ${borderClr}`, position: 'absolute' }}
      className="cursor-grab active:cursor-grabbing w-[270px] rounded-sm shadow-[4px_8px_28px_rgba(0,0,0,0.55)]"
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 rounded-sm opacity-70"
           style={{ background: '#fde68a', border: '1px solid #f59e0b' }} />
      <div className="p-4 flex flex-col gap-2">
        <div className="border-b pb-2 flex items-start justify-between gap-2"
             style={{ borderColor: hdrClr + '30', color: hdrClr }}>
          <div className="font-mono text-[9px]">
            <div className="text-[10px] font-bold">{memo.classification}</div>
            <div className="opacity-60 mt-0.5">FROM: {memo.from}</div>
            <div className="opacity-60">RE: {memo.subject}</div>
          </div>
          <button onClick={onDismiss} className="opacity-30 hover:opacity-70 transition-opacity text-sm"
                  style={{ color: hdrClr }}>✕</button>
        </div>
        <div className="flex flex-col gap-1.5">
          {memo.lines.map((line, i) => (
            <p key={i} className="font-mono text-[10px] leading-snug text-slate-700">{line}</p>
          ))}
        </div>
        <div className="flex gap-2 mt-1">
          {!acted ? (
            <>
              <button onClick={onAct}
                className="flex-1 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded border transition-all"
                style={{ background: isDirective ? '#e2e8f0' : '#fef3c7', border: `1px solid ${isDirective ? '#94a3b8' : '#d97706'}`, color: hdrClr }}>
                Act (+${memo.bonusIfActed})
              </button>
              <button onClick={onDismiss}
                className="flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded border border-slate-300 text-slate-500 hover:bg-slate-100 transition-all">
                Discard
              </button>
            </>
          ) : (
            <div className="flex-1 py-1.5 text-center text-[9px] font-mono font-bold text-green-700 uppercase tracking-wider border border-green-400/50 rounded bg-green-50">
              ✓ Intel Noted
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Citation Modal ───────────────────────────────────────────────────────────
function CitationModal({ log, onContinue }: { log: DailyLog; onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(8,3,2,0.90)', backdropFilter: 'blur(3px)' }}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        transition={{ type: 'spring', damping: 22, stiffness: 240 }}
        className="w-[440px] border-2 flex flex-col"
        style={{ background: '#140505', borderColor: C.red }}
      >
        {/* Title bar */}
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: C.red + '66', background: 'rgba(180,71,63,0.18)' }}>
          <ShieldAlert className="w-5 h-5 shrink-0" style={{ color: C.red }} />
          <div>
            <div className="font-stamped text-lg tracking-widest uppercase" style={{ color: C.red }}>
              Citation Issued
            </div>
            <div className="font-terminal text-[10px] mt-0.5" style={{ color: '#e0a0a0' }}>
              Ministry of Finance — Internal Affairs
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <div className="font-terminal text-[10px] uppercase tracking-widest mb-2" style={{ color: C.muted }}>
              Violation
            </div>
            <p className="font-terminal text-sm leading-relaxed" style={{ color: '#f3dfb2' }}>
              {log.citationReason ?? 'An error was made in processing this filing.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border rounded-sm" style={{ borderColor: C.red + '44', background: 'rgba(180,71,63,0.08)' }}>
              <div className="font-terminal text-[9px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>Penalty</div>
              <div className="font-terminal text-xl font-bold" style={{ color: C.red }}>{formatMoney(log.earnings)}</div>
            </div>
            <div className="p-3 border rounded-sm" style={{ borderColor: C.red + '44', background: 'rgba(180,71,63,0.08)' }}>
              <div className="font-terminal text-[9px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>Your Decision</div>
              <div className="font-terminal text-xl font-bold" style={{ color: C.red }}>{log.decision}</div>
            </div>
          </div>

          <div className="font-terminal text-[10px] leading-relaxed p-3 border rounded-sm" style={{ borderColor: '#6f4b1f44', color: '#c9aa7a', background: 'rgba(224,161,27,0.04)' }}>
            Compare documents carefully before deciding. Use the circle tool to flag suspicious fields.
          </div>
        </div>

        {/* Continue */}
        <div className="px-6 pb-6">
          <button
            onClick={onContinue}
            className="w-full py-3 font-terminal text-sm font-bold uppercase tracking-widest border transition-all"
            style={{ borderColor: C.red, color: C.text, background: 'rgba(180,71,63,0.14)' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(180,71,63,0.28)')}
            onMouseOut={e => (e.currentTarget.style.background = 'rgba(180,71,63,0.14)')}
          >
            Acknowledged — Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
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

// ─── Day-End Summary ─────────────────────────────────────────────────────────
function DayEndOverlay({ state, endDay }: {
  state: ReturnType<typeof useGameEngine>['state'];
  endDay: () => void;
}) {
  const dailyEarnings = state.dailyLogs.reduce((acc, l) => acc + l.earnings, 0);
  const humanCosts    = state.dailyLogs.filter(l => l.humanCost);

  return (
    <div className="absolute inset-0 z-50 bg-black/88 backdrop-blur-sm flex items-center justify-center p-6">
      <TerminalPanel title={`SHIFT END: DAY ${state.day}`} className="w-[520px] max-h-[88vh] border-amber-500 flex flex-col">
        <div className="flex flex-col gap-4 overflow-y-auto">
          <h2 className="text-lg text-center font-bold tracking-widest">DAILY PERFORMANCE REPORT</h2>

          <div className="border border-amber-600/30 p-2 text-xs max-h-44 overflow-y-auto">
            <div className="grid grid-cols-4 border-b border-amber-600/40 pb-1.5 mb-1.5 font-bold opacity-60 uppercase tracking-wider text-[9px]">
              <span>Citizen</span><span>Action</span><span>Result</span><span className="text-right">Pay</span>
            </div>
            {state.dailyLogs.map((log, i) => (
              <div key={i} className="grid grid-cols-4 py-0.5 border-b border-amber-600/10 last:border-0 text-xs">
                <span className="opacity-80 truncate">{log.clientName}</span>
                <span className={log.decision === 'APPROVE' ? 'text-green-400' : log.decision === 'FREEZE' ? 'text-blue-400' : 'text-red-400'}>{log.decision}</span>
                <span className={log.wasCorrect ? 'text-green-400' : 'text-red-400'}>{log.wasCorrect ? '✓ Correct' : '✗ Error'}</span>
                <span className="text-right">{formatMoney(log.earnings)}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 bg-amber-500/8 p-4 border border-amber-500/25">
            <div>
              <span className="block text-[10px] opacity-50 uppercase tracking-wider mb-1">Daily Earnings</span>
              <span className={cn("text-2xl font-bold", dailyEarnings >= 0 ? 'text-green-400' : 'text-red-400')}>
                {formatMoney(dailyEarnings)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] opacity-50 uppercase tracking-wider mb-1">Total Balance</span>
              <span className="text-2xl font-bold" style={{ color: C.accent }}>{formatMoney(state.money)}</span>
            </div>
          </div>

          {(() => {
            const c = state.dailyLogs.filter(l => l.alignmentShift === 'corporate').length;
            const w = state.dailyLogs.filter(l => l.alignmentShift === 'whistleblower').length;
            const s = state.dailyLogs.filter(l => l.alignmentShift === 'survivalist').length;
            if (c + w + s === 0) return null;
            return (
              <div className="border border-amber-600/25 p-3 text-xs">
                <div className="text-[9px] opacity-40 uppercase tracking-wider mb-2">Alignment Shifts</div>
                <div className="flex gap-5">
                  {c > 0 && <span style={{ color: C.accent }}>+{c} Corporate</span>}
                  {w > 0 && <span className="text-blue-400">+{w} Resistance</span>}
                  {s > 0 && <span className="text-green-400">+{s} Survivalist</span>}
                </div>
              </div>
            );
          })()}

          {humanCosts.length > 0 && (
            <div className="border border-amber-600/25 p-3 text-xs">
              <div className="text-[9px] opacity-40 uppercase tracking-wider mb-2">Human Cost</div>
              {humanCosts.map((log, i) => (
                <div key={i} className="border-l-2 pl-2 py-0.5 mb-1 leading-relaxed"
                     style={{ borderColor: log.humanCost?.isPositive ? '#22c55e55' : '#ef444455' }}>
                  <span className="opacity-40 mr-1">{log.clientName}:</span>
                  <span className={log.humanCost?.isPositive ? 'text-green-400/80' : 'text-red-400/80'}>
                    {log.humanCost?.impact}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button onClick={endDay}
            className="w-full py-3 font-bold text-sm uppercase tracking-widest transition-all"
            style={{ background: C.accent, color: '#120d0a' }}
            onMouseOver={e => (e.currentTarget.style.background = '#eab831')}
            onMouseOut={e => (e.currentTarget.style.background = C.accent)}
          >
            {state.day >= 7 ? 'Submit Final Report' : 'Start Next Shift →'}
          </button>
        </div>
      </TerminalPanel>
    </div>
  );
}

// ─── Main Desk Page ──────────────────────────────────────────────────────────
export default function Desk({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, stampAction, processDecision, callNextClient, endDay, actOnMemo, dismissMemo } = engine;

  const [topZIndex, setTopZIndex]     = useState(10);
  const [docZIndices, setDocZIndices] = useState<Record<string, number>>({});
  const [circledFields, setCircledFields] = useState<Set<string>>(new Set());
  const [crtFlicker, setCRTFlicker]   = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<DailyLog | null>(null);
  const prevLogCount = useRef(0);
  const prevMemoId = useRef<string | null>(null);

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
    const newId = state.activeMemo?.id || null;
    if (newId && newId !== prevMemoId.current) {
      setCRTFlicker(true);
      setTimeout(() => setCRTFlicker(false), 500);
    }
    prevMemoId.current = newId;
  }, [state.activeMemo?.id]);

  useEffect(() => {
    if (state.currentClient) {
      const z: Record<string, number> = {};
      state.currentClient.documents.forEach((d, i) => { z[d.id] = i + 1; });
      setDocZIndices(z);
      setTopZIndex(state.currentClient.documents.length + 1);
      setCircledFields(new Set());
    } else {
      setDocZIndices({});
    }
  }, [state.currentClient?.id]);

  const bringToFront = (id: string) => {
    setTopZIndex(z => z + 1);
    setDocZIndices(prev => ({ ...prev, [id]: topZIndex }));
  };

  const handleCircle = useCallback((key: string) => {
    setCircledFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const isDeskDisabled = !!stampAction || !state.currentClient;
  const isContraband   = !!state.currentClient?.isContraband;
  const hasClient      = !!state.currentClient;
  const canCallNext    = state.clientsQueue.length > 0;

  // Document initial positions — tight, so fields can be compared without dragging
  const DOC_POS = [
    { x: 24,  y: 60  },
    { x: 160, y: 44  },
    { x: 300, y: 72  },
    { x: 440, y: 56  },
  ];

  return (
    <div
      className={cn('h-screen w-full flex flex-col overflow-hidden transition-all relative', crtFlicker && 'brightness-[1.4]')}
      style={{ background: C.bg, color: C.text }}
    >

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 z-40 flex items-center justify-between px-5 h-12"
           style={{ background: '#0d0906', borderBottom: `1px solid ${C.border}` }}>

        {/* Left: title + queue strip */}
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
        </div>

        {/* Right: stats */}
        <div className="flex items-center gap-5">
          {/* MONEY — most prominent stat */}
          <div className="flex items-center gap-2 px-3 py-1 border rounded" style={{ borderColor: C.green + '44', background: 'rgba(63,163,92,0.07)' }}>
            <DollarSign className="w-4 h-4" style={{ color: C.green }} />
            <span className="font-terminal text-xl font-bold leading-none" style={{ color: C.green }}>
              {formatMoney(state.money)}
            </span>
          </div>

          {/* Day */}
          <div className="flex items-center gap-1.5 font-terminal text-xs" style={{ color: C.muted }}>
            <Clock className="w-3.5 h-3.5" />
            <span>DAY {state.day}/7</span>
          </div>

          {/* Citations */}
          <div className="flex items-center gap-1.5 font-terminal text-xs" style={{ color: state.citations > 0 ? C.red : C.muted }}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{state.citations}/5 cit.</span>
          </div>

          {/* Flagged fields count */}
          {circledFields.size > 0 && (
            <span className="font-terminal text-[10px]" style={{ color: C.red }}>
              ⊗ {circledFields.size} flagged
            </span>
          )}
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

          {/* Speech bubble — top-left of desk */}
          <AnimatePresence>
            {hasClient && <DeskSpeech key={state.currentClient?.id} client={state.currentClient} />}
          </AnimatePresence>

          {/* Flagged fields hint */}
          {circledFields.size > 0 && hasClient && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="font-terminal text-[10px] px-3 py-1 rounded-full uppercase tracking-wider border"
                   style={{ background: 'rgba(180,71,63,0.25)', borderColor: `${C.red}55`, color: '#fca5a5' }}>
                {circledFields.size} flagged — reject for +${circledFields.size * 25} bonus
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

          {/* Documents — tighter layout for easy comparison */}
          <div className={cn('absolute inset-0 transition-opacity duration-300', isDeskDisabled && 'opacity-40 pointer-events-none')}>
            {state.currentClient?.documents.map((doc, idx) => (
              <DraggablePaper
                key={state.currentClient!.id + doc.id}
                doc={doc}
                initialX={DOC_POS[idx]?.x ?? 40 + idx * 160}
                initialY={DOC_POS[idx]?.y ?? 60}
                zIndex={docZIndices[doc.id] || 1}
                onFocus={() => bringToFront(doc.id)}
                circledFields={circledFields}
                onCircle={handleCircle}
                isNew={idx === 0}
              />
            ))}
          </div>

          {/* Memo paper — slides in from left */}
          <AnimatePresence>
            {state.activeMemo && (
              <MemoPaper
                key={state.activeMemo.id}
                memo={state.activeMemo}
                acted={state.memoActed}
                onAct={actOnMemo}
                onDismiss={dismissMemo}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
        <RightPanel state={state} />
      </div>

      {/* ── BOTTOM ACTION BAR ────────────────────────────────────────────────── */}
      <div className="shrink-0 h-[68px] flex items-center justify-center gap-4 z-40 px-6"
           style={{ background: '#0d0906', borderTop: `1px solid ${C.border}` }}>

        {hasClient ? (
          <>
            {/* Approve */}
            <button
              onClick={() => processDecision('APPROVE', circledFields.size)}
              disabled={isDeskDisabled}
              className={cn(
                'flex items-center gap-2 px-8 h-11 border font-terminal text-sm font-bold uppercase tracking-widest transition-all',
                isDeskDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              )}
              style={{ background: C.panel, borderColor: C.green, color: C.text }}
              onMouseOver={e => { if (!isDeskDisabled) { e.currentTarget.style.background = 'rgba(63,163,92,0.12)'; e.currentTarget.style.color = C.green; } }}
              onMouseOut={e => { e.currentTarget.style.background = C.panel; e.currentTarget.style.color = C.text; }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>

            {/* Reject */}
            <button
              onClick={() => processDecision('REJECT', circledFields.size)}
              disabled={isDeskDisabled}
              className={cn(
                'flex items-center gap-2 px-8 h-11 border font-terminal text-sm font-bold uppercase tracking-widest transition-all',
                isDeskDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              )}
              style={{ background: C.panel, borderColor: C.red, color: C.text }}
              onMouseOver={e => { if (!isDeskDisabled) { e.currentTarget.style.background = 'rgba(180,71,63,0.12)'; e.currentTarget.style.color = C.red; } }}
              onMouseOut={e => { e.currentTarget.style.background = C.panel; e.currentTarget.style.color = C.text; }}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>

            {/* Freeze */}
            <button
              onClick={() => processDecision('FREEZE', circledFields.size)}
              disabled={isDeskDisabled}
              className={cn(
                'flex items-center gap-2 px-8 h-11 border font-terminal text-sm font-bold uppercase tracking-widest transition-all',
                isContraband && !isDeskDisabled && 'animate-pulse',
                isDeskDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              )}
              style={{ background: C.panel, borderColor: '#3a6abf', color: C.text }}
              onMouseOver={e => { if (!isDeskDisabled) { e.currentTarget.style.background = 'rgba(58,106,191,0.12)'; e.currentTarget.style.color = '#7ab0f0'; } }}
              onMouseOut={e => { e.currentTarget.style.background = C.panel; e.currentTarget.style.color = C.text; }}
            >
              <Snowflake className="w-4 h-4" />
              Freeze
              {isContraband && <span className="ml-1 text-blue-400 text-[10px]">!</span>}
            </button>

            {circledFields.size > 0 && (
              <div className="flex items-center gap-1.5 font-terminal text-[10px] ml-2" style={{ color: C.red }}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {circledFields.size} circled
              </div>
            )}
          </>
        ) : (
          <button
            onClick={canCallNext ? callNextClient : undefined}
            disabled={!canCallNext}
            className={cn(
              'flex items-center gap-2 px-10 h-11 border font-terminal text-sm font-bold uppercase tracking-widest transition-all',
              canCallNext ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed',
            )}
            style={{ background: C.panel, borderColor: canCallNext ? C.accent : C.border, color: canCallNext ? C.accent : C.muted }}
            onMouseOver={e => { if (canCallNext) e.currentTarget.style.background = 'rgba(224,161,27,0.10)'; }}
            onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
          >
            {canCallNext ? '▶  Call Next Citizen' : 'Queue Empty — Shift Complete'}
          </button>
        )}
      </div>

      {/* ── Day-end overlay ──────────────────────────────────────────────────── */}
      {state.status === 'DAY_END' && <DayEndOverlay state={state} endDay={endDay} />}

      {/* ── Decision feedback overlays ───────────────────────────────────────── */}
      <AnimatePresence>
        {decisionFeedback && !decisionFeedback.wasCorrect && (
          <CitationModal
            key="citation"
            log={decisionFeedback}
            onContinue={() => setDecisionFeedback(null)}
          />
        )}
        {decisionFeedback && decisionFeedback.wasCorrect && (
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
