import { useGameEngine } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';
import { formatMoney } from '@/lib/utils';
import { RotateCcw, Award, Skull } from 'lucide-react';

export default function EndScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, returnToMenu } = engine;
  const isVictory = state.status === 'VICTORY';

  return (
    <div className="min-h-screen w-full bg-desk-dark flex items-center justify-center p-8 crt-overlay desk-texture-bg">
      <div className="absolute inset-0 bg-black/80 pointer-events-none" />
      
      <TerminalPanel 
        title={isVictory ? "EVALUATION: OUTSTANDING" : "EVALUATION: TERMINATED"} 
        className={`w-[600px] z-10 border-4 ${isVictory ? 'border-green-500' : 'border-red-600'}`}
      >
        <div className="flex flex-col items-center py-12 px-8 text-center">
          
          {isVictory ? (
            <Award className="w-32 h-32 text-green-500 mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          ) : (
            <Skull className="w-32 h-32 text-red-600 mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
          )}
          
          <h1 className={`font-stamped text-5xl mb-4 tracking-widest ${isVictory ? 'text-green-500' : 'text-red-600'}`}>
            {isVictory ? "EXEMPLARY SERVICE" : "YOU ARE FIRED"}
          </h1>
          
          <div className="w-full bg-black/40 p-6 border border-amber-600/50 text-left mb-8">
            <p className="mb-4 text-lg">
              {isVictory 
                ? "The Ministry thanks you for your meticulous audits. The tax gap has narrowed thanks to your efforts." 
                : "You have accrued 5 citations. The Ministry does not tolerate incompetence. Clear your desk immediately."}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-amber-600/30">
              <div>
                <span className="block opacity-70 text-xs uppercase">Days Completed</span>
                <span className="text-2xl text-white">{state.day - 1} / 7</span>
              </div>
              <div>
                <span className="block opacity-70 text-xs uppercase">Final Balance</span>
                <span className={`text-2xl ${state.money >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatMoney(state.money)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={returnToMenu}
            className="w-full max-w-md py-4 border-2 border-amber-500 hover:bg-amber-500 hover:text-desk-dark text-amber-500 font-bold text-xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Return to Main Menu
          </button>
        </div>
      </TerminalPanel>
    </div>
  );
}
