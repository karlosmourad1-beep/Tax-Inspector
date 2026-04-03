import { FileCheck, Snowflake, Zap, AlertTriangle, Target } from 'lucide-react';
import { MacroEvent } from '@/types/game';
import { formatMoney } from '@/lib/utils';

const RULES = [
  { d: 1, label: 'Identity',    text: 'Names and SSNs must match across ALL documents.' },
  { d: 2, label: 'Income',      text: 'W-2 Wages must equal 1040 Gross Income exactly.' },
  { d: 3, label: 'Deductions',  text: 'Expense Report Total must equal 1040 Deductions exactly.' },
  { d: 4, label: 'Math Check',  text: 'Taxable Income = Gross Income − Deductions. Verify the arithmetic.' },
  { d: 5, label: 'Tax Owed',    text: '10% ≤$20K · 22% $20K–$80K · 32% $80K–$180K · 37% above.' },
  { d: 5, label: 'Schedule D',  text: 'Short-term gains: taxed at ordinary rate. Long-term: 0% / 15% / 20%. Misclassification = fraud.' },
];

const EVENT_BG: Record<string, string> = {
  market_shock:   'rgba(180,71,63,0.14)',
  hyperinflation: 'rgba(180,120,30,0.14)',
  audit_sweep:    'rgba(224,161,27,0.12)',
  banking_crisis: 'rgba(60,120,200,0.14)',
};
const EVENT_COLOR: Record<string, string> = {
  market_shock:   '#e05a52',
  hyperinflation: '#e0901b',
  audit_sweep:    '#e0a11b',
  banking_crisis: '#6aabf0',
};

const C = {
  border: '#6f4b1f',
  accent: '#e0a11b',
  muted:  '#7a5520',
  green:  '#3fa35c',
  red:    '#b4473f',
  text:   '#f3dfb2',
};

interface RulebookProps {
  day: number;
  activeEvent: MacroEvent | null;
  dailyGoal: number;
  dailyEarned: number;
}

export function Rulebook({ day, activeEvent, dailyGoal, dailyEarned }: RulebookProps) {
  const activeRules = RULES.filter(r => r.d <= day);
  const ec  = activeEvent ? (EVENT_COLOR[activeEvent.type] || C.accent) : C.accent;
  const ebg = activeEvent ? (EVENT_BG[activeEvent.type]   || '') : '';
  const goalProgress = Math.min(1, dailyEarned / dailyGoal);
  const goalMet      = dailyEarned >= dailyGoal;
  const goalShortfall = dailyGoal - dailyEarned;

  return (
    <div className="flex flex-col gap-0 divide-y divide-amber-900/30" style={{ color: C.text }}>

      {/* ── Daily Goal ───────────────────────────────────────────────────── */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-3.5 h-3.5 shrink-0" style={{ color: C.accent }} />
          <span className="font-terminal text-[10px] uppercase tracking-widest font-bold" style={{ color: C.muted }}>
            Shift Target — Day {day}
          </span>
        </div>

        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="font-terminal text-2xl font-bold leading-none" style={{ color: goalMet ? C.green : C.text }}>
              {formatMoney(Math.max(0, dailyEarned))}
            </div>
            <div className="font-terminal text-[10px] mt-1" style={{ color: C.muted }}>
              of {formatMoney(dailyGoal)} target
            </div>
          </div>
          {goalMet ? (
            <div className="font-terminal text-xs font-bold" style={{ color: C.green }}>✓ MET</div>
          ) : (
            <div className="font-terminal text-xs" style={{ color: C.red }}>
              {formatMoney(goalShortfall)} needed
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2a1a10' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${goalProgress * 100}%`,
              background: goalMet ? C.green : goalProgress > 0.6 ? C.accent : C.red,
            }}
          />
        </div>
      </div>

      {/* ── Active Event ─────────────────────────────────────────────────── */}
      {activeEvent && (
        <div className="px-5 py-4">
          <div className="flex items-start gap-2.5 p-3 rounded border" style={{ background: ebg, borderColor: ec + '55' }}>
            <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: ec }} />
            <div>
              <div className="font-terminal text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: ec }}>
                {activeEvent.title}
              </div>
              <p className="font-terminal text-xs leading-relaxed" style={{ color: ec, opacity: 0.9 }}>
                {activeEvent.ruleAddendum}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Freeze reminder (Day 4+) ─────────────────────────────────────── */}
      {day >= 4 && (
        <div className="px-5 py-4">
          <div className="flex items-start gap-2.5 p-3 rounded border" style={{ background: 'rgba(58,106,191,0.10)', borderColor: '#3a6abf44' }}>
            <Snowflake className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#7ab0f0' }} />
            <div>
              <div className="font-terminal text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#7ab0f0' }}>
                Freeze Assets — High Risk / High Reward
              </div>
              <p className="font-terminal text-xs leading-relaxed" style={{ color: '#7ab0f0', opacity: 0.85 }}>
                Use for money laundering, offshore accounts, insider trading. Correct: +$200. Wrong: −$75 + citation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Rules ─────────────────────────────────────────────────── */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="w-3.5 h-3.5 shrink-0" style={{ color: C.muted }} />
          <span className="font-terminal text-[10px] uppercase tracking-widest font-bold" style={{ color: C.muted }}>
            Active Rules — Day {day}
          </span>
        </div>

        {!activeEvent && (
          <div className="flex items-start gap-2 p-3 rounded mb-3 border" style={{ background: 'rgba(224,161,27,0.05)', borderColor: C.border + '55' }}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: C.accent }} />
            <p className="font-terminal text-xs leading-relaxed" style={{ color: '#c9aa7a' }}>
              Approve clean filings. Reject discrepancies. Freeze contraband. Errors cost money and earn citations.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {activeRules.map((rule, i) => {
            const isCurrent = rule.d === day;
            return (
              <div
                key={i}
                className="pl-3 py-2 rounded-sm"
                style={{
                  borderLeft: `2px solid ${isCurrent ? C.accent : C.border + '55'}`,
                  background: isCurrent ? 'rgba(224,161,27,0.06)' : 'transparent',
                }}
              >
                <div className="font-terminal text-[9px] uppercase tracking-widest mb-1 font-bold"
                     style={{ color: isCurrent ? C.accent : C.muted }}>
                  {rule.label}
                </div>
                <div className="font-terminal text-xs leading-relaxed"
                     style={{ color: isCurrent ? C.text : '#9c6b12', opacity: isCurrent ? 1 : 0.8 }}>
                  {rule.text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Payout Schedule ──────────────────────────────────────────────── */}
      <div className="px-5 py-4">
        <div className="font-terminal text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: C.muted }}>
          Payout Schedule
        </div>
        <div className="flex flex-col gap-2 font-terminal text-xs">
          <div className="flex justify-between items-center py-1.5 px-2 rounded" style={{ background: 'rgba(63,163,92,0.06)' }}>
            <span style={{ color: C.text }}>✓ Correct Approve</span>
            <span className="font-bold" style={{ color: C.green }}>+$50</span>
          </div>
          <div className="flex justify-between items-center py-1.5 px-2 rounded" style={{ background: 'rgba(63,163,92,0.06)' }}>
            <span style={{ color: C.text }}>✓ Correct Reject</span>
            <span className="font-bold" style={{ color: C.green }}>+$100 <span className="font-normal text-[10px]">(+$25/field)</span></span>
          </div>
          <div className="flex justify-between items-center py-1.5 px-2 rounded" style={{ background: 'rgba(63,163,92,0.06)' }}>
            <span style={{ color: C.text }}>✓ Correct Freeze</span>
            <span className="font-bold" style={{ color: C.green }}>+$200</span>
          </div>
          <div className="h-px my-1" style={{ background: C.border + '44' }} />
          <div className="flex justify-between items-center py-1.5 px-2 rounded" style={{ background: 'rgba(180,71,63,0.06)' }}>
            <span style={{ color: C.text }}>✗ Wrong Decision</span>
            <span className="font-bold" style={{ color: C.red }}>−$75–150 + Citation</span>
          </div>
          <div className="flex justify-between items-center py-1.5 px-2 rounded" style={{ background: 'rgba(180,71,63,0.06)' }}>
            <span style={{ color: C.text }}>✗ 5 Citations</span>
            <span className="font-bold" style={{ color: C.red }}>Terminated</span>
          </div>
        </div>
      </div>

    </div>
  );
}
