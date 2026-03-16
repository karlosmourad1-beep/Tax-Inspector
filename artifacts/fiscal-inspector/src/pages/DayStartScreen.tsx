import { useGameEngine } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';
import { DAILY_EVENTS } from '@/lib/narrative';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_COLORS: Record<string, string> = {
  market_shock: 'text-red-400 border-red-700 bg-red-950/40',
  hyperinflation: 'text-orange-400 border-orange-700 bg-orange-950/40',
  audit_sweep: 'text-amber-400 border-amber-600 bg-amber-950/40',
};

export default function DayStartScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, startDay } = engine;
  const event = DAILY_EVENTS[state.day];

  return (
    <div className="min-h-screen w-full bg-desk-dark flex items-center justify-center p-8 crt-overlay desk-texture-bg">
      <div className="absolute inset-0 bg-black/80 pointer-events-none" />

      <TerminalPanel title="MINISTRY DISPATCH" className="w-[520px] z-10 border-amber-500">
        <div className="flex flex-col items-center py-10 px-8 text-center gap-6">

          <h2 className="font-terminal text-xl text-amber-600 uppercase tracking-widest">
            Beginning
          </h2>
          <h1 className="font-stamped text-7xl text-amber-500 tracking-widest leading-none">
            DAY {state.day}
          </h1>

          {/* Show today's macro event if any */}
          {event && (
            <div className={cn(
              "w-full text-left p-4 border rounded text-sm leading-relaxed",
              EVENT_COLORS[event.type] || 'text-amber-400 border-amber-600 bg-amber-950/20'
            )}>
              <div className="flex items-center gap-2 font-bold mb-2 uppercase tracking-wider text-xs">
                <Zap className="w-4 h-4" />
                SPECIAL DISPATCH: {event.title}
              </div>
              <p className="opacity-90 leading-relaxed text-xs">{event.description}</p>
            </div>
          )}

          {/* Alignment reminder from day 2+ */}
          {state.day >= 2 && (
            <div className="w-full text-left text-xs font-terminal opacity-60 border border-amber-900/40 p-3 rounded">
              <div className="uppercase tracking-widest mb-1 text-amber-600">Alignment Record</div>
              <div className="flex gap-6">
                <span>Corporate: {state.alignment.corporate}</span>
                <span>Resistance: {state.alignment.whistleblower}</span>
                <span>Survivalist: {state.alignment.survivalist}</span>
              </div>
            </div>
          )}

          <button
            onClick={startDay}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-desk-dark font-bold text-xl uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all animate-pulse"
          >
            Open Desk
          </button>
        </div>
      </TerminalPanel>
    </div>
  );
}
