import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Typewriter text ───────────────────────────────────────────────────────────
const INTRO_TEXT = "District 7.  April 15th.  Tax Season begins.";

// ─── Briefing steps ────────────────────────────────────────────────────────────
const BRIEFING_STEPS = [
  {
    label: 'CROSS-REFERENCE',
    body: 'Check the Citizen ID against the W-2 and Form 1040.',
  },
  {
    label: 'LOOK FOR ERRORS',
    body: 'Ensure Names, SSNs, and Wages match across all documents.',
  },
  {
    label: 'DECIDE',
    body: 'Use the buttons at the bottom to Approve, Reject, or Freeze the file.',
  },
];

// ─── Synthetic footstep sound via Web Audio API ────────────────────────────────
function playFootsteps() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Simulate 5 footstep thuds at a walking pace
    const stepTimes = [0, 0.35, 0.7, 1.05, 1.4];

    stepTimes.forEach((t) => {
      // Low-frequency body thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, ctx.currentTime + t);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + t + 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);

      // Higher-frequency click (heel strike)
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      const clickFilter = ctx.createBiquadFilter();

      clickFilter.type = 'highpass';
      clickFilter.frequency.setValueAtTime(800, ctx.currentTime + t);

      click.type = 'triangle';
      click.frequency.setValueAtTime(300, ctx.currentTime + t);

      clickGain.gain.setValueAtTime(0, ctx.currentTime + t);
      clickGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + t + 0.005);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.06);

      click.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(ctx.destination);

      click.start(ctx.currentTime + t);
      click.stop(ctx.currentTime + t + 0.07);
    });

    // Close context after all sounds finish
    setTimeout(() => ctx.close(), 2500);
  } catch {
    // Audio not available — silently skip
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────
interface Props {
  onStart: () => void;
}

type Phase = 'intro' | 'briefing';

export default function IntroSequence({ onStart }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [typedCount, setTypedCount] = useState(0);
  const [textDone, setTextDone] = useState(false);
  const [fading, setFading] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [briefingVisible, setBriefingVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Typewriter effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'intro') return;

    setTypedCount(0);
    setTextDone(false);
    setShowButton(false);

    const delay = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setTypedCount((n) => {
          const next = n + 1;
          if (next >= INTRO_TEXT.length) {
            clearInterval(intervalRef.current!);
            setTextDone(true);
            setTimeout(() => setShowButton(true), 600);
          }
          return next;
        });
      }, 55);
    }, 800); // Small pause before typing starts

    return () => {
      clearTimeout(delay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  // ── Walk to Work ──────────────────────────────────────────────────────────
  const handleWalkToWork = useCallback(() => {
    playFootsteps();
    // Brief pause to let the first footstep sound, then transition
    setTimeout(() => {
      setPhase('briefing');
      setTimeout(() => setBriefingVisible(true), 80);
    }, 300);
  }, []);

  // ── Start Shift ───────────────────────────────────────────────────────────
  const handleStartShift = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      onStart();
    }, 700);
  }, [onStart]);

  return (
    <div className="h-screen w-full overflow-hidden relative">

      {/* ── FADE-TO-BLACK overlay (used on Start Shift) ───────────────────── */}
      <AnimatePresence>
        {fading && (
          <motion.div
            key="fadeout"
            className="absolute inset-0 bg-black z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeIn' }}
          />
        )}
      </AnimatePresence>

      {/* ── INTRO SCENE ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="absolute inset-0 bg-black flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Subtle vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
              }}
            />

            {/* Atmospheric text */}
            <div className="relative z-10 flex flex-col items-center gap-10 px-6 max-w-lg text-center">
              <motion.p
                className="font-mono text-amber-200/90 tracking-widest leading-loose"
                style={{ fontSize: 'clamp(1rem, 2.8vw, 1.4rem)', minHeight: '2.5em' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                {INTRO_TEXT.slice(0, typedCount)}
                {/* Blinking cursor while typing */}
                {!textDone && (
                  <motion.span
                    className="inline-block w-[2px] h-[1.1em] bg-amber-300 ml-0.5 align-middle"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.55, repeat: Infinity, repeatType: 'reverse' }}
                  />
                )}
              </motion.p>

              {/* Walk to Work button */}
              <AnimatePresence>
                {showButton && (
                  <motion.button
                    key="walk-btn"
                    onClick={handleWalkToWork}
                    className="font-mono text-amber-300 border border-amber-300/60 px-8 py-3 uppercase tracking-[0.25em] text-sm hover:bg-amber-300/10 active:bg-amber-300/20 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    whileHover={{ borderColor: 'rgba(217,119,6,0.9)' }}
                  >
                    Walk to Work
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── BRIEFING SCREEN ─────────────────────────────────────────────── */}
        {phase === 'briefing' && (
          <motion.div
            key="briefing"
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: '#1a1208' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Desk texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
              }}
            />

            {/* Clipboard / Government Document */}
            <AnimatePresence>
              {briefingVisible && (
                <motion.div
                  key="clipboard"
                  className="relative z-10 w-full max-w-md mx-4"
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {/* Clipboard clip bar */}
                  <div className="flex justify-center mb-[-1px] relative z-20">
                    <div
                      className="w-20 h-5 rounded-t"
                      style={{ background: '#8B6914', border: '2px solid #5a4008' }}
                    />
                  </div>

                  {/* Document body */}
                  <div
                    className="relative rounded-sm shadow-2xl overflow-hidden"
                    style={{
                      background: '#f5f0e0',
                      border: '2px solid #b8960c',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.3)',
                    }}
                  >
                    {/* Aged paper texture overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(180,140,60,0.4) 22px, rgba(180,140,60,0.4) 23px)',
                      }}
                    />

                    <div className="relative z-10 px-8 py-7">
                      {/* Header */}
                      <div className="text-center border-b-2 border-stone-400 pb-4 mb-5">
                        <p
                          className="font-mono text-[9px] tracking-[0.3em] uppercase text-stone-500 mb-1"
                        >
                          Ministry of Finance — Internal Document
                        </p>
                        <h2
                          className="font-mono font-bold tracking-[0.2em] uppercase text-stone-800"
                          style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}
                        >
                          Clerk Briefing
                        </h2>
                        <p className="font-mono text-[9px] tracking-[0.2em] text-stone-500 mt-1 uppercase">
                          Form MF-7 · Tax Season Orientation
                        </p>
                      </div>

                      {/* Official notice bar */}
                      <div
                        className="bg-stone-800 text-amber-300 font-mono text-[9px] tracking-[0.3em] uppercase px-3 py-1.5 mb-5 text-center"
                      >
                        Read before processing citizens
                      </div>

                      {/* Steps */}
                      <ol className="flex flex-col gap-4 mb-6">
                        {BRIEFING_STEPS.map((step, i) => (
                          <motion.li
                            key={i}
                            className="flex gap-4 items-start"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.18, duration: 0.35 }}
                          >
                            {/* Step number circle */}
                            <div
                              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs text-amber-100"
                              style={{ background: '#5a4008', border: '1.5px solid #8B6914' }}
                            >
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-mono font-bold text-stone-800 text-xs tracking-widest uppercase">
                                {step.label}
                              </p>
                              <p className="font-mono text-stone-600 text-xs mt-0.5 leading-snug">
                                {step.body}
                              </p>
                            </div>
                          </motion.li>
                        ))}
                      </ol>

                      {/* Signature line */}
                      <div className="border-t border-stone-300 pt-3 mb-5 flex justify-between items-end">
                        <div>
                          <div className="w-28 border-b border-stone-400 mb-0.5" />
                          <p className="font-mono text-[8px] text-stone-400 tracking-wider uppercase">
                            Supervisor Signature
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[8px] text-stone-400 tracking-wider uppercase">
                            District 7 Audit Office
                          </p>
                          <p className="font-mono text-[8px] text-stone-400">April 15th</p>
                        </div>
                      </div>

                      {/* Start Shift button */}
                      <motion.button
                        onClick={handleStartShift}
                        className="w-full py-3 font-mono font-bold text-sm tracking-[0.25em] uppercase transition-colors"
                        style={{
                          background: '#2d1f00',
                          color: '#f0c040',
                          border: '2px solid #8B6914',
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.85, duration: 0.4 }}
                        whileHover={{ background: '#3d2a00' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Start Shift
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
