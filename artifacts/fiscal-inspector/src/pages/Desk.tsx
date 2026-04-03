import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';
import { Rulebook } from '@/components/workspace/Rulebook';
import { DraggablePaper } from '@/components/workspace/DraggablePaper';
import { Stamp } from '@/components/ui/Stamp';
import { formatMoney, cn } from '@/lib/utils';
import { Client, LeakedMemo } from '@/types/game';
import {
  Clock, ShieldAlert, DollarSign, CheckCircle2, XCircle, Users,
  Snowflake, AlertTriangle, Eye, EyeOff, TrendingDown,
} from 'lucide-react';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:     '#120d0a',
  panel:  '#1b1410',
  border: '#6f4b1f',
  accent: '#e0a11b',
  muted:  '#9c6b12',
  green:  '#3fa35c',
  red:    '#b4473f',
  text:   '#f3dfb2',
  desk:   'linear-gradient(160deg, #2a1d16 0%, #1e1510 100%)',
};

// ─── ID Portrait palettes (all desaturated / bureaucratic) ──────────────────
const SKINS  = ['#c9aa8a','#b59070','#9e7a58','#8a6445','#6b4a32','#d5c5a8','#a88a68','#7a5a3e'];
const HAIRS  = ['#1a1208','#2d200e','#4a3010','#1f1f20','#3d2c18','#8a7a62','#585040'];
const SHIRTS = ['hsl(210,14%,22%)','hsl(0,0%,18%)','hsl(25,18%,22%)','hsl(100,8%,20%)','hsl(220,10%,26%)','hsl(0,6%,22%)'];

// Shared portrait SVG — used at multiple sizes via w/h props
function PortraitSVG({ seed, w, h }: { seed: number; w: number; h: number }) {
  const skin  = SKINS[(seed * 13) % SKINS.length];
  const hair  = HAIRS[(seed * 7)  % HAIRS.length];
  const shirt = SHIRTS[(seed * 11) % SHIRTS.length];

  const headRxArr = [13, 14, 16, 11];
  const headRyArr = [16, 14, 13, 17];
  const headRx = headRxArr[seed % 4];
  const headRy = headRyArr[seed % 4];
  const hairType  = (seed * 3) % 5;   // 0=short 1=medium 2=bald 3=swept 4=widow's peak
  const accessory = (seed * 17) % 6;  // 0-2=none  3-4=glasses  5=hat
  const hasGlasses = accessory === 3 || accessory === 4;
  const hasHat     = accessory === 5;
  const eyeHeavy   = (seed * 5) % 3 === 0;
  const mouthDown  = (seed * 3) % 3 > 0;
  const browStyle  = (seed * 23) % 3;  // 0=flat 1=arched 2=thick

  const cx = 32, headCy = 38;
  const eyeY = headCy - 1;
  const filterId = `vg${seed}`;

  return (
    <svg width={w} height={h} viewBox="0 0 64 80"
         style={{ filter: 'sepia(22%) contrast(0.88) saturate(0.72)', display: 'block' }}>
      {/* Photo paper background */}
      <rect width="64" height="80" fill="#cec1a6" />
      {/* Vignette */}
      <radialGradient id={filterId} cx="50%" cy="45%" r="65%">
        <stop offset="55%" stopColor="transparent" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
      </radialGradient>
      <rect width="64" height="80" fill={`url(#${filterId})`} />

      {/* Hat (drawn first, behind head) */}
      {hasHat && <>
        <rect x={cx - 18} y={headCy - headRy - 13} width="36" height="11" rx="2" fill={hair} />
        <rect x={cx - 23} y={headCy - headRy - 3}  width="46" height="4"  rx="1" fill={hair} />
      </>}

      {/* Hair */}
      {hairType === 0 && <ellipse cx={cx} cy={headCy - headRy + 4} rx={headRx + 1} ry={7} fill={hair} />}
      {hairType === 1 && <ellipse cx={cx} cy={headCy - headRy + 2} rx={headRx + 2} ry={10} fill={hair} />}
      {hairType === 2 && <ellipse cx={cx} cy={headCy - headRy + 1} rx={headRx - 2} ry={3} fill={hair} opacity="0.35" />}
      {hairType === 3 && <>
        <ellipse cx={cx - 3} cy={headCy - headRy + 3} rx={headRx + 3} ry={7} fill={hair} />
        <path d={`M${cx + 5} ${headCy - headRy + 2} Q${cx + headRx + 2} ${headCy - headRy + 8} ${cx + headRx} ${headCy - headRy + 16}`} stroke={hair} strokeWidth="4" fill="none" />
      </>}
      {hairType === 4 && <>
        <ellipse cx={cx} cy={headCy - headRy + 5} rx={headRx + 1} ry={8} fill={hair} />
        <path d={`M${cx - 4} ${headCy - headRy + 8} L${cx} ${headCy - headRy + 14} L${cx + 4} ${headCy - headRy + 8}`} fill="#cec1a6" />
      </>}

      {/* Head */}
      <ellipse cx={cx} cy={headCy} rx={headRx} ry={headRy} fill={skin} />

      {/* Neck */}
      <rect x={cx - 5} y={headCy + headRy - 2} width="10" height="10" fill={skin} />

      {/* Shirt / shoulders */}
      <path d={`M${cx - 28} 80 L${cx - 14} ${headCy + headRy + 5} L${cx} ${headCy + headRy + 9} L${cx + 14} ${headCy + headRy + 5} L${cx + 28} 80 Z`} fill={shirt} />
      {/* Collar */}
      <path d={`M${cx - 8} ${headCy + headRy + 4} L${cx} ${headCy + headRy + 13} L${cx + 8} ${headCy + headRy + 4}`} fill="#c4b79e" />

      {/* Eyebrows */}
      {browStyle === 0 && <>
        <line x1={cx - 11} y1={eyeY - 7} x2={cx - 4} y2={eyeY - 7} stroke={hair} strokeWidth="1.5" strokeLinecap="round" />
        <line x1={cx + 4}  y1={eyeY - 7} x2={cx + 11} y2={eyeY - 7} stroke={hair} strokeWidth="1.5" strokeLinecap="round" />
      </>}
      {browStyle === 1 && <>
        <path d={`M${cx - 11} ${eyeY - 5} Q${cx - 7} ${eyeY - 9} ${cx - 3} ${eyeY - 8}`} stroke={hair} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d={`M${cx + 3}  ${eyeY - 8} Q${cx + 7} ${eyeY - 9} ${cx + 11} ${eyeY - 5}`} stroke={hair} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>}
      {browStyle === 2 && <>
        <line x1={cx - 11} y1={eyeY - 7} x2={cx - 4} y2={eyeY - 6} stroke={hair} strokeWidth="2.8" strokeLinecap="round" />
        <line x1={cx + 4}  y1={eyeY - 6} x2={cx + 11} y2={eyeY - 7} stroke={hair} strokeWidth="2.8" strokeLinecap="round" />
      </>}

      {/* Eyes */}
      <ellipse cx={cx - 7} cy={eyeY} rx="2.8" ry={eyeHeavy ? 1.7 : 2.2} fill="#1c1610" />
      <ellipse cx={cx + 7} cy={eyeY} rx="2.8" ry={eyeHeavy ? 1.7 : 2.2} fill="#1c1610" />
      <circle cx={cx - 6}  cy={eyeY - 0.7} r="0.75" fill="rgba(255,255,255,0.32)" />
      <circle cx={cx + 7.8} cy={eyeY - 0.7} r="0.75" fill="rgba(255,255,255,0.32)" />

      {/* Glasses */}
      {hasGlasses && <>
        <rect x={cx - 16} y={eyeY - 4} width="10" height="7" rx="2" fill="none" stroke="#1a1208" strokeWidth="1.3" />
        <rect x={cx + 6}  y={eyeY - 4} width="10" height="7" rx="2" fill="none" stroke="#1a1208" strokeWidth="1.3" />
        <line x1={cx - 6}  y1={eyeY} x2={cx + 6}  y2={eyeY} stroke="#1a1208" strokeWidth="1.3" />
        <line x1={cx - 24} y1={eyeY} x2={cx - 16} y2={eyeY} stroke="#1a1208" strokeWidth="1" />
        <line x1={cx + 16} y1={eyeY} x2={cx + 24} y2={eyeY} stroke="#1a1208" strokeWidth="1" />
      </>}

      {/* Nose */}
      <path d={`M${cx} ${eyeY + 3} L${cx - 2} ${eyeY + 9} L${cx + 2} ${eyeY + 9}`}
            fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeLinecap="round" />

      {/* Mouth — neutral flat or slight downturn */}
      {mouthDown
        ? <path d={`M${cx - 6} ${eyeY + 15} Q${cx} ${eyeY + 14} ${cx + 6} ${eyeY + 15}`}
                stroke="#5a3a28" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        : <line x1={cx - 6} y1={eyeY + 14} x2={cx + 6} y2={eyeY + 14}
                stroke="#5a3a28" strokeWidth="1.3" strokeLinecap="round" />
      }
    </svg>
  );
}

// ─── Large ID card — used for the active citizen in the left panel ───────────
function IDCard({ seed, name, isVIP, orgName }: { seed: number; name: string; isVIP?: boolean; orgName?: string }) {
  return (
    <div className="relative border rounded-sm overflow-hidden shadow-lg shrink-0"
         style={{ width: 72, background: '#c8bba0', borderColor: '#8a7a62' }}>
      <PortraitSVG seed={seed} w={72} h={90} />
      {/* Card footer with name strip */}
      <div className="px-1.5 py-1 border-t" style={{ background: '#1b1410', borderColor: '#8a7a62' }}>
        <div className="font-terminal text-[8px] truncate leading-tight" style={{ color: '#e0a11b' }}>
          {isVIP && <span className="text-yellow-300 mr-1">★</span>}
          {name.split(' ')[0].toUpperCase()}
        </div>
        {orgName && (
          <div className="font-terminal text-[7px] truncate leading-tight" style={{ color: '#9c6b12' }}>
            {orgName}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Queue thumbnail — tiny mugshot used in the queue strip ─────────────────
function QueueThumb({ seed, isVIP, isActive }: { seed: number; isVIP?: boolean; isActive?: boolean }) {
  return (
    <div className="relative shrink-0 rounded-sm overflow-hidden border"
         style={{
           width: 26, height: 32,
           borderColor: isActive ? '#e0a11b' : '#6f4b1f55',
           boxShadow: isActive ? '0 0 6px rgba(224,161,27,0.4)' : 'none',
         }}>
      <PortraitSVG seed={seed} w={26} h={32} />
      {isVIP && (
        <span className="absolute top-0 right-0.5 text-yellow-300 leading-none" style={{ fontSize: 7 }}>★</span>
      )}
    </div>
  );
}

// ─── Left Panel: Queue + Citizen ─────────────────────────────────────────────
function LeftPanel({ client, queue, processedCount, onCallNext, canCallNext }: {
  client: Client | null;
  queue: Client[];
  processedCount: number;
  onCallNext: () => void;
  canCallNext: boolean;
}) {
  const [lineIdx, setLineIdx] = useState(0);
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    if (!client) return;
    setLineIdx(0);
    setShowNote(false);
    if (client.smallTalk.length <= 1) return;
    const t = setInterval(() => setLineIdx(p => p + 1 < client.smallTalk.length ? p + 1 : p), 3200);
    return () => clearInterval(t);
  }, [client?.id]);

  const currentText = showNote && client?.hiddenNote ? client.hiddenNote : (client?.smallTalk[lineIdx] || '');

  return (
    <div className="w-56 shrink-0 flex flex-col overflow-hidden border-r" style={{ background: C.panel, borderColor: C.border }}>

      {/* Queue row */}
      <div className="p-3 border-b shrink-0" style={{ borderColor: C.border + '88' }}>
        <div className="text-[9px] uppercase tracking-widest mb-2 font-terminal" style={{ color: C.muted }}>
          <Users className="w-2.5 h-2.5 inline mr-1" />
          Queue
        </div>
        <div className="flex gap-2 items-end flex-wrap">
          {/* Processed slots */}
          {Array.from({ length: processedCount }).map((_, i) => (
            <div key={`done-${i}`} className="w-7 h-10 rounded-sm border border-dashed opacity-20" style={{ borderColor: C.border }} />
          ))}
          {/* Active client */}
          {client && (
            <QueueThumb seed={client.avatarSeed} isVIP={client.isVIP} isActive />
          )}
          {/* Waiting */}
          {queue.map(c => (
            <QueueThumb key={c.id} seed={c.avatarSeed} isVIP={c.isVIP} />
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 4 - processedCount - (client ? 1 : 0) - queue.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-7 h-10 rounded-sm border border-dashed opacity-10" style={{ borderColor: C.border }} />
          ))}
        </div>
      </div>

      {/* Citizen area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {client ? (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: 'spring', damping: 20 }}
              className="flex flex-col gap-3 p-4 flex-1"
            >
              {/* ID Card portrait + name */}
              <div className="flex gap-3 items-start">
                <IDCard
                  seed={client.avatarSeed}
                  name={client.name}
                  isVIP={client.isVIP}
                  orgName={client.vipData?.organization}
                />
                <div className="min-w-0 pt-1">
                  <div className="font-terminal text-[11px] font-bold leading-tight" style={{ color: C.text }}>
                    {client.name}
                    {client.isVIP && <span className="ml-1 text-yellow-300 text-[9px]">VIP</span>}
                  </div>
                  {client.isVIP && client.vipData && (
                    <div className="font-terminal text-[9px] mt-0.5 leading-tight" style={{ color: C.muted }}>
                      {client.vipData.title}
                    </div>
                  )}
                  <div className="font-terminal text-[9px] mt-1 uppercase tracking-widest" style={{ color: '#6f4b1f' }}>
                    Citizen
                  </div>
                  {client.hiddenNote && (
                    <button
                      onClick={() => setShowNote(s => !s)}
                      className="mt-2 flex items-center gap-1 font-terminal text-[9px] transition-colors"
                      style={{ color: showNote ? '#f87171' : '#6f4b1f' }}
                    >
                      {showNote ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                      {showNote ? 'hide note' : 'show note'}
                    </button>
                  )}
                </div>
              </div>

              {/* Dialogue bubble */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={client.id + lineIdx + (showNote ? 'n' : '')}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="rounded p-3 text-[11px] font-terminal leading-relaxed border"
                  style={{
                    background: showNote && client.hiddenNote ? 'rgba(127,29,29,0.3)' : 'rgba(0,0,0,0.3)',
                    borderColor: showNote && client.hiddenNote ? '#b4473f66' : C.border + '55',
                    color: showNote && client.hiddenNote ? '#fca5a5' : C.text,
                  }}
                >
                  {showNote && client.hiddenNote && (
                    <span className="text-red-400 font-bold">[NOTE] </span>
                  )}
                  {currentText}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 p-4"
            >
              <div className="w-16 h-20 border-2 border-dashed rounded-t-full flex items-end justify-center pb-2 opacity-20" style={{ borderColor: C.border }}>
                <span className="text-3xl" style={{ color: C.muted }}>?</span>
              </div>
              <div className="text-center">
                <p className="font-terminal text-[10px] mb-3" style={{ color: C.muted }}>
                  {canCallNext ? 'Next citizen ready' : 'Queue empty'}
                </p>
                {canCallNext && (
                  <button
                    onClick={onCallNext}
                    className="px-4 py-2 font-terminal text-xs uppercase tracking-widest border transition-all"
                    style={{ borderColor: C.accent, color: C.accent, background: 'rgba(224,161,27,0.06)' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(224,161,27,0.12)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'rgba(224,161,27,0.06)')}
                  >
                    ▶ Call Next
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Physical Memo Paper ─────────────────────────────────────────────────────
function MemoPaper({ memo, acted, onAct, onDismiss }: {
  memo: LeakedMemo; acted: boolean; onAct: () => void; onDismiss: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const isDirective = memo.alignmentReward === 'corporate';
  const bgColor = isDirective ? '#f5f0e0' : '#fffde6';
  const borderColor = isDirective ? '#94a3b888' : '#d97706aa';
  const headerColor = isDirective ? '#374151' : '#92400e';

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      initial={{ x: -380, y: 20, rotate: -5, opacity: 0 }}
      animate={{ x: 20, y: 20, rotate: isDragging ? -1 : -3, opacity: 1 }}
      exit={{ x: -380, rotate: -8, opacity: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 160, delay: 0.1 }}
      whileDrag={{ scale: 1.02, rotate: -1, boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}
      style={{ zIndex: 200, background: bgColor, border: `1px solid ${borderColor}`, position: 'absolute' }}
      className="cursor-grab active:cursor-grabbing w-[280px] rounded-sm shadow-[4px_6px_24px_rgba(0,0,0,0.55)]"
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 rounded-sm opacity-70" style={{ background: '#fde68a', border: '1px solid #f59e0b' }} />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="border-b pb-2 flex items-start justify-between gap-2" style={{ borderColor: headerColor + '33', color: headerColor }}>
          <div className="font-mono text-[9px]">
            <div className="text-[10px] font-bold">{memo.classification}</div>
            <div className="opacity-60 mt-0.5">FROM: {memo.from}</div>
            <div className="opacity-60">RE: {memo.subject}</div>
          </div>
          <button onClick={onDismiss} className="opacity-30 hover:opacity-70 transition-opacity text-sm" style={{ color: headerColor }}>✕</button>
        </div>
        <div className="flex flex-col gap-1.5">
          {memo.lines.map((line, i) => (
            <p key={i} className="font-mono text-[10px] leading-snug text-slate-700">{line}</p>
          ))}
        </div>
        <div className="flex gap-2 mt-1">
          {!acted ? (
            <>
              <button
                onClick={onAct}
                className="flex-1 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded border transition-all"
                style={{ background: isDirective ? '#e2e8f0' : '#fef3c7', border: `1px solid ${isDirective ? '#94a3b8' : '#d97706'}`, color: isDirective ? '#374151' : '#92400e' }}
              >
                Act (+${memo.bonusIfActed})
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded border border-slate-300 text-slate-500 hover:bg-slate-100 transition-all"
              >
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

// ─── Day-End Summary ─────────────────────────────────────────────────────────
function DayEndOverlay({ state, endDay }: {
  state: ReturnType<typeof useGameEngine>['state'];
  endDay: () => void;
}) {
  const dailyEarnings = state.dailyLogs.reduce((acc, l) => acc + l.earnings, 0);
  const humanCosts    = state.dailyLogs.filter(l => l.humanCost);

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
      <TerminalPanel title={`SHIFT END: DAY ${state.day}`} className="w-[560px] max-h-[90vh] border-amber-500 flex flex-col">
        <div className="flex flex-col gap-4 overflow-y-auto">
          <h2 className="text-xl text-center font-bold tracking-widest">DAILY PERFORMANCE REPORT</h2>

          <div className="border border-amber-600/30 p-2 text-xs max-h-40 overflow-y-auto">
            <div className="grid grid-cols-4 border-b border-amber-600/50 pb-1.5 mb-1.5 font-bold opacity-70 uppercase tracking-wider text-[10px]">
              <span>Citizen</span><span>Action</span><span>Eval</span><span className="text-right">Pay</span>
            </div>
            {state.dailyLogs.map((log, i) => (
              <div key={i} className="grid grid-cols-4 py-0.5 border-b border-amber-600/10 last:border-0">
                <span className="opacity-80 truncate">{log.clientName}</span>
                <span className={log.decision === 'APPROVE' ? 'text-green-400' : log.decision === 'FREEZE' ? 'text-blue-400' : 'text-red-400'}>{log.decision}</span>
                <span className={log.wasCorrect ? 'text-green-400' : 'text-red-400'}>{log.wasCorrect ? '✓' : '✗'}</span>
                <span className="text-right">{formatMoney(log.earnings)}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 bg-amber-500/10 p-3 border border-amber-500/30 text-xs">
            <div>
              <span className="block opacity-60 uppercase">Daily Earnings</span>
              <span className={cn("text-2xl font-bold", dailyEarnings >= 0 ? 'text-green-400' : 'text-red-400')}>{formatMoney(dailyEarnings)}</span>
            </div>
            <div className="text-right">
              <span className="block opacity-60 uppercase">Total Balance</span>
              <span className="text-2xl font-bold text-amber-500">{formatMoney(state.money)}</span>
            </div>
          </div>

          {(() => {
            const c = state.dailyLogs.filter(l => l.alignmentShift === 'corporate').length;
            const w = state.dailyLogs.filter(l => l.alignmentShift === 'whistleblower').length;
            const s = state.dailyLogs.filter(l => l.alignmentShift === 'survivalist').length;
            return (
              <div className="border border-amber-600/30 p-3 rounded text-xs">
                <div className="opacity-50 uppercase tracking-wider mb-2 text-[10px]">Today's Alignment Shifts</div>
                <div className="flex gap-4">
                  {c > 0 && <span className="text-amber-400">+{c} Corporate</span>}
                  {w > 0 && <span className="text-blue-400">+{w} Resistance</span>}
                  {s > 0 && <span className="text-green-400">+{s} Survivalist</span>}
                  {c + w + s === 0 && <span className="opacity-40">No shifts recorded.</span>}
                </div>
              </div>
            );
          })()}

          {humanCosts.length > 0 && (
            <div className="border border-amber-600/30 p-3 rounded text-xs">
              <div className="opacity-50 uppercase tracking-wider mb-2 text-[10px]">Moral Ledger — Human Cost</div>
              <div className="flex flex-col gap-1.5">
                {humanCosts.map((log, i) => (
                  <div key={i} className="border-l-2 pl-2 py-0.5 leading-relaxed" style={{ borderColor: log.humanCost?.isPositive ? '#22c55e66' : '#ef444466' }}>
                    <span className="opacity-40 mr-1">{log.clientName}:</span>
                    <span className={log.humanCost?.isPositive ? 'text-green-400/80' : 'text-red-400/80'}>{log.humanCost?.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={endDay}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-desk-dark font-bold text-base uppercase tracking-widest transition-all"
          >
            {state.day >= 7 ? 'Submit Final Report' : 'Start Next Shift'}
          </button>
        </div>
      </TerminalPanel>
    </div>
  );
}

// ─── Action button for bottom bar ────────────────────────────────────────────
function ActionBtn({
  label, icon, borderColor, hoverBg, disabled, pulsing, onClick, children,
}: {
  label: string; icon: React.ReactNode;
  borderColor: string; hoverBg: string;
  disabled?: boolean; pulsing?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 min-w-[140px] h-11 px-6 border font-terminal text-sm font-bold uppercase tracking-widest transition-all",
        pulsing && !disabled && "animate-pulse",
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
      )}
      style={{
        background: C.panel,
        borderColor: disabled ? C.border : borderColor,
        color: disabled ? C.muted : C.text,
      }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.background = hoverBg; }}
      onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
    >
      {icon}
      {label}
      {children}
    </button>
  );
}

// ─── Main Desk Page ──────────────────────────────────────────────────────────
export default function Desk({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, stampAction, processDecision, callNextClient, endDay, actOnMemo, dismissMemo } = engine;

  const [topZIndex, setTopZIndex] = useState(10);
  const [docZIndices, setDocZIndices] = useState<Record<string, number>>({});
  const [circledFields, setCircledFields] = useState<Set<string>>(new Set());
  const [crtFlicker, setCRTFlicker] = useState(false);
  const prevMemoId = useRef<string | null>(null);

  const processedCount = 4 - state.clientsQueue.length - (state.currentClient ? 1 : 0);

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

  return (
    <div
      className={cn("h-screen w-full flex flex-col overflow-hidden transition-all", crtFlicker && "brightness-150")}
      style={{ background: C.bg, color: C.text, fontFamily: 'inherit' }}
    >
      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div
        className="h-12 flex items-center justify-between px-5 shrink-0 z-40"
        style={{ background: '#0e0a08', borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-5">
          <span className="font-stamped text-lg tracking-widest" style={{ color: C.accent }}>TAXES PLEASE</span>
          <div className="flex items-center gap-1.5 font-terminal text-xs" style={{ color: C.muted }}>
            <Clock className="w-3.5 h-3.5" />
            <span>DAY {state.day} / 7</span>
          </div>
          {state.activeEvent && (
            <div className="flex items-center gap-1.5 font-terminal text-[10px] px-2 py-1 rounded border" style={{ color: '#e0901b', borderColor: '#e0901b44', background: 'rgba(224,144,27,0.08)' }}>
              <TrendingDown className="w-3 h-3" />
              {state.activeEvent.title}
            </div>
          )}
        </div>
        <div className="flex items-center gap-5 font-terminal text-xs">
          {circledFields.size > 0 && (
            <div className="flex items-center gap-1" style={{ color: C.red }}>
              <span>⊗</span> {circledFields.size} flagged
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px]" style={{ color: C.muted }}>
            <span style={{color:'#d97706'}}>{state.alignment.corporate}C</span>
            <span className="mx-0.5">·</span>
            <span style={{color:'#6aabf0'}}>{state.alignment.whistleblower}R</span>
            <span className="mx-0.5">·</span>
            <span style={{color:C.green}}>{state.alignment.survivalist}S</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: C.green }}>
            <DollarSign className="w-3.5 h-3.5" />
            {formatMoney(state.money)}
          </div>
          <div className="flex items-center gap-1.5" style={{ color: state.citations > 0 ? C.red : C.muted }}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{state.citations}/5 citations</span>
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Citizen + Queue */}
        <LeftPanel
          client={state.currentClient}
          queue={state.clientsQueue}
          processedCount={processedCount}
          onCallNext={callNextClient}
          canCallNext={canCallNext}
        />

        {/* CENTER: Document desk */}
        <div className="flex-1 relative overflow-hidden" style={{ background: C.desk }}>
          {/* Very subtle grid — 8% opacity only */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(111,75,31,0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(111,75,31,0.08) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Stamp animation */}
          <Stamp type={stampAction} />

          {/* Flagged field badge */}
          {circledFields.size > 0 && state.currentClient && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="font-terminal text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow border" style={{ background: 'rgba(180,71,63,0.3)', borderColor: `${C.red}66`, color: '#fca5a5' }}>
                {circledFields.size} field{circledFields.size > 1 ? 's' : ''} flagged — reject for +${circledFields.size * 25} bonus
              </div>
            </div>
          )}

          {/* Empty desk hint */}
          {!state.currentClient && state.status === 'PLAYING' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="font-terminal text-xs uppercase tracking-widest opacity-20 border border-dashed p-6 rounded" style={{ borderColor: C.border, color: C.muted }}>
                {canCallNext ? 'Call next citizen to begin' : 'All citizens processed'}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className={cn("absolute inset-0 transition-opacity duration-300", isDeskDisabled && "opacity-50 pointer-events-none")}>
            {state.currentClient?.documents.map((doc, idx) => (
              <DraggablePaper
                key={state.currentClient!.id + doc.id}
                doc={doc}
                initialX={80 + idx * 40}
                initialY={24 + idx * 24}
                zIndex={docZIndices[doc.id] || 1}
                onFocus={() => bringToFront(doc.id)}
                circledFields={circledFields}
                onCircle={handleCircle}
                isNew={idx === 0}
              />
            ))}
          </div>

          {/* Memo paper */}
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

        {/* RIGHT: Rulebook */}
        <div className="w-72 shrink-0 border-l overflow-y-auto z-30" style={{ background: C.panel, borderColor: C.border }}>
          <div className="px-4 pt-3 pb-1 border-b font-terminal text-[9px] uppercase tracking-widest" style={{ borderColor: C.border + '88', color: C.muted }}>
            Ministry Directives
          </div>
          <Rulebook day={state.day} activeEvent={state.activeEvent} />
        </div>

      </div>

      {/* ── BOTTOM ACTION BAR ────────────────────────────────────────────────── */}
      <div
        className="h-[68px] flex items-center justify-center gap-3 shrink-0 z-40 px-5"
        style={{ background: '#0e0a08', borderTop: `1px solid ${C.border}` }}
      >
        {hasClient ? (
          <>
            <ActionBtn
              label="Approve"
              icon={<CheckCircle2 className="w-4 h-4" />}
              borderColor={C.green}
              hoverBg="rgba(63,163,92,0.12)"
              disabled={isDeskDisabled}
              onClick={() => processDecision('APPROVE', circledFields.size)}
            />
            <ActionBtn
              label="Reject"
              icon={<XCircle className="w-4 h-4" />}
              borderColor={C.red}
              hoverBg="rgba(180,71,63,0.12)"
              disabled={isDeskDisabled}
              onClick={() => processDecision('REJECT', circledFields.size)}
            />
            <ActionBtn
              label="Freeze"
              icon={<Snowflake className="w-4 h-4" />}
              borderColor="#3a6abf"
              hoverBg="rgba(58,106,191,0.12)"
              disabled={isDeskDisabled}
              pulsing={isContraband}
              onClick={() => processDecision('FREEZE', circledFields.size)}
            >
              {isContraband && (
                <span className="ml-1 text-[9px] text-blue-400 uppercase tracking-widest animate-pulse">!</span>
              )}
            </ActionBtn>
            {circledFields.size > 0 && (
              <div className="ml-4 font-terminal text-[10px] flex items-center gap-1" style={{ color: C.red }}>
                <AlertTriangle className="w-3 h-3" />
                {circledFields.size} circled
              </div>
            )}
          </>
        ) : (
          <ActionBtn
            label={canCallNext ? '▶  Call Next Citizen' : 'Queue Empty — End Shift'}
            icon={<Users className="w-4 h-4" />}
            borderColor={canCallNext ? C.accent : C.border}
            hoverBg={canCallNext ? 'rgba(224,161,27,0.10)' : 'transparent'}
            disabled={!canCallNext && state.clientsQueue.length === 0 && !hasClient}
            onClick={canCallNext ? callNextClient : () => {}}
          />
        )}
      </div>

      {/* ── Day End overlay ──────────────────────────────────────────────────── */}
      {state.status === 'DAY_END' && <DayEndOverlay state={state} endDay={endDay} />}
    </div>
  );
}
