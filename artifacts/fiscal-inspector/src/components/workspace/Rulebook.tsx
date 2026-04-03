import { FileCheck, Snowflake, Zap, AlertTriangle } from 'lucide-react';
import { MacroEvent } from '@/types/game';

const RULES = [
  { d: 1, label: 'Identity',    text: 'Names and SSNs must match across ALL documents.' },
  { d: 2, label: 'Income',      text: 'W-2 Wages must equal 1040 Gross Income exactly.' },
  { d: 3, label: 'Deductions',  text: 'Expense Report Total must equal 1040 Deductions exactly.' },
  { d: 4, label: 'Math',        text: 'Taxable Income = Gross Income − Deductions.' },
  { d: 5, label: 'Tax Owed',    text: 'Tax Owed must match progressive bracket calculation: 10% ≤$20K, 22% $20K–$80K, 32% $80K–$180K, 37% above.' },
  { d: 5, label: 'Schedule D',  text: 'Short-term capital gains: taxed at ordinary bracket rate. Long-term: preferential rates (0% / 15% / 20%). Misclassification = fraud.' },
];

const EVENT_BG: Record<string, string> = {
  market_shock:  'rgba(180,71,63,0.12)',
  hyperinflation:'rgba(180,120,30,0.12)',
  audit_sweep:   'rgba(224,161,27,0.10)',
  banking_crisis:'rgba(60,120,200,0.12)',
};
const EVENT_COLOR: Record<string, string> = {
  market_shock:  '#e05a52',
  hyperinflation:'#e0901b',
  audit_sweep:   '#e0a11b',
  banking_crisis:'#6aabf0',
};

export function Rulebook({ day, activeEvent }: { day: number; activeEvent: MacroEvent | null }) {
  const activeRules = RULES.filter(r => r.d <= day);
  const ec = activeEvent ? (EVENT_COLOR[activeEvent.type] || '#e0a11b') : '#e0a11b';
  const ebg = activeEvent ? (EVENT_BG[activeEvent.type] || 'rgba(224,161,27,0.10)') : '';

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-3 p-4" style={{ color: '#f3dfb2' }}>

      {activeEvent && (
        <div className="p-3 rounded text-xs leading-relaxed border" style={{ background: ebg, borderColor: ec + '55', color: ec }}>
          <div className="flex items-center gap-2 font-bold mb-1 uppercase tracking-wider text-[10px]">
            <Zap className="w-3 h-3 shrink-0" />
            {activeEvent.title}
          </div>
          <p style={{ opacity: 0.9 }}>{activeEvent.ruleAddendum}</p>
        </div>
      )}

      {day >= 4 && (
        <div className="p-3 rounded text-xs border" style={{ background: 'rgba(60,100,200,0.10)', borderColor: '#3a6abf55', color: '#7ab0f0' }}>
          <div className="flex items-center gap-2 font-bold mb-1 uppercase tracking-wider text-[10px]">
            <Snowflake className="w-3 h-3 shrink-0" />
            Freeze Assets (Day 4+)
          </div>
          <p style={{ opacity: 0.85 }}>
            Use FREEZE for financial contraband: money laundering, undeclared offshore accounts, insider trading. Check for hidden notes inside filings.
          </p>
        </div>
      )}

      {!activeEvent && (
        <div className="flex items-start gap-2 p-3 rounded text-xs border" style={{ background: 'rgba(224,161,27,0.06)', borderColor: '#6f4b1f' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#e0a11b' }} />
          <p style={{ color: '#c9aa7a' }}>Approve valid returns. Reject discrepancies. Freeze contraband. Errors cost money and citations.</p>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9c6b12' }}>
          <FileCheck className="w-3.5 h-3.5" />
          Active Rules — Day {day}
        </div>
        <div className="flex flex-col gap-2">
          {activeRules.map((rule, i) => {
            const isCurrent = rule.d === day;
            return (
              <div
                key={i}
                className="flex flex-col gap-0.5 pl-2 py-1.5 text-xs leading-relaxed rounded-sm"
                style={{
                  borderLeft: `2px solid ${isCurrent ? '#e0a11b' : '#6f4b1f66'}`,
                  background: isCurrent ? 'rgba(224,161,27,0.05)' : 'transparent',
                }}
              >
                <span className="font-bold text-[9px] uppercase tracking-widest" style={{ color: isCurrent ? '#e0a11b' : '#6f4b1f' }}>
                  Rule {String(i + 1).padStart(2, '0')} — {rule.label}
                </span>
                <span style={{ color: isCurrent ? '#f3dfb2' : '#9c6b12', opacity: isCurrent ? 1 : 0.75 }}>{rule.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-3 border-t text-[9px] flex flex-col gap-1" style={{ borderColor: '#6f4b1f44', color: '#6f4b1f' }}>
        <div className="font-bold text-[9px] uppercase tracking-widest mb-1">Payout Schedule</div>
        <div className="flex justify-between"><span>Correct Approve</span><span style={{color:'#3fa35c'}}>+$50</span></div>
        <div className="flex justify-between"><span>Correct Reject</span><span style={{color:'#3fa35c'}}>+$75 (+$25/field)</span></div>
        <div className="flex justify-between"><span>Correct Freeze</span><span style={{color:'#3fa35c'}}>+$150</span></div>
        <div className="flex justify-between"><span>Wrong Decision</span><span style={{color:'#b4473f'}}>−$10–50 + Citation</span></div>
        <div className="flex justify-between mt-1"><span>5 Citations</span><span style={{color:'#b4473f'}}>Terminated</span></div>
      </div>
    </div>
  );
}
