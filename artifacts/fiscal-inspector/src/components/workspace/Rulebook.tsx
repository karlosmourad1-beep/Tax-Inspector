import { TerminalPanel } from './TerminalPanel';
import { FileCheck, AlertTriangle, Zap, Snowflake } from 'lucide-react';
import { MacroEvent } from '@/types/game';
import { cn } from '@/lib/utils';

const EVENT_COLORS: Record<string, string> = {
  market_shock: 'text-red-400 border-red-600/50 bg-red-900/20',
  hyperinflation: 'text-orange-400 border-orange-600/50 bg-orange-900/20',
  audit_sweep: 'text-amber-400 border-amber-500/50 bg-amber-900/20',
  banking_crisis: 'text-yellow-400 border-yellow-600/50 bg-yellow-900/20',
};

export function Rulebook({ day, activeEvent }: { day: number; activeEvent: MacroEvent | null }) {
  const rules = [
    { d: 1, text: "Verify Identity: Names and SSNs must match perfectly across all documents." },
    { d: 2, text: "Verify Income: W-2 Wages must match 1040-FI Gross Income exactly." },
    { d: 3, text: "Verify Deductions: Expense Report Total must match 1040-FI Deductions exactly." },
    { d: 4, text: "Verify Math: Taxable Income must equal (Gross Income − Deductions)." },
    { d: 5, text: "Verify Tax: Tax Owed must be exactly 15% of Taxable Income (rounded down)." },
  ];

  const activeRules = rules.filter(r => r.d <= day);
  const eventColor = activeEvent ? (EVENT_COLORS[activeEvent.type] || 'text-amber-400') : '';

  return (
    <TerminalPanel title="MINISTRY DIRECTIVES" className="w-full h-full text-amber-400 flex flex-col">
      <div className="flex-1 overflow-y-auto flex flex-col gap-4">

        {/* Active Macro Event */}
        {activeEvent && (
          <div className={cn("p-3 border rounded text-xs leading-relaxed", eventColor)}>
            <div className="flex items-center gap-2 font-bold mb-1 uppercase tracking-wider text-[11px]">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              {activeEvent.title}
            </div>
            <p className="opacity-90">{activeEvent.ruleAddendum}</p>
          </div>
        )}

        {/* Freeze Assets notice */}
        {day >= 4 && (
          <div className="p-3 border border-blue-600/40 bg-blue-900/20 rounded text-xs text-blue-300">
            <div className="flex items-center gap-2 font-bold mb-1 uppercase tracking-wider text-[11px]">
              <Snowflake className="w-3.5 h-3.5 shrink-0" />
              Freeze Assets (Day 4+)
            </div>
            <p className="opacity-90">Use FREEZE for financial contraband: money laundering, undeclared offshore accounts, or insider trading. Look for hidden notes in filings.</p>
          </div>
        )}

        {!activeEvent && (
          <div className="flex items-start gap-2 bg-amber-500/10 p-3 border border-amber-500/30 rounded text-sm leading-tight">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p>Inspect documents closely. Approve valid returns. Reject discrepancies. Freeze financial contraband.</p>
          </div>
        )}

        <h3 className="font-bold text-base tracking-widest flex items-center gap-2">
          <FileCheck className="w-4 h-4" />
          ACTIVE RULES (DAY {day})
        </h3>

        <div className="flex flex-col gap-3">
          {activeRules.map((rule, idx) => (
            <div key={idx} className="flex gap-2 text-xs border-l-2 border-amber-600/50 pl-2 py-1">
              <span className="font-bold shrink-0">0{rule.d}.</span>
              <span className="opacity-90 leading-relaxed">{rule.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-3 border-t border-amber-600/30 opacity-50 text-[10px] text-center">
          TAX RATE FIXED AT 15% — DECREE #492
        </div>
      </div>
    </TerminalPanel>
  );
}
