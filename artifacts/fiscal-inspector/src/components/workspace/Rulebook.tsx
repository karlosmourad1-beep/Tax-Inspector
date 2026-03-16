import { TerminalPanel } from './TerminalPanel';
import { FileCheck, AlertTriangle } from 'lucide-react';

export function Rulebook({ day }: { day: number }) {
  const rules = [
    { d: 1, text: "Verify Identity: Names and SSNs must match perfectly across all submitted documents." },
    { d: 2, text: "Verify Income: W-2 Wages must match 1040-FI Gross Income exactly." },
    { d: 3, text: "Verify Deductions: Expense Report Total must match 1040-FI Deductions exactly." },
    { d: 4, text: "Verify Math: Taxable Income must equal (Gross Income - Deductions)." },
    { d: 5, text: "Verify Tax: Tax Owed must be exactly 15% of Taxable Income (rounded down)." },
  ];

  const activeRules = rules.filter(r => r.d <= day);

  return (
    <TerminalPanel title="MINISTRY DIRECTIVES" className="w-80 h-full text-amber-400">
      <div className="mb-6 flex items-center gap-3 bg-amber-500/10 p-3 border border-amber-500/30 rounded">
        <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
        <p className="text-sm leading-tight">
          Inspect documents closely. Approve valid returns. Reject discrepancies. The Ministry expects accuracy.
        </p>
      </div>

      <h3 className="font-bold text-lg mb-3 tracking-widest flex items-center gap-2">
        <FileCheck className="w-5 h-5" />
        ACTIVE RULES (DAY {day})
      </h3>
      
      <div className="flex flex-col gap-4">
        {activeRules.map((rule, idx) => (
          <div key={idx} className="flex gap-3 text-sm border-l-2 border-amber-600/50 pl-3 py-1">
            <span className="font-bold shrink-0">0{rule.d}.</span>
            <span className="opacity-90">{rule.text}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-amber-600/30 opacity-60 text-xs text-center">
        TAX RATE FIXED AT 15% BY DECREE #492
      </div>
    </TerminalPanel>
  );
}
