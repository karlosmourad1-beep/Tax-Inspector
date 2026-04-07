import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INTRO_TEXT = "District 7.  April 15th.  Tax Season begins.";

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

function getOrResumeAudioCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext | null {
  try {
    if (!ref.current) {
      ref.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ref.current.state === 'suspended') {
      ref.current.resume();
    }
    return ref.current;
  } catch {
    return null;
  }
}

function playTypewriterClick(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3200, now);
  filter.Q.setValueAtTime(2, now);

  osc.type = 'square';
  osc.frequency.setValueAtTime(1800 + Math.random() * 800, now);

  gain.gain.setValueAtTime(0.12 + Math.random() * 0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.03);
}

function playFootsteps(ctx: AudioContext) {
  const now = ctx.currentTime;
  const stepTimes = [0, 0.42, 0.84, 1.26, 1.68, 2.1];

  stepTimes.forEach((t, idx) => {
    const bufferSize = 2400;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350 + (idx % 2) * 80, now + t);

    const gain = ctx.createGain();
    const vol = 0.25 + (idx % 2) * 0.08;
    gain.gain.setValueAtTime(0, now + t);
    gain.gain.linearRampToValueAtTime(vol, now + t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.14);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now + t);
    source.stop(now + t + 0.15);
  });
}

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
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const unlockAudio = () => {
      getOrResumeAudioCtx(audioCtxRef);
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'intro') return;

    setTypedCount(0);
    setTextDone(false);
    setShowButton(false);

    const delay = setTimeout(() => {
      getOrResumeAudioCtx(audioCtxRef);

      intervalRef.current = setInterval(() => {
        setTypedCount((n) => {
          const next = n + 1;
          if (next >= INTRO_TEXT.length) {
            clearInterval(intervalRef.current!);
            setTextDone(true);
            setTimeout(() => setShowButton(true), 600);
          }
          const char = INTRO_TEXT[n];
          if (char && char !== ' ') {
            const ctx = getOrResumeAudioCtx(audioCtxRef);
            if (ctx && ctx.state === 'running') {
              playTypewriterClick(ctx);
            }
          }
          return next;
        });
      }, 60);
    }, 800);

    return () => {
      clearTimeout(delay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const handleWalkToWork = useCallback(() => {
    const ctx = getOrResumeAudioCtx(audioCtxRef);
    if (ctx) playFootsteps(ctx);

    setTimeout(() => {
      setPhase('briefing');
      setTimeout(() => setBriefingVisible(true), 80);
    }, 600);
  }, []);

  const handleStartShift = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      onStart();
    }, 700);
  }, [onStart]);

  return (
    <div className="h-screen w-full overflow-hidden relative">

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

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            className="absolute inset-0 bg-black flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-10 px-6 max-w-lg text-center">
              <motion.p
                className="font-mono text-amber-200/90 tracking-widest leading-loose"
                style={{ fontSize: 'clamp(1rem, 2.8vw, 1.4rem)', minHeight: '2.5em' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                {INTRO_TEXT.slice(0, typedCount)}
                {!textDone && (
                  <motion.span
                    className="inline-block w-[2px] h-[1.1em] bg-amber-300 ml-0.5 align-middle"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.55, repeat: Infinity, repeatType: 'reverse' }}
                  />
                )}
              </motion.p>

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

        {phase === 'briefing' && (
          <motion.div
            key="briefing"
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: '#1a1208' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
              }}
            />

            <AnimatePresence>
              {briefingVisible && (
                <motion.div
                  key="clipboard"
                  className="relative z-10 w-full max-w-md mx-4"
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <div className="flex justify-center mb-[-1px] relative z-20">
                    <div
                      className="w-20 h-5 rounded-t"
                      style={{ background: '#8B6914', border: '2px solid #5a4008' }}
                    />
                  </div>

                  <div
                    className="relative rounded-sm shadow-2xl overflow-hidden"
                    style={{
                      background: '#f5f0e0',
                      border: '2px solid #b8960c',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.3)',
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(180,140,60,0.4) 22px, rgba(180,140,60,0.4) 23px)',
                      }}
                    />

                    <div className="relative z-10 px-8 py-7">
                      <div className="text-center border-b-2 border-stone-400 pb-4 mb-5">
                        <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-stone-500 mb-1">
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

                      <div className="bg-stone-800 text-amber-300 font-mono text-[9px] tracking-[0.3em] uppercase px-3 py-1.5 mb-5 text-center">
                        Read before processing citizens
                      </div>

                      <ol className="flex flex-col gap-4 mb-6">
                        {BRIEFING_STEPS.map((step, i) => (
                          <motion.li
                            key={i}
                            className="flex gap-4 items-start"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.18, duration: 0.35 }}
                          >
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
