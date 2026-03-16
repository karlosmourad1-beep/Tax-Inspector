import { useGameEngine } from '@/hooks/useGameEngine';
import { TerminalPanel } from '@/components/workspace/TerminalPanel';
import { formatMoney, cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { calculateEnding } from '@/lib/narrative';

const ENDING_COLORS = {
  green: { border: 'border-green-500', title: 'text-green-400', bg: 'bg-green-900/20' },
  red: { border: 'border-red-600', title: 'text-red-400', bg: 'bg-red-900/20' },
  amber: { border: 'border-amber-500', title: 'text-amber-400', bg: 'bg-amber-900/20' },
  blue: { border: 'border-blue-500', title: 'text-blue-400', bg: 'bg-blue-900/20' },
  purple: { border: 'border-purple-500', title: 'text-purple-400', bg: 'bg-purple-900/20' },
};

export default function EndScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, returnToMenu } = engine;
  const isVictory = state.status === 'VICTORY';

  const ending = state.ending ?? calculateEnding(
    state.money, state.citations, state.alignment, state.worldState, state.day
  );
  const colors = ENDING_COLORS[ending.color] || ENDING_COLORS.amber;

  const dominantAlignment =
    state.alignment.whistleblower >= state.alignment.corporate && state.alignment.whistleblower >= state.alignment.survivalist
      ? 'whistleblower'
      : state.alignment.corporate >= state.alignment.survivalist
        ? 'corporate'
        : 'survivalist';

  const alignmentLabels = { corporate: 'Corporate Loyalist', whistleblower: 'Resistance', survivalist: 'Survivalist' };
  const alignmentColors = { corporate: 'text-amber-400', whistleblower: 'text-blue-400', survivalist: 'text-green-400' };

  // Human costs from all-time logs
  const humanCosts = state.allTimeLogs
    .filter(l => l.humanCost)
    .slice(-6);

  return (
    <div className="min-h-screen w-full bg-desk-dark flex items-center justify-center p-4 crt-overlay desk-texture-bg overflow-auto">
      <div className="absolute inset-0 bg-black/80 pointer-events-none" />

      <TerminalPanel
        title={isVictory ? "FINAL EVALUATION" : "TERMINATED — CASE FILE CLOSED"}
        className={cn("w-[640px] z-10 border-4 my-4", colors.border)}
      >
        <div className="flex flex-col gap-5 py-6 px-6">

          {/* Ending title */}
          <div className={cn("text-center p-5 border rounded", colors.bg, colors.border)}>
            <div className="font-terminal text-xs uppercase tracking-widest opacity-60 mb-1">
              {isVictory ? 'Ending Unlocked' : 'Case Closed'}
            </div>
            <h1 className={cn("font-stamped text-5xl tracking-widest mb-2", colors.title)}>
              {ending.title}
            </h1>
            <p className={cn("font-terminal text-sm uppercase tracking-wider", colors.title)}>
              {ending.subtitle}
            </p>
          </div>

          {/* Narrative description */}
          <div className="text-sm leading-relaxed font-terminal opacity-90 border border-amber-600/30 p-4 bg-black/20 rounded italic">
            "{ending.description}"
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs font-terminal">
            <div className="border border-amber-600/30 p-3 rounded">
              <div className="opacity-50 uppercase tracking-wider mb-1">Days Served</div>
              <div className="text-xl text-amber-500">{Math.min(state.day, 7)} / 7</div>
            </div>
            <div className="border border-amber-600/30 p-3 rounded">
              <div className="opacity-50 uppercase tracking-wider mb-1">Final Balance</div>
              <div className={cn("text-xl", state.money >= 0 ? 'text-green-400' : 'text-red-400')}>
                {formatMoney(state.money)}
              </div>
            </div>
            <div className="border border-amber-600/30 p-3 rounded">
              <div className="opacity-50 uppercase tracking-wider mb-1">Citations</div>
              <div className={cn("text-xl", state.citations >= 3 ? 'text-red-400' : 'text-amber-500')}>
                {state.citations} / 5
              </div>
            </div>
          </div>

          {/* Alignment readout */}
          <div className="border border-amber-600/30 p-4 rounded bg-black/20">
            <div className="font-terminal text-xs uppercase tracking-widest opacity-60 mb-3">Alignment Path</div>
            <div className="flex flex-col gap-2">
              {(['corporate', 'whistleblower', 'survivalist'] as const).map(path => {
                const total = state.alignment.corporate + state.alignment.whistleblower + state.alignment.survivalist;
                const pct = total > 0 ? Math.round((state.alignment[path] / total) * 100) : 0;
                const isDominant = path === dominantAlignment;
                return (
                  <div key={path} className="flex items-center gap-3 text-xs font-terminal">
                    <span className={cn("w-24 uppercase tracking-wider text-right", isDominant ? alignmentColors[path] : 'opacity-40')}>
                      {path === 'whistleblower' ? 'Resistance' : path}
                    </span>
                    <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-amber-900/40">
                      <div
                        className={cn("h-full rounded-full transition-all", {
                          'bg-amber-500': path === 'corporate',
                          'bg-blue-500': path === 'whistleblower',
                          'bg-green-500': path === 'survivalist',
                        })}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={isDominant ? alignmentColors[path] : 'opacity-40'}>{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-right text-[10px] font-terminal opacity-50">
              Dominant: <span className={alignmentColors[dominantAlignment]}>{alignmentLabels[dominantAlignment]}</span>
            </div>
          </div>

          {/* Moral Ledger */}
          {humanCosts.length > 0 && (
            <div className="border border-amber-600/30 p-4 rounded bg-black/20">
              <div className="font-terminal text-xs uppercase tracking-widest opacity-60 mb-3">Moral Ledger — Human Cost</div>
              <div className="flex flex-col gap-2">
                {humanCosts.map((log, i) => (
                  <div key={i} className="text-[11px] font-terminal leading-relaxed border-l-2 pl-3 py-0.5"
                    style={{ borderColor: log.humanCost?.isPositive ? '#22c55e' : '#ef4444' }}
                  >
                    <span className="opacity-50 mr-2">{log.clientName}:</span>
                    <span className={log.humanCost?.isPositive ? 'text-green-400/80' : 'text-red-400/80'}>
                      {log.humanCost?.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={returnToMenu}
            className="w-full py-3 border-2 border-amber-500 hover:bg-amber-500 hover:text-desk-dark text-amber-500 font-bold text-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Return to Main Menu
          </button>
        </div>
      </TerminalPanel>
    </div>
  );
}
