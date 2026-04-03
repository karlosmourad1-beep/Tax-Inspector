import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { DAILY_EVENTS } from '@/lib/narrative';

const EVENT_COLORS: Record<string, { text: string; bg: string; title: string }> = {
  market_shock:   { text: '#ff6b6b', bg: 'rgba(255,107,107,0.08)', title: 'MARKET CRASH' },
  hyperinflation: { text: '#ffa500', bg: 'rgba(255,165,0,0.08)', title: 'HYPERINFLATION' },
  audit_sweep:    { text: '#ffd700', bg: 'rgba(255,215,0,0.08)', title: 'AUDIT SWEEP' },
};

export default function DayStartScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, startDay } = engine;
  const event = DAILY_EVENTS[state.day];
  const colors = (event && EVENT_COLORS[event.type]) ?? { text: '#e0a11b', bg: 'rgba(224,161,27,0.08)', title: 'DAY START' };

  const [phase, setPhase] = useState<'newspaper' | 'day-screen'>('newspaper');

  useEffect(() => {
    if (phase === 'newspaper') {
      const timer = setTimeout(() => setPhase('day-screen'), 2800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  return (
    <div
      className="h-screen w-full flex items-center justify-center"
      style={{ background: '#120d0a', color: '#f3dfb2' }}
    >
      {/* Newspaper cutscene */}
      {phase === 'newspaper' && (
        <motion.div
          initial={{ rotateZ: -35, opacity: 0, x: -200, y: 100 }}
          animate={{ rotateZ: 0, opacity: 1, x: 0, y: 0 }}
          exit={{ rotateZ: 15, opacity: 0, x: 200, y: -100 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="flex flex-col items-center gap-2"
        >
          {/* Newspaper background */}
          <div
            className="w-96 px-10 py-8 shadow-2xl border-4"
            style={{
              background: '#e8dcc8',
              borderColor: '#8b7355',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Newspaper header */}
            <div className="border-b-4 border-black pb-3 mb-5 text-center">
              <div className="font-serif text-xs tracking-[0.4em] font-black text-black uppercase">
                Ministry Times
              </div>
              <div className="font-serif text-xs text-black mt-0.5">Est. 1994</div>
            </div>

            {/* Headline */}
            <motion.h1
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="font-serif text-5xl font-black leading-tight text-center"
              style={{ color: colors.text }}
            >
              {colors.title}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="font-serif text-sm text-black text-center mt-3"
            >
              {event?.title}
            </motion.p>
          </div>
        </motion.div>
      )}

      {/* Day screen */}
      {phase === 'day-screen' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-8 max-w-2xl text-center"
        >
          {/* Day number */}
          <div className="flex flex-col gap -1">
            <div
              className="font-terminal text-sm uppercase tracking-[0.5em] font-bold"
              style={{ color: colors.text }}
            >
              DAY {state.day}
            </div>
          </div>

          {/* Event details — only 3 lines max */}
          {event && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-3 px-8 py-6 border-2"
              style={{
                borderColor: colors.text + '55',
                background: colors.bg,
              }}
            >
              <div className="font-stamped text-5xl uppercase" style={{ color: colors.text }}>
                {colors.title}
              </div>

              {/* Event impact — simple, bold */}
              {event.wageMultiplier !== 1.0 && (
                <div className="font-terminal text-lg font-bold uppercase tracking-wider" style={{ color: '#f3dfb2' }}>
                  {event.wageMultiplier < 1 ? '📉' : '📈'} Wages {Math.round(Math.abs((event.wageMultiplier - 1) * 100))}%
                </div>
              )}
            </motion.div>
          )}

          {/* Start button */}
          <motion.button
            onClick={startDay}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="py-5 px-12 font-terminal text-base font-bold uppercase tracking-[0.3em] border-2 transition-all"
            style={{
              borderColor: colors.text,
              background: colors.bg,
              color: colors.text,
            }}
            onMouseOver={e => {
              (e.currentTarget as any).style.background = colors.bg.replace('0.08', '0.16');
            }}
            onMouseOut={e => {
              (e.currentTarget as any).style.background = colors.bg;
            }}
          >
            Start Shift →
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
