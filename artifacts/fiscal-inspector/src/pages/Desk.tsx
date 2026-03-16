import { useState, useEffect } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';
import { ClientQueue } from '@/components/workspace/ClientQueue';
import { Rulebook } from '@/components/workspace/Rulebook';
import { DraggablePaper } from '@/components/workspace/DraggablePaper';
import { Stamp } from '@/components/ui/Stamp';
import { formatMoney, cn } from '@/lib/utils';
import { Clock, ShieldAlert, DollarSign, CheckCircle2, XCircle } from 'lucide-react';

export default function Desk({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, stampAction, processDecision, callNextClient, endDay } = engine;
  const [topZIndex, setTopZIndex] = useState(10);
  const [docZIndices, setDocZIndices] = useState<Record<string, number>>({});

  // Reset z-indices when new client arrives
  useEffect(() => {
    if (state.currentClient) {
      const initialZ: Record<string, number> = {};
      state.currentClient.documents.forEach((d, i) => {
        initialZ[d.id] = i + 1;
      });
      setDocZIndices(initialZ);
      setTopZIndex(state.currentClient.documents.length + 1);
    } else {
      setDocZIndices({});
    }
  }, [state.currentClient]);

  const bringToFront = (id: string) => {
    setTopZIndex(z => z + 1);
    setDocZIndices(prev => ({ ...prev, [id]: topZIndex }));
  };

  const isDeskDisabled = !!stampAction || !state.currentClient;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden crt-overlay desk-texture-bg">
      
      {/* Top Status Bar */}
      <div className="h-14 bg-desk-dark border-b border-amber-600/50 px-6 flex items-center justify-between shrink-0 z-40 shadow-xl shadow-black">
        <div className="flex items-center gap-6">
          <div className="font-stamped text-2xl text-amber-500 tracking-widest bg-amber-500/10 px-4 py-1 rounded border border-amber-500/20">
            FISCAL INSPECTOR
          </div>
          <div className="flex items-center gap-2 text-amber-400 font-terminal text-xl">
            <Clock className="w-5 h-5" /> DAY {state.day}
          </div>
        </div>

        <div className="flex items-center gap-8 font-terminal text-xl">
          <div className="flex items-center gap-2 text-green-400">
            <DollarSign className="w-5 h-5" /> {formatMoney(state.money)}
          </div>
          <div className={cn("flex items-center gap-2", state.citations > 0 ? "text-red-400" : "text-amber-400/50")}>
            <ShieldAlert className="w-5 h-5" /> 
            {state.citations}/5 CITATIONS
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Panel: Queue */}
        <div className="w-64 border-r border-black/50 shadow-2xl z-30 flex flex-col bg-desk-dark/80">
          <ClientQueue 
            queue={state.clientsQueue} 
            currentClient={state.currentClient}
            onCallNext={callNextClient}
          />
        </div>

        {/* Center: The actual desk surface */}
        <div className="flex-1 relative overflow-hidden">
          {/* Stamp Overlay */}
          <Stamp type={stampAction} />

          {/* Documents */}
          <div className={cn("absolute inset-0 transition-opacity duration-300", isDeskDisabled && "opacity-50 pointer-events-none")}>
            {state.currentClient?.documents.map((doc, idx) => (
              <DraggablePaper
                key={state.currentClient!.id + doc.id} // Forces remount on new client
                doc={doc}
                initialX={100 + (idx * 40)}
                initialY={50 + (idx * 30)}
                zIndex={docZIndices[doc.id] || 1}
                onFocus={() => bringToFront(doc.id)}
              />
            ))}
            
            {!state.currentClient && state.status === 'PLAYING' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-amber-500/30 font-terminal text-2xl uppercase tracking-widest border border-amber-500/20 p-8 rounded backdrop-blur-sm">
                  Desk Clear. Call Next Citizen.
                </div>
              </div>
            )}
          </div>

          {/* Desk Controls (Stamps) */}
          {state.currentClient && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-8 z-40">
              <button
                onClick={() => processDecision('APPROVE')}
                disabled={isDeskDisabled}
                className={cn(
                  "w-40 h-16 rounded shadow-[0_8px_0_#064e3b] active:shadow-[0_2px_0_#064e3b] active:translate-y-[6px]",
                  "bg-green-600 hover:bg-green-500 text-white font-bold font-stamped text-xl tracking-widest",
                  "border-2 border-green-800 transition-all duration-100 flex items-center justify-center gap-2",
                  isDeskDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <CheckCircle2 className="w-6 h-6" />
                APPROVE
              </button>
              
              <button
                onClick={() => processDecision('REJECT')}
                disabled={isDeskDisabled}
                className={cn(
                  "w-40 h-16 rounded shadow-[0_8px_0_#7f1d1d] active:shadow-[0_2px_0_#7f1d1d] active:translate-y-[6px]",
                  "bg-red-600 hover:bg-red-500 text-white font-bold font-stamped text-xl tracking-widest",
                  "border-2 border-red-800 transition-all duration-100 flex items-center justify-center gap-2",
                  isDeskDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <XCircle className="w-6 h-6" />
                REJECT
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Rulebook */}
        <div className="w-80 border-l border-black/50 shadow-2xl z-30 flex flex-col bg-desk-dark/80">
          <Rulebook day={state.day} />
        </div>

      </div>

      {/* Day End Modal Overlay */}
      {state.status === 'DAY_END' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
          <TerminalPanel title={`SHIFT END: DAY ${state.day}`} className="w-[500px] h-[600px] border-amber-500">
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
                  <div key={i} className="grid grid-cols-4 py-1 border-b border-amber-600/10 last:border-0">
                    <span className="opacity-80 truncate">{log.clientId}</span>
                    <span className={log.decision === 'APPROVE' ? 'text-green-400' : 'text-red-400'}>{log.decision}</span>
                    <span className={log.wasCorrect ? 'text-green-400' : 'text-red-400'}>{log.wasCorrect ? 'CORRECT' : 'ERROR'}</span>
                    <span className="text-right">{formatMoney(log.earnings)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 bg-amber-500/10 p-4 border border-amber-500/30">
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
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-desk-dark font-bold text-xl uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
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
