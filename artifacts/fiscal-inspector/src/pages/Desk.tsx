import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';
import { Rulebook } from '@/components/workspace/Rulebook';
import { DraggablePaper } from '@/components/workspace/DraggablePaper';
import { Stamp } from '@/components/ui/Stamp';
import { formatMoney, cn } from '@/lib/utils';
import { Client, LeakedMemo, DecisionType } from '@/types/game';
import {
  Clock, ShieldAlert, DollarSign, CheckCircle2, XCircle, Users,
  Snowflake, AlertTriangle, Eye, EyeOff, TrendingDown,
} from 'lucide-react';

// ─── Pixel person silhouette ───────────────────────────────────────────────────
function PersonSilhouette({ seed, label, isActive = false, isGone = false, isVIP = false }: {
  seed: number; label?: string; isActive?: boolean; isGone?: boolean; isVIP?: boolean;
}) {
  const hue      = (seed * 47) % 360;
  const shirtHue = (seed * 83 + 120) % 360;
  return (
    <div className={cn("flex flex-col items-center gap-0.5 transition-all duration-300", isGone && "opacity-0 pointer-events-none")}>
      <svg width="36" height="52" viewBox="0 0 36 52" fill="none">
        {isVIP && <polygon points="18,0 20,6 26,6 21,10 23,16 18,12 13,16 15,10 10,6 16,6" fill="gold" opacity="0.9" />}
        <ellipse cx="18" cy="11" rx="8" ry="9" fill={`hsl(${hue},40%,60%)`} />
        <ellipse cx="18" cy="4" rx="8" ry="4" fill={`hsl(${hue},30%,30%)`} />
        <rect x="9" y="20" width="18" height="18" rx="2" fill={`hsl(${shirtHue},50%,45%)`} />
        <rect x="1" y="20" width="8" height="14" rx="3" fill={`hsl(${shirtHue},45%,40%)`} />
        <rect x="27" y="20" width="8" height="14" rx="3" fill={`hsl(${shirtHue},45%,40%)`} />
        <rect x="10" y="38" width="7" height="13" rx="2" fill={`hsl(${hue},20%,25%)`} />
        <rect x="19" y="38" width="7" height="13" rx="2" fill={`hsl(${hue},20%,25%)`} />
        {isActive && <rect x="24" y="30" width="10" height="8" rx="1" fill="#8B7355" stroke="#5D4E37" strokeWidth="1" />}
        {isActive && <ellipse cx="18" cy="50" rx="14" ry="3" fill="rgba(245,158,11,0.4)" />}
      </svg>
      {label && (
        <span className={cn(
          "text-[9px] font-terminal tracking-wider truncate max-w-[44px] text-center leading-tight",
          isActive ? (isVIP ? "text-yellow-300" : "text-amber-400") : "text-amber-700/60"
        )}>{label.split(' ')[0]}</span>
      )}
    </div>
  );
}

// ─── People Lineup ─────────────────────────────────────────────────────────────
function PeopleLineup({ queue, currentClient, processedCount }: {
  queue: Client[]; currentClient: Client | null; processedCount: number;
}) {
  return (
    <div className="h-[18vh] bg-gradient-to-b from-black/60 to-black/30 border-b border-amber-900/50 flex items-end pb-2 px-6 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_80px,rgba(245,158,11,0.03)_80px,rgba(245,158,11,0.03)_81px)]" />
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-900/20" />
        <div className="absolute bottom-14 left-0 right-0 h-0.5 bg-amber-800/30" />
      </div>
      <div className="absolute top-2 left-4 font-terminal text-[10px] text-amber-700/50 tracking-widest uppercase">
        Waiting Area — Citizens In Queue
      </div>
      <div className="relative flex items-end gap-3 z-10 ml-4">
        {Array.from({ length: processedCount }).map((_, i) => (
          <div key={`gone-${i}`} className="w-10 flex flex-col items-center gap-1 opacity-20">
            <div className="w-8 h-12 border border-dashed border-amber-700/40 rounded-t-full" />
          </div>
        ))}
        {currentClient && (
          <motion.div key={currentClient.id + '-lineup'} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="relative">
            <PersonSilhouette seed={currentClient.avatarSeed} label={currentClient.name} isActive isVIP={currentClient.isVIP} />
            <div className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping", currentClient.isVIP ? "bg-yellow-300" : "bg-amber-400")} />
          </motion.div>
        )}
        {queue.map((c, i) => (
          <motion.div key={c.id + '-lineup'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <PersonSilhouette seed={c.avatarSeed} isVIP={c.isVIP} />
          </motion.div>
        ))}
        {Array.from({ length: Math.max(0, 4 - processedCount - (currentClient ? 1 : 0) - queue.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-10 h-14 border border-dashed border-amber-900/20 rounded-t-full opacity-20" />
        ))}
      </div>
      {currentClient && (
        <motion.div animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="absolute bottom-1 left-[68px] text-amber-500/60 font-bold text-xs">▼</motion.div>
      )}
    </div>
  );
}

// ─── Chat Bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ text, isNote = false }: { text: string; isNote?: boolean }) {
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "relative rounded-lg px-4 py-2 max-w-[360px] font-terminal text-xs leading-relaxed shadow-lg",
        isNote ? "bg-red-950/80 border border-red-600/50 text-red-200 italic" : "bg-amber-950/80 border border-amber-700/50 text-amber-200"
      )}
    >
      <div className="absolute -left-2 top-4 w-0 h-0 border-t-4 border-t-transparent border-r-8 border-r-amber-700/50 border-b-4 border-b-transparent" />
      <div className="absolute -left-[6px] top-[17px] w-0 h-0 border-t-[3px] border-t-transparent border-r-[7px] border-r-amber-950/80 border-b-[3px] border-b-transparent" />
      {isNote && <span className="text-red-400 font-bold not-italic">[NOTE FOUND] </span>}
      {text}
    </motion.div>
  );
}

// ─── Client Booth ──────────────────────────────────────────────────────────────
function ClientBooth({ client, onCallNext, queueLength, canCallNext }: {
  client: Client | null; onCallNext: () => void; queueLength: number; canCallNext: boolean;
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

  const currentText = showNote && client?.hiddenNote ? client.hiddenNote : client?.smallTalk[lineIdx] || '';

  return (
    <div className="h-[18vh] bg-gradient-to-b from-black/40 to-black/20 border-b border-amber-900/40 flex items-center px-6 gap-6 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-900/40 border-r border-amber-800/30" />
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-amber-900/30 border-t border-amber-800/20" />
      <AnimatePresence mode="wait">
        {client ? (
          <motion.div key={client.id + '-booth'} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 200 }} className="flex items-center gap-5 z-10 w-full">
            <div className="shrink-0 relative">
              <svg width="52" height="72" viewBox="0 0 36 52" fill="none">
                <ellipse cx="18" cy="11" rx="8" ry="9" fill={`hsl(${(client.avatarSeed * 47) % 360},40%,60%)`} />
                <ellipse cx="18" cy="4" rx="8" ry="4" fill={`hsl(${(client.avatarSeed * 47) % 360},30%,30%)`} />
                <rect x="9" y="20" width="18" height="18" rx="2" fill={`hsl(${(client.avatarSeed * 83 + 120) % 360},50%,45%)`} />
                <rect x="1" y="20" width="8" height="14" rx="3" fill={`hsl(${(client.avatarSeed * 83 + 120) % 360},45%,40%)`} />
                <rect x="27" y="20" width="8" height="14" rx="3" fill={`hsl(${(client.avatarSeed * 83 + 120) % 360},45%,40%)`} />
                <rect x="10" y="38" width="7" height="13" rx="2" fill={`hsl(${(client.avatarSeed * 47) % 360},20%,25%)`} />
                <rect x="19" y="38" width="7" height="13" rx="2" fill={`hsl(${(client.avatarSeed * 47) % 360},20%,25%)`} />
                <rect x="24" y="30" width="10" height="8" rx="1" fill="#8B7355" stroke="#5D4E37" strokeWidth="1" />
              </svg>
              {client.isVIP && <div className="absolute -top-1 -right-1 text-yellow-300 text-xs font-bold">★</div>}
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-terminal text-xs text-amber-500/70 uppercase tracking-widest truncate">
                  {client.name}
                  {client.isVIP && client.vipData && (
                    <span className="ml-2 text-yellow-400/80">· {client.vipData.title}, {client.vipData.organization}</span>
                  )}
                </span>
                {client.hiddenNote && (
                  <button onClick={() => setShowNote(s => !s)} className="shrink-0 text-red-400/60 hover:text-red-400 transition-colors" title="Toggle hidden note">
                    {showNote ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              <AnimatePresence mode="wait">
                <ChatBubble key={client.id + '-' + lineIdx + (showNote ? '-note' : '')} text={currentText} isNote={showNote && !!client.hiddenNote} />
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty-booth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4 z-10">
            <div className="w-14 h-16 border-2 border-dashed border-amber-800/30 rounded-t-full flex items-end justify-center pb-1">
              <span className="text-amber-800/30 text-2xl">?</span>
            </div>
            <button
              onClick={onCallNext}
              disabled={!canCallNext}
              className={cn(
                "px-6 py-3 font-terminal text-sm uppercase tracking-widest border transition-all",
                canCallNext ? "border-amber-500 text-amber-400 hover:bg-amber-500/10 cursor-pointer" : "border-amber-900/40 text-amber-900/40 cursor-not-allowed"
              )}
            >
              {canCallNext ? '▶ Call Next Citizen' : 'Queue Empty — End Shift'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute top-2 right-4 flex items-center gap-1 text-amber-700/50 font-terminal text-[10px] uppercase tracking-widest">
        <Users className="w-3 h-3" /> {queueLength} waiting
      </div>
    </div>
  );
}

// ─── Physical Memo Paper (slides onto desk from left) ──────────────────────────
function MemoPaper({ memo, acted, onAct, onDismiss }: {
  memo: LeakedMemo; acted: boolean; onAct: () => void; onDismiss: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const isDirective = memo.alignmentReward === 'corporate';
  const bgColor = isDirective ? 'bg-[#f5f0e0]' : 'bg-[#fffde6]';
  const borderColor = isDirective ? 'border-slate-400/60' : 'border-amber-400/60';
  const headerColor = isDirective ? 'text-slate-700' : 'text-amber-800';

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      initial={{ x: -420, y: 20, rotate: -6, opacity: 0 }}
      animate={{ x: 20, y: 20, rotate: isDragging ? -1 : -4, opacity: 1 }}
      exit={{ x: -420, rotate: -10, opacity: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 160, delay: 0.1 }}
      whileDrag={{ scale: 1.03, rotate: -1, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
      style={{ zIndex: 200 }}
      className={cn(
        "absolute cursor-grab active:cursor-grabbing w-[300px] rounded-sm shadow-[4px_6px_20px_rgba(0,0,0,0.5)]",
        bgColor, "border", borderColor
      )}
    >
      {/* Tape strip at top */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-amber-200/60 border border-amber-300/60 rounded-sm opacity-80" />

      <div className="p-4 flex flex-col gap-2">
        {/* Header */}
        <div className={cn("font-mono text-[9px] font-bold uppercase tracking-widest border-b pb-2 mb-1", headerColor, `border-current/20`)}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold">{memo.classification}</div>
              <div className="opacity-60 font-normal text-[9px] mt-0.5">FROM: {memo.from}</div>
              <div className="opacity-60 font-normal text-[9px]">RE: {memo.subject}</div>
            </div>
            <button
              onClick={onDismiss}
              className="text-current opacity-30 hover:opacity-80 transition-opacity text-base leading-none shrink-0 mt-0.5"
            >✕</button>
          </div>
        </div>

        {/* Lines */}
        <div className="flex flex-col gap-1.5">
          {memo.lines.map((line, i) => (
            <p key={i} className="font-mono text-[10px] text-slate-700 leading-snug">{line}</p>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-2 flex gap-2">
          {!acted ? (
            <>
              <button
                onClick={onAct}
                className={cn(
                  "flex-1 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded border transition-all",
                  isDirective
                    ? "bg-slate-200 hover:bg-slate-300 border-slate-400 text-slate-700"
                    : "bg-amber-200 hover:bg-amber-300 border-amber-500 text-amber-800"
                )}
              >
                Act on Intel (+${memo.bonusIfActed})
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

// ─── Rubber Stamp Button ───────────────────────────────────────────────────────
function StampButton({ label, shortLabel, icon, color, shadowColor, ringColor, pulsing, disabled, onClick }: {
  label: string; shortLabel?: string; icon: React.ReactNode;
  color: string; shadowColor: string; ringColor?: string;
  pulsing?: boolean; disabled?: boolean; onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setPressed(true);
    onClick();
    setTimeout(() => setPressed(false), 300);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-terminal text-[8px] uppercase tracking-widest opacity-40">STAMP</span>
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          transform: pressed ? 'translateY(7px)' : 'translateY(0)',
          boxShadow: pressed
            ? `0 1px 0 ${shadowColor}, 0 0 12px rgba(0,0,0,0.4)`
            : `0 7px 0 ${shadowColor}, 0 2px 20px rgba(0,0,0,0.5)`,
          transition: 'transform 80ms ease, box-shadow 80ms ease',
        }}
        className={cn(
          "relative w-32 h-16 rounded-[3px] flex flex-col items-center justify-center gap-0.5",
          "font-stamped text-white font-bold text-base tracking-widest",
          "border-2",
          color,
          pulsing && !disabled && ringColor && `ring-2 ${ringColor} animate-pulse`,
          disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
        )}
      >
        {/* Ink texture overlay */}
        <div className="absolute inset-0 rounded-[2px] opacity-20 pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '80px 80px' }} />
        <span className="flex items-center gap-1.5 relative z-10">
          {icon}
          {shortLabel || label}
        </span>
        {pulsing && <span className="relative z-10 text-[8px] opacity-80 tracking-wider">ASSETS</span>}
      </button>
    </div>
  );
}

// ─── Day-End Summary ───────────────────────────────────────────────────────────
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

          {/* Alignment shifts */}
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

          {/* Moral Ledger */}
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

          {state.activeEvent && (
            <div className="text-[10px] font-terminal text-amber-600/60 border border-amber-900/30 p-2 rounded text-center">
              {state.activeEvent.title} — effect applied this shift.
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

// ─── Main Desk Page ────────────────────────────────────────────────────────────
export default function Desk({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, stampAction, processDecision, callNextClient, endDay, actOnMemo, dismissMemo } = engine;

  const [topZIndex, setTopZIndex] = useState(10);
  const [docZIndices, setDocZIndices] = useState<Record<string, number>>({});
  const [circledFields, setCircledFields] = useState<Set<string>>(new Set());
  const [crtFlicker, setCRTFlicker] = useState(false);
  const prevMemoId = useRef<string | null>(null);

  const processedCount = 4 - state.clientsQueue.length - (state.currentClient ? 1 : 0);

  // CRT flicker when a new memo arrives
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
  const isContraband = !!state.currentClient?.isContraband;

  return (
    <div className={cn("h-screen w-full flex flex-col overflow-hidden crt-overlay desk-texture-bg transition-all", crtFlicker && "brightness-150")}>

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div className="h-10 bg-desk-dark border-b border-amber-600/50 px-4 flex items-center justify-between shrink-0 z-40 shadow-xl shadow-black">
        <div className="flex items-center gap-4">
          <div className="font-stamped text-lg text-amber-500 tracking-widest">FISCAL INSPECTOR</div>
          <div className="flex items-center gap-1.5 text-amber-400 font-terminal text-sm">
            <Clock className="w-4 h-4" /> DAY {state.day}
          </div>
        </div>
        <div className="flex items-center gap-5 font-terminal text-sm">
          {state.activeEvent && (
            <div className="flex items-center gap-1.5 text-orange-400 text-xs border border-orange-700/50 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3" />
              {state.activeEvent.type === 'market_shock' && 'MARKET SHOCK'}
              {state.activeEvent.type === 'hyperinflation' && 'HYPERINFLATION'}
              {state.activeEvent.type === 'audit_sweep' && 'AUDIT SWEEP'}
            </div>
          )}
          {circledFields.size > 0 && (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <span>⊗</span> {circledFields.size} flagged
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] font-terminal opacity-60">
            <span className="text-amber-400">{state.alignment.corporate}C</span>
            <span className="text-blue-400">{state.alignment.whistleblower}R</span>
            <span className="text-green-400">{state.alignment.survivalist}S</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-400">
            <DollarSign className="w-4 h-4" /> {formatMoney(state.money)}
          </div>
          <div className={cn("flex items-center gap-1.5", state.citations > 0 ? "text-red-400" : "text-amber-400/50")}>
            <ShieldAlert className="w-4 h-4" /> {state.citations}/5
          </div>
        </div>
      </div>

      {/* ── Macro event ticker ──────────────────────────────────────────────── */}
      {state.activeEvent && (
        <div className="bg-orange-950/60 border-b border-orange-700/50 px-6 py-1.5 flex items-center gap-3 text-orange-300 font-terminal text-[11px] shrink-0">
          <TrendingDown className="w-3.5 h-3.5 shrink-0" />
          <span className="font-bold uppercase tracking-wider mr-2">{state.activeEvent.title}:</span>
          <span className="opacity-80">{state.activeEvent.ruleAddendum}</span>
        </div>
      )}

      {/* ── People lineup ────────────────────────────────────────────────────── */}
      <PeopleLineup queue={state.clientsQueue} currentClient={state.currentClient} processedCount={processedCount} />

      {/* ── Client booth ─────────────────────────────────────────────────────── */}
      <ClientBooth
        client={state.currentClient}
        onCallNext={callNextClient}
        queueLength={state.clientsQueue.length}
        canCallNext={state.clientsQueue.length > 0}
      />

      {/* ── Desk workspace ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">

        {/* Document surface */}
        <div className="flex-1 relative overflow-hidden">
          <Stamp type={stampAction} />

          {/* Flagged field hint */}
          {circledFields.size > 0 && state.currentClient && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-red-900/80 border border-red-500/60 text-red-300 font-terminal text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow">
                {circledFields.size} flagged — reject for +${circledFields.size * 25} bonus
              </div>
            </div>
          )}

          {/* Empty desk hint */}
          {!state.currentClient && state.status === 'PLAYING' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-amber-500/30 font-terminal text-xl uppercase tracking-widest border border-amber-500/20 p-8 rounded">
                Desk Clear — Call Next Citizen
              </div>
            </div>
          )}

          {/* Documents */}
          <div className={cn("absolute inset-0 transition-opacity duration-300", isDeskDisabled && "opacity-50 pointer-events-none")}>
            {state.currentClient?.documents.map((doc, idx) => (
              <DraggablePaper
                key={state.currentClient!.id + doc.id}
                doc={doc}
                initialX={90 + (idx * 44)}
                initialY={30 + (idx * 28)}
                zIndex={docZIndices[doc.id] || 1}
                onFocus={() => bringToFront(doc.id)}
                circledFields={circledFields}
                onCircle={handleCircle}
                isNew={idx === 0}
              />
            ))}
          </div>

          {/* Physical Leaked Memo paper — slides onto desk from the left */}
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

          {/* ── Rubber Stamp buttons ─────────────────────────────────────────── */}
          {state.currentClient && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-5 z-40 items-end">
              <StampButton
                label="APPROVE"
                icon={<CheckCircle2 className="w-4 h-4" />}
                color="bg-green-700 border-green-900 hover:bg-green-600"
                shadowColor="#064e3b"
                disabled={isDeskDisabled}
                onClick={() => processDecision('APPROVE', circledFields.size)}
              />
              <StampButton
                label="REJECT"
                icon={<XCircle className="w-4 h-4" />}
                color="bg-red-700 border-red-900 hover:bg-red-600"
                shadowColor="#7f1d1d"
                disabled={isDeskDisabled}
                onClick={() => processDecision('REJECT', circledFields.size)}
              />
              <StampButton
                label="FREEZE"
                shortLabel="FREEZE"
                icon={<Snowflake className="w-4 h-4" />}
                color={cn("bg-blue-700 border-blue-900 hover:bg-blue-600", isContraband && "bg-blue-600 border-blue-400")}
                shadowColor="#1e3a5f"
                ringColor="ring-blue-400/40"
                pulsing={isContraband}
                disabled={isDeskDisabled}
                onClick={() => processDecision('FREEZE', circledFields.size)}
              />
            </div>
          )}
        </div>

        {/* Right panel: Rulebook only (memo is now on desk surface) */}
        <div className="w-64 border-l border-black/50 shadow-2xl z-30 bg-desk-dark/80 overflow-y-auto">
          <Rulebook day={state.day} activeEvent={state.activeEvent} />
        </div>
      </div>

      {/* ── Day End overlay ─────────────────────────────────────────────────── */}
      {state.status === 'DAY_END' && <DayEndOverlay state={state} endDay={endDay} />}
    </div>
  );
}
