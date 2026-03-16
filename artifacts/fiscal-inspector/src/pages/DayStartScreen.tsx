import { useGameEngine } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';

export default function DayStartScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, startDay } = engine;

  return (
    <div className="min-h-screen w-full bg-desk-dark flex items-center justify-center p-8 crt-overlay desk-texture-bg">
      <div className="absolute inset-0 bg-black/80 pointer-events-none" />
      
      <TerminalPanel title="MINISTRY DISPATCH" className="w-[500px] z-10 border-amber-500">
        <div className="flex flex-col items-center py-16 px-8 text-center">
          
          <h2 className="font-terminal text-2xl text-amber-600 mb-2 uppercase tracking-widest">
            Beginning
          </h2>
          <h1 className="font-stamped text-7xl text-amber-500 mb-12 tracking-widest">
            DAY {state.day}
          </h1>

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
