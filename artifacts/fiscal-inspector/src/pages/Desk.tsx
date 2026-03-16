import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';
import { Rulebook } from '@/components/workspace/Rulebook';
import { DraggablePaper } from '@/components/workspace/DraggablePaper';
import { Stamp } from '@/components/ui/Stamp';
import { formatMoney, cn } from '@/lib/utils';
import { Client } from '@/types/game';
import { Clock, ShieldAlert, DollarSign, CheckCircle2, XCircle, Users } from 'lucide-react';

// ─── Pixel-art person silhouette (SVG) ────────────────────────────────────────
function PersonSilhouette({
  seed,
  label,
  isActive = false,
  isGone = false,
}: {
  seed: number;
  label?: string;
  isActive?: boolean;
  isGone?: boolean;
}) {
  const hue = (seed * 47) % 360;
  const shirtHue = (seed * 83 + 120) % 360;
  return (
    <div className={cn("flex flex-col items-center gap-0.5 transition-all duration-300", isGone && "opacity-0 pointer-events-none")}>
      <svg width="36" height="52" viewBox="0 0 36 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <ellipse cx="18" cy="11" rx="8" ry="9" fill={`hsl(${hue},40%,60%)`} />
        {/* Hair */}
        <ellipse cx="18" cy="4" rx="8" ry="4" fill={`hsl(${hue},30%,30%)`} />
        {/* Body */}
        <rect x="9" y="20" width="18" height="18" rx="2" fill={`hsl(${shirtHue},50%,45%)`} />
        {/* Arms */}
        <rect x="1" y="20" width="8" height="14" rx="3" fill={`hsl(${shirtHue},45%,40%)`} />
        <rect x="27" y="20" width="8" height="14" rx="3" fill={`hsl(${shirtHue},45%,40%)`} />
        {/* Legs */}
        <rect x="10" y="38" width="7" height="13" rx="2" fill={`hsl(${hue},20%,25%)`} />
        <rect x="19" y="38" width="7" height="13" rx="2" fill={`hsl(${hue},20%,25%)`} />
        {/* Briefcase if active */}
        {isActive && (
          <rect x="24" y="30" width="10" height="8" rx="1" fill="#8B7355" stroke="#5D4E37" strokeWidth="1" />
        )}
        {/* Active glow ring */}
        {isActive && (
          <ellipse cx="18" cy="50" rx="14" ry="3" fill="rgba(245,158,11,0.4)" />
        )}
      </svg>
      {label && (
        <span className={cn(
          "text-[9px] font-terminal tracking-wider truncate max-w-[44px] text-center leading-tight",
          isActive ? "text-amber-400" : "text-amber-700/60"
        )}>
          {label.split(' ')[0]}
        </span>
      )}
    </div>
  );
}

// ─── People Lineup Bar (top 20%) ───────────────────────────────────────────────
function PeopleLineup({
  queue,
  currentClient,
  processedCount,
}: {
  queue: Client[];
  currentClient: Client | null;
  processedCount: number;
}) {
  const allSlots = 4; // fixed slots per day
  const gone = processedCount;

  return (
    <div className="h-[18vh] bg-gradient-to-b from-black/60 to-black/30 border-b border-amber-900/50 flex items-end pb-2 px-6 gap-0 overflow-hidden relative">
      {/* Background: hallway wall */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_80px,rgba(245,158,11,0.03)_80px,rgba(245,158,11,0.03)_81px)]" />
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-900/20" />
        {/* Rope/barrier line */}
        <div className="absolute bottom-14 left-0 right-0 h-0.5 bg-amber-800/30" />
      </div>

      {/* Hallway label */}
      <div className="absolute top-2 left-4 font-terminal text-[10px] text-amber-700/50 tracking-widest uppercase">
        Waiting Area — Citizens In Queue
      </div>

      <div className="relative flex items-end gap-3 z-10 ml-4">
        {/* Gone slots (empty outlines) */}
        {Array.from({ length: gone }).map((_, i) => (
          <div key={`gone-${i}`} className="w-10 flex flex-col items-center gap-1 opacity-20">
            <div className="w-8 h-12 border border-dashed border-amber-700/40 rounded-t-full" />
            <span className="text-[8px] font-terminal text-amber-700/40">—</span>
          </div>
        ))}

        {/* Current client at window */}
        {currentClient && (
          <motion.div
            key={currentClient.id + '-lineup'}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative"
          >
            <PersonSilhouette seed={currentClient.avatarSeed} label={currentClient.name} isActive />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
          </motion.div>
        )}

        {/* Remaining queue */}
        {queue.map((c, i) => (
          <motion.div
            key={c.id + '-lineup'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <PersonSilhouette seed={c.avatarSeed} />
          </motion.div>
        ))}

        {/* Empty remaining slots */}
        {Array.from({ length: Math.max(0, allSlots - gone - (currentClient ? 1 : 0) - queue.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-10 h-14 border border-dashed border-amber-900/20 rounded-t-full opacity-20" />
        ))}
      </div>

      {/* Arrow pointing down to booth */}
      {currentClient && (
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="absolute bottom-1 left-[68px] text-amber-500/60 font-bold text-xs"
        >
          ▼
        </motion.div>
      )}
    </div>
  );
}

// ─── Chat Bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ text }: { text: string }) {
  return (
    <motion.div
      key={text}
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="relative bg-amber-950/80 border border-amber-700/50 rounded-lg px-4 py-2 max-w-[340px] text-amber-200 font-terminal text-xs leading-relaxed shadow-lg"
    >
      {/* Bubble tail */}
      <div className="absolute -left-2 top-4 w-0 h-0 border-t-4 border-t-transparent border-r-8 border-r-amber-700/50 border-b-4 border-b-transparent" />
      <div className="absolute -left-[6px] top-[17px] w-0 h-0 border-t-[3px] border-t-transparent border-r-[7px] border-r-amber-950/80 border-b-[3px] border-b-transparent" />
      {text}
    </motion.div>
  );
}

// ─── Client Booth (20% below lineup) ──────────────────────────────────────────
function ClientBooth({
  client,
  onCallNext,
  queueLength,
  canCallNext,
}: {
  client: Client | null;
  onCallNext: () => void;
  queueLength: number;
  canCallNext: boolean;
}) {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (!client) return;
    setLineIdx(0);
    if (client.smallTalk.length <= 1) return;
    const timer = setInterval(() => {
      setLineIdx(prev => (prev + 1 < client.smallTalk.length ? prev + 1 : prev));
    }, 3200);
    return () => clearInterval(timer);
  }, [client]);

  return (
    <div className="h-[18vh] bg-gradient-to-b from-black/40 to-black/20 border-b border-amber-900/40 flex items-center px-6 gap-6 relative overflow-hidden">
      {/* Booth window frame */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-900/40 border-r border-amber-800/30" />

      {/* Counter surface suggestion */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-amber-900/30 border-t border-amber-800/20" />

      <AnimatePresence mode="wait">
        {client ? (
          <motion.div
            key={client.id + '-booth'}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="flex items-center gap-5 z-10"
          >
            {/* Larger person figure in booth */}
            <div className="shrink-0">
              <svg width="52" height="72" viewBox="0 0 36 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="18" cy="11" rx="8" ry="9" fill={`hsl(${(client.avatarSeed * 47) % 360},40%,60%)`} />
                <ellipse cx="18" cy="4" rx="8" ry="4" fill={`hsl(${(client.avatarSeed * 47) % 360},30%,30%)`} />
                <rect x="9" y="20" width="18" height="18" rx="2" fill={`hsl(${(client.avatarSeed * 83 + 120) % 360},50%,45%)`} />
                <rect x="1" y="20" width="8" height="14" rx="3" fill={`hsl(${(client.avatarSeed * 83 + 120) % 360},45%,40%)`} />
                <rect x="27" y="20" width="8" height="14" rx="3" fill={`hsl(${(client.avatarSeed * 83 + 120) % 360},45%,40%)`} />
                <rect x="10" y="38" width="7" height="13" rx="2" fill={`hsl(${(client.avatarSeed * 47) % 360},20%,25%)`} />
                <rect x="19" y="38" width="7" height="13" rx="2" fill={`hsl(${(client.avatarSeed * 47) % 360},20%,25%)`} />
                <rect x="24" y="30" width="10" height="8" rx="1" fill="#8B7355" stroke="#5D4E37" strokeWidth="1" />
              </svg>
            </div>

            {/* Name tag + chat bubble */}
            <div className="flex flex-col gap-2">
              <div className="font-terminal text-xs text-amber-500/70 uppercase tracking-widest">
                {client.name} &nbsp;·&nbsp; Filing {client.documents.length} document{client.documents.length !== 1 ? 's' : ''}
              </div>
              <AnimatePresence mode="wait">
                <ChatBubble key={client.id + '-line-' + lineIdx} text={client.smallTalk[lineIdx]} />
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-booth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-4 z-10"
          >
            <div className="w-14 h-16 border-2 border-dashed border-amber-800/30 rounded-t-full flex items-end justify-center pb-1">
              <span className="text-amber-800/30 text-2xl">?</span>
            </div>
            <button
              onClick={onCallNext}
              disabled={!canCallNext}
              className={cn(
                "px-6 py-3 font-terminal text-sm uppercase tracking-widest border transition-all duration-200",
                canCallNext
                  ? "border-amber-500 text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                  : "border-amber-900/40 text-amber-900/40 cursor-not-allowed"
              )}
            >
              {canCallNext ? '▶ Call Next Citizen' : 'Queue Empty — End Shift'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue count badge */}
      <div className="absolute top-2 right-4 flex items-center gap-1 text-amber-700/50 font-terminal text-[10px] uppercase tracking-widest">
        <Users className="w-3 h-3" />
        {queueLength} waiting
      </div>
    </div>
  );
}

// ─── Main Desk Page ────────────────────────────────────────────────────────────
export default function Desk({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, stampAction, processDecision, callNextClient, endDay } = engine;

  // Track z-indices for draggable papers
  const [topZIndex, setTopZIndex] = useState(10);
  const [docZIndices, setDocZIndices] = useState<Record<string, number>>({});

  // Track circled (flagged) fields across all documents
  const [circledFields, setCircledFields] = useState<Set<string>>(new Set());

  // Compute how many clients have already left the queue today
  const CLIENTS_PER_DAY = 4;
  const processedCount = CLIENTS_PER_DAY - state.clientsQueue.length - (state.currentClient ? 1 : 0);

  // Reset state when a new client arrives
  useEffect(() => {
    if (state.currentClient) {
      const initialZ: Record<string, number> = {};
      state.currentClient.documents.forEach((d, i) => {
        initialZ[d.id] = i + 1;
      });
      setDocZIndices(initialZ);
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

  const handleDecision = (decision: 'APPROVE' | 'REJECT') => {
    processDecision(decision, circledFields.size);
  };

  const isDeskDisabled = !!stampAction || !state.currentClient;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden crt-overlay desk-texture-bg">

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <div className="h-10 bg-desk-dark border-b border-amber-600/50 px-6 flex items-center justify-between shrink-0 z-40 shadow-xl shadow-black">
        <div className="flex items-center gap-5">
          <div className="font-stamped text-lg text-amber-500 tracking-widest">
            FISCAL INSPECTOR
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 font-terminal text-sm">
            <Clock className="w-4 h-4" /> DAY {state.day}
          </div>
        </div>
        <div className="flex items-center gap-6 font-terminal text-sm">
          {circledFields.size > 0 && (
            <div className="flex items-center gap-1 text-red-400 animate-pulse">
              <span className="text-xs">⊗</span>
              {circledFields.size} flagged
            </div>
          )}
          <div className="flex items-center gap-1.5 text-green-400">
            <DollarSign className="w-4 h-4" /> {formatMoney(state.money)}
          </div>
          <div className={cn("flex items-center gap-1.5", state.citations > 0 ? "text-red-400" : "text-amber-400/50")}>
            <ShieldAlert className="w-4 h-4" />
            {state.citations}/5 CITATIONS
          </div>
        </div>
      </div>

      {/* ── People lineup (top ~20%) ────────────────────────────────────────── */}
      <PeopleLineup
        queue={state.clientsQueue}
        currentClient={state.currentClient}
        processedCount={processedCount}
      />

      {/* ── Client booth (~20%) ─────────────────────────────────────────────── */}
      <ClientBooth
        client={state.currentClient}
        onCallNext={callNextClient}
        queueLength={state.clientsQueue.length}
        canCallNext={state.clientsQueue.length > 0}
      />

      {/* ── Desk workspace (remaining ~60%) ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">

        {/* Center: document surface */}
        <div className="flex-1 relative overflow-hidden">
          <Stamp type={stampAction} />

          {/* Circled count hint */}
          {circledFields.size > 0 && state.currentClient && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="bg-red-900/80 border border-red-500/60 text-red-300 font-terminal text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow">
                {circledFields.size} field{circledFields.size !== 1 ? 's' : ''} flagged — reject for +${circledFields.size * 25} bonus
              </div>
            </div>
          )}

          {/* Tip when no client */}
          {!state.currentClient && state.status === 'PLAYING' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-amber-500/30 font-terminal text-xl uppercase tracking-widest border border-amber-500/20 p-8 rounded">
                Desk Clear — Call Next Citizen
              </div>
            </div>
          )}

          {/* Draggable documents */}
          <div className={cn("absolute inset-0 transition-opacity duration-300", isDeskDisabled && "opacity-50 pointer-events-none")}>
            {state.currentClient?.documents.map((doc, idx) => (
              <DraggablePaper
                key={state.currentClient!.id + doc.id}
                doc={doc}
                initialX={80 + (idx * 44)}
                initialY={30 + (idx * 28)}
                zIndex={docZIndices[doc.id] || 1}
                onFocus={() => bringToFront(doc.id)}
                circledFields={circledFields}
                onCircle={handleCircle}
              />
            ))}
          </div>

          {/* Approve / Reject stamp buttons */}
          {state.currentClient && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-6 z-40">
              <button
                onClick={() => handleDecision('APPROVE')}
                disabled={isDeskDisabled}
                className={cn(
                  "w-40 h-14 rounded shadow-[0_6px_0_#064e3b] active:shadow-[0_1px_0_#064e3b] active:translate-y-[5px]",
                  "bg-green-600 hover:bg-green-500 text-white font-bold font-stamped text-lg tracking-widest",
                  "border-2 border-green-800 transition-all duration-100 flex items-center justify-center gap-2",
                  isDeskDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <CheckCircle2 className="w-5 h-5" /> APPROVE
              </button>
              <button
                onClick={() => handleDecision('REJECT')}
                disabled={isDeskDisabled}
                className={cn(
                  "w-40 h-14 rounded shadow-[0_6px_0_#7f1d1d] active:shadow-[0_1px_0_#7f1d1d] active:translate-y-[5px]",
                  "bg-red-600 hover:bg-red-500 text-white font-bold font-stamped text-lg tracking-widest",
                  "border-2 border-red-800 transition-all duration-100 flex items-center justify-center gap-2",
                  isDeskDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <XCircle className="w-5 h-5" /> REJECT
              </button>
            </div>
          )}
        </div>

        {/* Right: Rulebook panel */}
        <div className="w-72 border-l border-black/50 shadow-2xl z-30 flex flex-col bg-desk-dark/80">
          <Rulebook day={state.day} />
        </div>
      </div>

      {/* ── Day End overlay ─────────────────────────────────────────────────── */}
      {state.status === 'DAY_END' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
          <TerminalPanel title={`SHIFT END: DAY ${state.day}`} className="w-[500px] h-[580px] border-amber-500">
            <div className="flex flex-col h-full">
              <h2 className="text-2xl mb-4 text-center font-bold tracking-widest">DAILY PERFORMANCE REPORT</h2>
              <div className="flex-1 overflow-y-auto mb-4 border border-amber-600/30 p-2 text-sm">
                <div className="grid grid-cols-4 border-b border-amber-600/50 pb-2 mb-2 font-bold opacity-70 uppercase tracking-wider text-xs">
                  <span>Citizen</span>
                  <span>Action</span>
                  <span>Eval</span>
                  <span className="text-right">Pay</span>
                </div>
                {state.dailyLogs.map((log, i) => (
                  <div key={i} className="grid grid-cols-4 py-1 border-b border-amber-600/10 last:border-0 text-xs">
                    <span className="opacity-80 truncate">{log.clientName || log.clientId}</span>
                    <span className={log.decision === 'APPROVE' ? 'text-green-400' : 'text-red-400'}>{log.decision}</span>
                    <span className={log.wasCorrect ? 'text-green-400' : 'text-red-400'}>{log.wasCorrect ? 'CORRECT' : 'ERROR'}</span>
                    <span className="text-right">{formatMoney(log.earnings)}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 bg-amber-500/10 p-4 border border-amber-500/30">
                <div>
                  <span className="block opacity-70 text-xs uppercase">Daily Earnings</span>
                  <span className="text-2xl text-green-400">{formatMoney(state.dailyLogs.reduce((acc, l) => acc + l.earnings, 0))}</span>
                </div>
                <div className="text-right">
                  <span className="block opacity-70 text-xs uppercase">Total Balance</span>
                  <span className="text-2xl text-amber-500">{formatMoney(state.money)}</span>
                </div>
              </div>
              <button
                onClick={endDay}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-desk-dark font-bold text-lg uppercase tracking-widest transition-all"
              >
                Start Next Shift
              </button>
            </div>
          </TerminalPanel>
        </div>
      )}
    </div>
  );
}
