import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FamilyMember } from '@/types/game';
import { formatMoney } from '@/lib/utils';
import calculatorArt from '@assets/image_1775624556009.png';
import flashlightArt from '@assets/image_1775624698996.png';
import ledgerArt from '@assets/image_1775624829058.png';
import familyArt from '@assets/image_1775625265968.png';

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

export type ToolType = 'calculator' | 'uv' | 'ledger' | 'family' | 'flag' | null;

const TOOLS: { id: ToolType; label: string; icon: string; key: string }[] = [
  { id: 'calculator', label: 'Calculator', icon: '🧮', key: '1' },
  { id: 'uv',         label: 'UV Scanner', icon: '🔦', key: '2' },
  { id: 'ledger',     label: 'Ledger',     icon: '💰', key: '3' },
  { id: 'family',     label: 'Family',     icon: '🏠', key: '4' },
  { id: 'flag',       label: 'Flag / Inspect', icon: '🚩', key: '5' },
];

const STATUS_COLOR: Record<string, string> = {
  OK: C.green, HUNGRY: '#d4a017', WEAK: '#c17f24', SICK: C.red, CRITICAL: '#cc2200', DEAD: '#555',
};

const STATUS_LABEL: Record<string, string> = {
  OK: 'HEALTHY', HUNGRY: 'HUNGRY', WEAK: 'WEAK', SICK: 'SICK', CRITICAL: 'CRITICAL', DEAD: 'DEAD',
};

interface ToolkitProps {
  activeTool: ToolType;
  onSetTool: (tool: ToolType) => void;
}

export function InspectorToolbar({ activeTool, onSetTool }: ToolkitProps) {
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
              {tool.id === 'calculator' ? (
                <img src={calculatorArt} alt="Calculator" className="w-8 h-8 object-contain select-none pointer-events-none" draggable={false} />
              ) : tool.id === 'uv' ? (
                <img src={flashlightArt} alt="UV Scanner" className="w-8 h-8 object-contain select-none pointer-events-none" draggable={false} />
              ) : tool.id === 'ledger' ? (
                <img src={ledgerArt} alt="Ledger" className="w-8 h-8 object-contain select-none pointer-events-none" draggable={false} />
              ) : tool.id === 'family' ? (
                <img src={familyArt} alt="Family Monitor" className="w-8 h-8 object-contain select-none pointer-events-none" draggable={false} />
              ) : (
                <span className="text-lg leading-none">{tool.icon}</span>
              )}
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

      <div className="mt-auto" />

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

export function LedgerOverlay({ onClose, money, dailyGoal, dailyEarned }: {
  onClose: () => void; money: number; dailyGoal: number; dailyEarned: number;
}) {
  const goalPct = Math.min(100, Math.max(0, (dailyEarned / dailyGoal) * 100));
  const goalMet = dailyEarned >= dailyGoal;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className="absolute z-40"
      style={{
        right: 70,
        top: 60,
        width: 260,
      }}
    >
      <div
        className="rounded shadow-2xl overflow-hidden"
        style={{
          background: '#0e0a07',
          border: '2px solid #6f4b1f',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3"
             style={{ background: '#0d0906', borderBottom: '2px solid #6f4b1f' }}>
          <span className="font-mono text-sm uppercase tracking-[0.2em] font-bold" style={{ color: '#e0a11b' }}>
            💰 Finance Ledger
          </span>
          <button onClick={onClose} className="text-sm px-1 font-bold hover:opacity-70" style={{ color: '#7a5520' }}>✕</button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.25em] mb-2" style={{ color: '#7a5520' }}>
              Current Funds
            </div>
            <div className="font-mono text-3xl font-bold" style={{ color: C.green }}>
              {formatMoney(money)}
            </div>
          </div>

          <div className="border-t" style={{ borderColor: '#6f4b1f44' }} />

          <div>
            <div className="font-mono text-xs uppercase tracking-[0.25em] mb-2" style={{ color: '#7a5520' }}>
              Daily Goal
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold" style={{ color: goalMet ? C.green : C.accent }}>
                {formatMoney(dailyEarned)}
              </span>
              <span className="font-mono text-lg" style={{ color: '#7a5520' }}>
                / {formatMoney(dailyGoal)}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden mt-3" style={{ background: '#1a1208' }}>
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${goalPct}%`,
                  background: goalMet ? C.green : goalPct > 60 ? C.accent : C.red,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function FamilyMonitorOverlay({ onClose, family }: {
  onClose: () => void; family: FamilyMember[];
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
        top: 60,
        width: 240,
      }}
    >
      <div
        className="rounded shadow-2xl overflow-hidden"
        style={{
          background: '#0e0a07',
          border: '2px solid #6f4b1f',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-3"
             style={{ background: '#0d0906', borderBottom: '2px solid #6f4b1f' }}>
          <span className="font-mono text-sm uppercase tracking-[0.2em] font-bold" style={{ color: '#e0a11b' }}>
            🏠 Family Monitor
          </span>
          <button onClick={onClose} className="text-sm px-1 font-bold hover:opacity-70" style={{ color: '#7a5520' }}>✕</button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-3">
          {family.map(m => {
            const color = STATUS_COLOR[m.status] || C.text;
            const label = STATUS_LABEL[m.status] || m.status;
            const isDead = m.status === 'DEAD';
            return (
              <div
                key={m.id}
                className="flex items-center justify-between px-3 py-2.5 rounded"
                style={{
                  background: isDead ? 'rgba(85,85,85,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isDead ? '#33333355' : color + '33'}`,
                  opacity: isDead ? 0.5 : 1,
                }}
              >
                <span className="font-mono text-base font-bold tracking-wide" style={{ color: isDead ? '#555' : C.text }}>
                  {m.name}
                </span>
                <span className="font-mono text-sm font-bold uppercase tracking-wider" style={{ color }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
