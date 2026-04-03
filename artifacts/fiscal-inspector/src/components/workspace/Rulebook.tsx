import { MacroEvent } from '@/types/game';
import { formatMoney } from '@/lib/utils';

const RULES: { d: number; label: string; detail: string; color: string }[] = [
  { d: 1, label: 'NAME MATCH',   detail: 'Same name on all docs',         color: '#f3dfb2' },
  { d: 1, label: 'SSN MATCH',    detail: 'ID ↔ 1040 must match',          color: '#f3dfb2' },
  { d: 2, label: 'INCOME MATCH', detail: 'W-2 Wages = 1040 Gross Income', color: '#f3dfb2' },
  { d: 3, label: 'DEDUCTIONS',   detail: 'Expense Total = 1040 Deductions',color: '#f3dfb2' },
  { d: 4, label: 'MATH CHECK',   detail: 'Gross − Deductions = Taxable',   color: '#f3dfb2' },
  { d: 5, label: 'SCHEDULE D',   detail: 'Short-term: ordinary rate. Long-term: preferential.', color: '#f3dfb2' },
];

const EVENT_COLOR: Record<string, string> = {
  market_shock:   '#e05a52',
  hyperinflation: '#e09020',
  audit_sweep:    '#e0a11b',
  banking_crisis: '#6aabf0',
};

const C = {
  border: '#6f4b1f',
  accent: '#e0a11b',
  muted:  '#9a7040',
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
  const goalProgress = Math.min(1, Math.max(0, dailyEarned) / dailyGoal);
  const goalMet = dailyEarned >= dailyGoal;
  const shortfall = dailyGoal - dailyEarned;
  const ec = activeEvent ? (EVENT_COLOR[activeEvent.type] || C.accent) : C.accent;

  return (
    <div className="flex flex-col gap-0 divide-y divide-amber-900/25" style={{ color: C.text }}>

      {/* ── Shift Target ──────────────────────────────────────────────── */}
      <div className="px-5 py-5">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>
          Shift Target
        </div>
        <div className="flex items-end justify-between mb-3">
          <div className="text-3xl font-bold leading-none" style={{ color: goalMet ? C.green : C.text }}>
            {formatMoney(Math.max(0, dailyEarned))}
          </div>
          <div className="text-sm text-right" style={{ color: C.muted }}>
            / {formatMoney(dailyGoal)}
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: '#2a1a10' }}>
          <div className="h-full rounded-full transition-all duration-500"
               style={{ width: `${goalProgress * 100}%`, background: goalMet ? C.green : goalProgress > 0.6 ? C.accent : C.red }} />
        </div>
        {goalMet
          ? <div className="text-sm font-bold" style={{ color: C.green }}>✓ Target met</div>
          : <div className="text-sm" style={{ color: C.red }}>{formatMoney(shortfall)} to go</div>
        }
      </div>

      {/* ── Active Event ─────────────────────────────────────────────── */}
      {activeEvent && (
        <div className="px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>
            Today's Event
          </div>
          <div className="px-3 py-3 rounded border text-sm font-bold leading-snug"
               style={{ borderColor: ec + '55', background: ec + '12', color: ec }}>
            {activeEvent.title}
          </div>
        </div>
      )}

      {/* ── Checks ──────────────────────────────────────────────────── */}
      <div className="px-5 py-5">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>
          Checks
        </div>
        <div className="flex flex-col gap-2">
          {activeRules.map((rule, i) => {
            const isCurrent = rule.d === day;
            return (
              <div key={i} className="flex items-start gap-3 px-3 py-3 rounded border"
                   style={{
                     borderColor: isCurrent ? C.accent + '88' : C.border + '33',
                     background: isCurrent ? 'rgba(224,161,27,0.07)' : 'rgba(0,0,0,0.15)',
                   }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                     style={{ background: isCurrent ? C.accent : C.muted }} />
                <div>
                  <div className="text-sm font-bold leading-none mb-1"
                       style={{ color: isCurrent ? C.accent : C.text }}>
                    {rule.label}
                  </div>
                  <div className="text-xs leading-snug" style={{ color: C.muted }}>
                    {rule.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Payout ──────────────────────────────────────────────────── */}
      <div className="px-5 py-5">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.muted }}>
          Payout
        </div>
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Correct Approve', val: '+$50',       clr: C.green },
            { label: 'Correct Reject',  val: '+$100+',     clr: C.green },
            { label: 'Correct Freeze',  val: '+$200',      clr: '#7ab0f0' },
            { label: 'Wrong decision',  val: '−$75–150',   clr: C.red },
            { label: '5 citations',     val: 'Terminated', clr: C.red },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center px-3 py-2 rounded"
                 style={{ background: 'rgba(0,0,0,0.18)' }}>
              <span className="text-sm" style={{ color: C.text }}>{row.label}</span>
              <span className="text-sm font-bold" style={{ color: row.clr }}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
