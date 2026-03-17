import { useGameEngine } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';
import { Play, BookOpen } from 'lucide-react';

export default function MainMenu({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { startGame } = engine;

  return (
    <div className="min-h-screen w-full bg-desk-dark flex items-center justify-center p-8 crt-overlay desk-texture-bg">
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      
      <TerminalPanel title="MINISTRY OF FINANCE - TERMINAL 42" className="w-[600px] z-10 border-amber-500 border-4">
        <div className="flex flex-col items-center py-12 px-8 text-center">
          <img src={`${import.meta.env.BASE_URL}images/seal.png`} alt="Seal" className="w-32 h-32 mb-8 opacity-80 mix-blend-screen" />
          
          <h1 className="font-stamped text-6xl text-amber-500 mb-2 tracking-widest drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            TAXES PLEASE
          </h1>
          <p className="font-terminal text-xl text-amber-600 mb-12 uppercase tracking-widest">
            Glory to the Tax Code
          </p>

          <div className="w-full max-w-md bg-black/40 p-6 border border-amber-600/50 text-left mb-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <p className="mb-4">
              <strong className="text-white">ATTENTION CLERK:</strong> You have been assigned to audit incoming citizen tax declarations.
            </p>
            <ul className="list-disc pl-5 opacity-80 flex flex-col gap-2">
              <li>Inspect submitted documents for discrepancies.</li>
              <li>Approve correct filings to earn your wage.</li>
              <li>Reject fraudulent filings for a bonus.</li>
              <li>Errors will result in citations and financial penalties.</li>
              <li>5 Citations = Immediate Termination.</li>
            </ul>
          </div>

          <div className="flex gap-6 w-full max-w-md">
            <button
              onClick={startGame}
              className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-desk-dark font-bold text-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
            >
              <Play className="w-6 h-6 fill-current" />
              BEGIN SHIFT
            </button>
          </div>
        </div>
      </TerminalPanel>
    </div>
  );
}
