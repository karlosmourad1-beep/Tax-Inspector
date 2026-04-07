import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rulebook } from './Rulebook';
import { MacroEvent, FamilyMember } from '@/types/game';
import { ORDINARY_BRACKETS } from '@/lib/taxBrackets';
import { formatMoney } from '@/lib/utils';

const C = {
  bg:     '#120d0a',
  panel:  '#16110e',
  border: '#6f4b1f',
  accent: '#e0a11b',
  muted:  '#7a5520',
  green:  '#3fa35c',
  red:    '#b4473f',
  text:   '#f3dfb2',
};

export type ToolType = 'calculator' | 'uv' | 'ledger' | 'rulebook' | null;

const TOOLS: { id: ToolType; label: string; icon: string; key: string }[] = [
  { id: 'calculator', label: 'Calculator', icon: '🧮', key: '1' },
  { id: 'uv',         label: 'UV Scanner', icon: '🔦', key: '2' },
  { id: 'ledger',     label: 'Ledger',     icon: '📒', key: '3' },
  { id: 'rulebook',   label: 'Rulebook',   icon: '📋', key: '4' },
];

const VALID_EMPLOYERS = [
  'Initech', 'Umbrella Corp', 'Massive Dynamic', 'Soylent',
  'Globex', 'Stark Ind.', 'Cyberdyne', 'Omni Consumer',
  'NovaCorp', 'Helix Ventures', 'TriCorp', 'Arclight Media',
];

const STATUS_DOT: Record<string, string> = {
  OK: C.green, HUNGRY: '#d4a017', WEAK: '#c17f24', SICK: C.red, CRITICAL: '#cc2200', DEAD: '#555',
};

interface ToolkitProps {
  activeTool: ToolType;
  onSetTool: (tool: ToolType) => void;
  day: number;
  activeEvent: MacroEvent | null;
  dailyGoal: number;
  dailyEarned: number;
  money: number;
  family: FamilyMember[];
}

export function InspectorToolbar({ activeTool, onSetTool, money, family, dailyGoal, dailyEarned }: ToolkitProps) {
  const progressPct = Math.min(100, Math.max(0, (dailyEarned / dailyGoal) * 100));
  return (
    <div
      className="w-14 shrink-0 flex flex-col items-center border-l relative"
      style={{
        background: 'linear-gradient(180deg, #1a1208 0%, #110c08 100%)',
        borderColor: C.border,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(180deg, transparent 0px, transparent 18px, rgba(111,75,31,0.15) 18px, rgba(111,75,31,0.15) 19px)',
        }}
      />

      <div className="font-terminal text-[7px] uppercase tracking-widest text-center py-2 px-1 border-b w-full"
           style={{ color: C.muted, borderColor: C.border + '55' }}>
        Tools
      </div>

      <div className="flex flex-col gap-1.5 py-3 relative z-10">
        {TOOLS.map((tool, idx) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSetTool(isActive ? null : tool.id)}
              className="relative w-10 h-10 flex items-center justify-center rounded transition-all"
              style={{
                background: isActive ? 'rgba(224,161,27,0.2)' : 'rgba(255,255,255,0.03)',
                border: isActive ? '2px solid #e0a11b' : '1px solid rgba(111,75,31,0.4)',
                boxShadow: isActive ? '0 0 12px rgba(224,161,27,0.25)' : 'none',
              }}
              title={`${tool.label} [${tool.key}]`}
            >
              <span className="text-lg leading-none">{tool.icon}</span>
              <span
                className="absolute -top-1 -left-1 w-4 h-4 flex items-center justify-center font-terminal text-[8px] font-bold rounded-full"
                style={{
                  background: isActive ? C.accent : '#2a1a0a',
                  color: isActive ? '#1a1008' : C.muted,
                  border: `1px solid ${isActive ? C.accent : C.border + '66'}`,
                }}
              >
                {idx + 1}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto w-full flex flex-col">
        <div className="w-full border-t py-1.5 px-1" style={{ borderColor: C.border + '55' }}>
          <div className="font-terminal text-[7px] uppercase tracking-wider text-center mb-1" style={{ color: C.muted }}>
            Family
          </div>
          <div className="flex flex-col items-center gap-0.5">
            {family.map(m => (
              <div key={m.id} className="flex items-center gap-1" title={`${m.name}: ${m.status}`}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[m.status] }} />
                <span className="font-terminal text-[7px]" style={{ color: m.status === 'DEAD' ? '#555' : C.text }}>
                  {m.name.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full border-t py-1.5 px-1" style={{ borderColor: C.border + '55' }}>
          <div className="font-terminal text-[7px] uppercase tracking-wider text-center" style={{ color: C.muted }}>
            Goal
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mx-1 my-1" style={{ background: '#090604' }}>
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${progressPct}%`,
                background: progressPct >= 100 ? C.green : progressPct > 60 ? C.accent : C.red,
              }}
            />
          </div>
        </div>

        <div className="w-full border-t py-2 px-1" style={{ borderColor: C.border + '55' }}>
          <div className="font-terminal text-[7px] uppercase tracking-wider text-center" style={{ color: C.muted }}>
            Funds
          </div>
          <div className="font-terminal text-xs font-bold text-center mt-0.5" style={{ color: C.green }}>
            {formatMoney(money)}
          </div>
        </div>
      </div>

      {activeTool && (
        <button
          onClick={() => onSetTool(null)}
          className="w-full py-2 font-terminal text-[7px] uppercase tracking-wider border-t transition-colors hover:bg-amber-900/20"
          style={{ color: C.accent, borderColor: C.border + '55' }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}

export function CalculatorOverlay({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [freshInput, setFreshInput] = useState(true);
  const dragRef = useRef<HTMLDivElement>(null);

  const pressDigit = useCallback((d: string) => {
    setDisplay(prev => {
      if (freshInput || prev === '0') {
        setFreshInput(false);
        return d;
      }
      if (prev.length >= 12) return prev;
      return prev + d;
    });
  }, [freshInput]);

  const pressOperator = useCallback((op: string) => {
    const current = parseFloat(display);
    if (prevValue !== null && operator && !freshInput) {
      let result = prevValue;
      if (operator === '+') result = prevValue + current;
      if (operator === '-') result = prevValue - current;
      if (operator === '×') result = prevValue * current;
      if (operator === '÷') {
        if (current === 0) { setDisplay('ERR'); setPrevValue(null); setOperator(null); setFreshInput(true); return; }
        result = prevValue / current;
      }
      result = Math.round(result * 100) / 100;
      setDisplay(String(result));
      setPrevValue(result);
    } else {
      setPrevValue(current);
    }
    setOperator(op);
    setFreshInput(true);
  }, [display, prevValue, operator, freshInput]);

  const pressEquals = useCallback(() => {
    if (prevValue === null || !operator) return;
    const current = parseFloat(display);
    let result = prevValue;
    if (operator === '+') result = prevValue + current;
    if (operator === '-') result = prevValue - current;
    if (operator === '×') result = prevValue * current;
    if (operator === '÷') {
      if (current === 0) { setDisplay('ERR'); setPrevValue(null); setOperator(null); setFreshInput(true); return; }
      result = prevValue / current;
    }
    result = Math.round(result * 100) / 100;
    setDisplay(String(result));
    setPrevValue(null);
    setOperator(null);
    setFreshInput(true);
  }, [display, prevValue, operator]);

  const pressClear = useCallback(() => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setFreshInput(true);
  }, []);

  const KEYS = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['C', '0', '=', '+'],
  ];

  const handleKey = (k: string) => {
    if (k >= '0' && k <= '9') pressDigit(k);
    else if (['+', '-', '×', '÷'].includes(k)) pressOperator(k);
    else if (k === '=') pressEquals();
    else if (k === 'C') pressClear();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') pressDigit(e.key);
      else if (e.key === '+') pressOperator('+');
      else if (e.key === '-') pressOperator('-');
      else if (e.key === '*') pressOperator('×');
      else if (e.key === '/') { e.preventDefault(); pressOperator('÷'); }
      else if (e.key === 'Enter' || e.key === '=') pressEquals();
      else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') pressClear();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pressDigit, pressOperator, pressEquals, pressClear]);

  return (
    <motion.div
      ref={dragRef}
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="absolute z-40 select-none"
      style={{
        right: 80,
        top: 80,
        width: 200,
        cursor: 'grab',
      }}
    >
      <div
        className="rounded shadow-2xl overflow-hidden"
        style={{
          background: '#1a1510',
          border: '2px solid #4a3510',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center justify-between px-2 py-1 cursor-grab"
             style={{ background: '#2a1a08', borderBottom: '1px solid #4a3510' }}>
          <span className="font-terminal text-[8px] uppercase tracking-widest" style={{ color: C.muted }}>
            Ministry Calc
          </span>
          <button onClick={onClose} className="text-xs px-1 hover:opacity-70" style={{ color: C.muted }}>✕</button>
        </div>

        <div className="px-2 py-2">
          <div
            className="text-right font-mono text-xl px-3 py-2 mb-2 rounded"
            style={{
              background: '#0a2a0a',
              color: '#40ff40',
              border: '1px solid #1a3a1a',
              textShadow: '0 0 8px rgba(64,255,64,0.3)',
              minHeight: 40,
              lineHeight: '28px',
              overflow: 'hidden',
            }}
          >
            {display}
            {operator && (
              <span className="text-xs ml-1 opacity-50">{operator}</span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1">
            {KEYS.flat().map((k) => {
              const isOp = ['+', '-', '×', '÷'].includes(k);
              const isEq = k === '=';
              const isClear = k === 'C';
              return (
                <button
                  key={k}
                  onClick={(e) => { e.stopPropagation(); handleKey(k); }}
                  className="py-2 rounded font-mono text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: isEq ? '#3a6a20' : isClear ? '#6a2a20' : isOp ? '#3a2a10' : '#2a2018',
                    color: isEq ? '#a0ff80' : isClear ? '#ff9080' : isOp ? C.accent : C.text,
                    border: `1px solid ${isOp ? '#5a3a10' : '#3a2818'}`,
                  }}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function UVScannerOverlay() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-30"
      style={{
        left: pos.x - 60,
        top: pos.y - 60,
        width: 120,
        height: 120,
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(120,80,255,0.15) 0%, rgba(120,80,255,0.08) 40%, transparent 70%)',
          border: '2px solid rgba(120,80,255,0.25)',
          boxShadow: '0 0 30px rgba(120,80,255,0.2), inset 0 0 20px rgba(120,80,255,0.1)',
        }}
      />
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(180,140,255,0.06) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}

export function LedgerOverlay({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'brackets' | 'employers' | 'rules'>('brackets');

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className="absolute z-40"
      style={{
        right: 70,
        top: 20,
        bottom: 20,
        width: 280,
      }}
    >
      <div
        className="h-full rounded shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: '#f5f0e0',
          border: '2px solid #b8960c',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-center justify-between px-3 py-2"
             style={{ background: '#3a2a10', borderBottom: '2px solid #b8960c' }}>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color: '#f0c040' }}>
            Reference Ledger
          </span>
          <button onClick={onClose} className="text-xs px-1 font-bold" style={{ color: '#f0c040' }}>✕</button>
        </div>

        <div className="flex border-b" style={{ borderColor: '#b8960c55' }}>
          {(['brackets', 'employers', 'rules'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-1.5 font-mono text-[8px] uppercase tracking-wider font-bold transition-colors"
              style={{
                background: tab === t ? '#e8dcc0' : '#f5f0e0',
                color: tab === t ? '#3a2a10' : '#8a7050',
                borderBottom: tab === t ? '2px solid #8B6914' : '2px solid transparent',
              }}
            >
              {t === 'brackets' ? 'Tax Rates' : t === 'employers' ? 'Employers' : 'Rules'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {tab === 'brackets' && (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Ordinary Income Tax Brackets
              </p>
              {ORDINARY_BRACKETS.map((b, i) => (
                <div key={i} className="flex justify-between items-center font-mono text-[10px] px-2 py-1.5 rounded"
                     style={{ background: '#ebe5d0', border: '1px solid #d0c8a0' }}>
                  <span className="text-stone-700">
                    {formatMoney(b.from)} – {b.to === Infinity ? '∞' : formatMoney(b.to)}
                  </span>
                  <span className="font-bold text-stone-800">{(b.rate * 100).toFixed(0)}%</span>
                </div>
              ))}

              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-600 mt-3 mb-1">
                Capital Gains (Long-Term)
              </p>
              {[
                { range: 'Under $44,000', rate: '0%' },
                { range: '$44,000 – $492,000', rate: '15%' },
                { range: 'Over $492,000', rate: '20%' },
              ].map((r, i) => (
                <div key={i} className="flex justify-between items-center font-mono text-[10px] px-2 py-1.5 rounded"
                     style={{ background: '#ebe5d0', border: '1px solid #d0c8a0' }}>
                  <span className="text-stone-700">{r.range}</span>
                  <span className="font-bold text-stone-800">{r.rate}</span>
                </div>
              ))}

              <p className="font-mono text-[8px] text-stone-500 mt-2 leading-snug italic">
                Formula: Gross Income − Deductions = Taxable Income.
                Apply brackets progressively.
              </p>
            </div>
          )}

          {tab === 'employers' && (
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-600 mb-2">
                Registered Employer Registry
              </p>
              {VALID_EMPLOYERS.map((emp, i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-[10px] px-2 py-1.5 rounded"
                     style={{ background: i % 2 === 0 ? '#ebe5d0' : '#f5f0e0' }}>
                  <span className="text-stone-400 text-[8px] w-4">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-stone-800">{emp}</span>
                </div>
              ))}
              <p className="font-mono text-[8px] text-stone-500 mt-2 leading-snug italic">
                Any employer not on this list may warrant investigation.
              </p>
            </div>
          )}

          {tab === 'rules' && (
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Verification Checklist
              </p>
              {[
                { check: 'Name Match', detail: 'Same name on ID, W-2, and 1040' },
                { check: 'SSN Match', detail: 'ID SSN must match 1040 SSN' },
                { check: 'Income Match', detail: 'W-2 Wages = 1040 Gross Income' },
                { check: 'Deductions', detail: 'Expense Total = 1040 Deductions' },
                { check: 'Math Check', detail: 'Gross − Deductions = Taxable' },
                { check: 'Tax Calc', detail: 'Apply brackets to Taxable Income' },
              ].map((r, i) => (
                <div key={i} className="px-2 py-1.5 rounded" style={{ background: '#ebe5d0', border: '1px solid #d0c8a0' }}>
                  <p className="font-mono text-[10px] font-bold text-stone-800">{r.check}</p>
                  <p className="font-mono text-[9px] text-stone-600">{r.detail}</p>
                </div>
              ))}

              <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-stone-600 mt-3 mb-1">
                Decision Guide
              </p>
              <div className="flex flex-col gap-1">
                <div className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: '#d0e8d0', color: '#2a5a2a' }}>
                  ✓ All docs match → <strong>APPROVE</strong>
                </div>
                <div className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: '#e8d0d0', color: '#5a2a2a' }}>
                  ✗ Mismatch found → <strong>REJECT</strong>
                </div>
                <div className="font-mono text-[10px] px-2 py-1 rounded" style={{ background: '#d0d8e8', color: '#2a3a5a' }}>
                  ⚠ Fraud/Contraband → <strong>FREEZE</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function RulebookOverlay({ onClose, day, activeEvent, dailyGoal, dailyEarned }: {
  onClose: () => void;
  day: number;
  activeEvent: MacroEvent | null;
  dailyGoal: number;
  dailyEarned: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className="absolute z-40"
      style={{
        right: 70,
        top: 20,
        bottom: 20,
        width: 300,
      }}
    >
      <div
        className="h-full rounded shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: C.panel,
          border: `2px solid ${C.border}`,
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-center justify-between px-3 py-2"
             style={{ background: '#0d0906', borderBottom: `1px solid ${C.border}` }}>
          <span className="font-terminal text-[9px] uppercase tracking-[0.25em] font-bold" style={{ color: C.accent }}>
            Day {day} Rulebook
          </span>
          <button onClick={onClose} className="text-xs px-1 font-bold" style={{ color: C.muted }}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Rulebook day={day} activeEvent={activeEvent} dailyGoal={dailyGoal} dailyEarned={dailyEarned} />
        </div>
      </div>
    </motion.div>
  );
}
