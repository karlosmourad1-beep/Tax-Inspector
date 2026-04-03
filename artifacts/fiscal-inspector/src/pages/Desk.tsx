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

// ─── Mini person silhouette for queue ───────────────────────────────────────
function MiniSilhouette({ seed, isVIP, isActive }: { seed: number; isVIP?: boolean; isActive?: boolean }) {
  const hue      = (seed * 47) % 360;
  const shirtHue = (seed * 83 + 120) % 360;
  return (
    <div className="relative shrink-0">
      <svg width="28" height="40" viewBox="0 0 36 52" fill="none">
        <ellipse cx="18" cy="11" rx="8" ry="9" fill={`hsl(${hue},40%,60%)`} />
        <ellipse cx="18" cy="4" rx="8" ry="4" fill={`hsl(${hue},30%,30%)`} />
        <rect x="9" y="20" width="18" height="18" rx="2" fill={`hsl(${shirtHue},50%,45%)`} />
        <rect x="1" y="20" width="8" height="14" rx="3" fill={`hsl(${shirtHue},45%,40%)`} />
        <rect x="27" y="20" width="8" height="14" rx="3" fill={`hsl(${shirtHue},45%,40%)`} />
        <rect x="10" y="38" width="7" height="13" rx="2" fill={`hsl(${hue},20%,25%)`} />
        <rect x="19" y="38" width="7" height="13" rx="2" fill={`hsl(${hue},20%,25%)`} />
      </svg>
      {isVIP && <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-yellow-300 text-[8px]">★</span>}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ background: `radial-gradient(circle, rgba(224,161,27,0.25) 0%, transparent 70%)` }}
        />
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
            <div className="relative">
              <MiniSilhouette seed={client.avatarSeed} isVIP={client.isVIP} isActive />
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{ background: C.accent }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          )}
          {/* Waiting */}
          {queue.map(c => (
            <MiniSilhouette key={c.id} seed={c.avatarSeed} isVIP={c.isVIP} />
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
              {/* Portrait */}
              <div className="flex items-center gap-2">
                <svg width="52" height="72" viewBox="0 0 36 52" fill="none" className="shrink-0">
                  <ellipse cx="18" cy="11" rx="8" ry="9" fill={`hsl(${(client.avatarSeed * 47) % 360},40%,60%)`} />
                  <ellipse cx="18" cy="4" rx="8" ry="4" fill={`hsl(${(client.avatarSeed * 47) % 360},30%,30%)`} />
                  <rect x="9" y="20" width="18" height="18" rx="2" fill={`hsl(${(client.avatarSeed * 83 + 120) % 360},50%,45%)`} />
                  <rect x="1" y="20" width="8" height="14" rx="3" fill={`hsl(${(client.avatarSeed * 83 + 120) % 360},45%,40%)`} />
                  <rect x="27" y="20" width="8" height="14" rx="3" fill={`hsl(${(client.avatarSeed * 83 + 120) % 360},45%,40%)`} />
                  <rect x="10" y="38" width="7" height="13" rx="2" fill={`hsl(${(client.avatarSeed * 47) % 360},20%,25%)`} />
                  <rect x="19" y="38" width="7" height="13" rx="2" fill={`hsl(${(client.avatarSeed * 47) % 360},20%,25%)`} />
                  <rect x="24" y="30" width="10" height="8" rx="1" fill="#8B7355" stroke="#5D4E37" strokeWidth="1" />
                </svg>
                <div className="min-w-0">
                  <div className="font-terminal text-[10px] font-bold truncate" style={{ color: C.accent }}>
                    {client.name}
                    {client.isVIP && <span className="ml-1 text-yellow-300">★</span>}
                  </div>
                  {client.isVIP && client.vipData && (
                    <div className="font-terminal text-[9px] truncate" style={{ color: C.muted }}>
                      {client.vipData.organization}
                    </div>
                  )}
                  {client.hiddenNote && (
                    <button
                      onClick={() => setShowNote(s => !s)}
                      className="mt-1 flex items-center gap-1 font-terminal text-[9px] transition-colors"
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
