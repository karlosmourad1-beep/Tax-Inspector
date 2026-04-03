import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { Play } from 'lucide-react';

const BOOT_LINES = [
  { text: 'MINISTRY OF FINANCE — SECURE TERMINAL v4.2.1', delay: 0 },
  { text: 'Initializing audit subsystem...', delay: 180 },
  { text: 'Loading tax code database............. [OK]', delay: 280 },
  { text: 'Validating clerk credentials........... [OK]', delay: 260 },
  { text: 'Connecting to filing registry.......... [OK]', delay: 320 },
  { text: 'Scanning case queue...', delay: 200 },
  { text: '  WARNING: 28 unprocessed citizen filings pending.', delay: 400 },
  { text: '  WARNING: Fraud detection module active.', delay: 200 },
  { text: 'ACCESS GRANTED — AUDIT CLEARANCE LEVEL 3', delay: 500 },
  { text: '────────────────────────────────────────────', delay: 100 },
  { text: 'SYSTEM READY. Good luck, Clerk.', delay: 300 },
];

const BRIEF_ITEMS = [
  'Inspect submitted documents for discrepancies.',
  'Approve correct filings to earn your wage.',
  'Reject fraudulent filings for an accuracy bonus.',
  'Flag suspicious fields — circled evidence earns more.',
  '5 Citations = Immediate Termination.',
];

export default function MainMenu({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { startGame } = engine;
  const [visibleLines, setVisibleLines] = useState(0);
  const [phase, setPhase] = useState<'boot' | 'menu'>('boot');
  const [blink, setBlink] = useState(true);

  // Boot sequence — reveal lines one at a time
  useEffect(() => {
    if (phase !== 'boot') return;
    if (visibleLines >= BOOT_LINES.length) {
      const t = setTimeout(() => setPhase('menu'), 700);
      return () => clearTimeout(t);
    }
    const delay = BOOT_LINES[visibleLines]?.delay ?? 200;
    const t = setTimeout(() => setVisibleLines(n => n + 1), delay);
    return () => clearTimeout(t);
  }, [visibleLines, phase]);

  // Blinking cursor
  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 530);
    return () => clearInterval(t);
  }, []);

  const isWarning = (text: string) => text.includes('WARNING');
  const isOk = (text: string) => text.includes('[OK]');
  const isHeader = (text: string) => text.startsWith('MINISTRY') || text.startsWith('ACCESS') || text.startsWith('SYSTEM');

  return (
    <div className="h-screen w-full bg-desk-dark flex items-center justify-center crt-overlay desk-texture-bg overflow-hidden relative">
      {/* Ambient scanline sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
        }}
      />
      <motion.div
        className="absolute left-0 right-0 h-16 pointer-events-none z-0"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(245,158,11,0.04), transparent)' }}
        animate={{ y: ['-10%', '110%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />

      <AnimatePresence mode="wait">

        {/* ── BOOT SEQUENCE ───────────────────────────────────────────────── */}
        {phase === 'boot' && (
          <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl px-8 font-terminal text-sm leading-relaxed z-10"
          >
            {/* Blinking header bar */}
            <div className="border border-amber-500/60 bg-amber-500/10 px-4 py-2 mb-4 flex items-center gap-3">
              <motion.div
                className="w-2 h-2 rounded-full bg-amber-400"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-amber-400 uppercase tracking-widest text-xs">Ministry Terminal — Secure Channel</span>
            </div>

            {/* Boot lines */}
            <div className="flex flex-col gap-0.5">
              {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className={
                    isWarning(line.text)
                      ? 'text-orange-400'
                      : isOk(line.text)
                        ? 'text-green-400'
                        : isHeader(line.text)
                          ? 'text-amber-300 font-bold'
                          : 'text-amber-600/80'
                  }
                >
                  {line.text}
                </motion.div>
              ))}
              {/* Cursor */}
              {visibleLines < BOOT_LINES.length && (
                <span className={`text-amber-400 ${blink ? 'opacity-100' : 'opacity-0'}`}>█</span>
              )}
            </div>
          </motion.div>
        )}

        {/* ── MAIN MENU ───────────────────────────────────────────────────── */}
        {phase === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-xl z-10 px-4 flex flex-col items-center gap-0"
          >
            {/* Animated seal / logo */}
            <motion.div
              className="relative mb-4"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.1 }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.img
                src={`${import.meta.env.BASE_URL}images/seal.png`}
                alt="Ministry Seal"
                className="w-24 h-24 opacity-90 mix-blend-screen relative z-10"
                animate={{ rotate: [0, 2, -2, 0], filter: ['brightness(0.9)', 'brightness(1.1)', 'brightness(0.9)'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-stamped text-amber-500 tracking-widest text-center"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1.1 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <motion.span
                animate={{ textShadow: ['0 0 8px rgba(245,158,11,0.3)', '0 0 24px rgba(245,158,11,0.8)', '0 0 8px rgba(245,158,11,0.3)'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                TAXES PLEASE
              </motion.span>
            </motion.h1>

            <motion.p
              className="font-terminal text-amber-700 uppercase tracking-[0.3em] text-sm mt-1 mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              Glory to the Tax Code
            </motion.p>

            {/* Briefing block */}
            <motion.div
              className="w-full bg-black/40 border border-amber-700/40 px-5 py-4 mb-5 relative overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/80" />
              <p className="font-terminal text-xs mb-3 pl-2">
                <strong className="text-white text-sm">ATTENTION CLERK:</strong>
                <span className="text-amber-400/80"> You have been assigned to audit incoming citizen tax declarations.</span>
              </p>
              <ul className="flex flex-col gap-1.5 pl-2">
                {BRIEF_ITEMS.map((item, i) => (
                  <motion.li
                    key={i}
                    className="font-terminal text-xs text-amber-600/80 flex items-start gap-2"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.07, duration: 0.25 }}
                  >
                    <span className="text-amber-500 shrink-0 mt-0.5">›</span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Begin button */}
            <motion.button
              onClick={startGame}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-desk-dark font-bold text-xl uppercase tracking-widest flex items-center justify-center gap-3 transition-colors relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{ boxShadow: '0 0 24px rgba(245,158,11,0.35)' }}
            >
              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
              />
              <Play className="w-5 h-5 fill-current relative z-10" />
              <span className="relative z-10">BEGIN SHIFT</span>
            </motion.button>

            {/* Day counter hint */}
            <motion.p
              className="font-terminal text-[10px] text-amber-800/60 uppercase tracking-widest mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              7 Days · 4 Citizens / Day · 5 Errors = Terminated
            </motion.p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
