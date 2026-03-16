import { TerminalPanel } from './TerminalPanel';
import { Client } from '@/types/game';
import { Users, User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientQueueProps {
  queue: Client[];
  currentClient: Client | null;
  onCallNext: () => void;
}

export function ClientQueue({ queue, currentClient, onCallNext }: ClientQueueProps) {
  return (
    <TerminalPanel title="WAITING AREA" className="w-64 h-full">
      
      {currentClient ? (
        <div className="mb-6">
          <h4 className="text-xs uppercase text-amber-600 font-bold mb-2 tracking-widest">At Desk</h4>
          <div className="border border-amber-500 p-4 flex flex-col items-center gap-2 bg-amber-500/5 animate-pulse">
            <User className="w-12 h-12 text-amber-400" />
            <span className="font-bold text-lg">{currentClient.documents.find(d => d.type === 'ID')?.name || 'Citizen'}</span>
            <span className="text-xs opacity-70">Submitting {currentClient.documents.length} docs</span>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={onCallNext}
            disabled={queue.length === 0}
            className={cn(
              "w-full py-4 border border-amber-500 font-bold text-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200",
              queue.length > 0 
                ? "bg-amber-500 text-desk-dark hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
                : "opacity-50 cursor-not-allowed bg-transparent"
            )}
          >
            {queue.length > 0 ? "Call Next" : "Queue Empty"}
            {queue.length > 0 && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      )}

      <h4 className="text-xs uppercase text-amber-600 font-bold mb-2 tracking-widest flex items-center gap-2">
        <Users className="w-4 h-4" />
        Queue ({queue.length})
      </h4>
      
      <div className="flex flex-col gap-2">
        {queue.length === 0 && !currentClient && (
          <div className="text-center opacity-50 py-4 italic text-sm">
            No more citizens scheduled for today.
          </div>
        )}
        {queue.map((c, i) => (
          <div key={c.id} className="p-2 border border-amber-600/30 flex items-center gap-3 opacity-60">
            <div className="w-6 h-6 rounded-full bg-amber-600/20 flex items-center justify-center text-xs">
              {i + 1}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">Unknown Citizen</span>
              <span className="text-[10px]">Awaiting Inspection</span>
            </div>
          </div>
        ))}
      </div>
    </TerminalPanel>
  );
}
