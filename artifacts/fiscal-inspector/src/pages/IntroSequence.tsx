import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INTRO_TEXT = "District 7.  April 15th.  Tax Season begins.";

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

function playPageTurn(ctx: AudioContext) {
  const now = ctx.currentTime;
  const bufferSize = 3200;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(800, now);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.15);
}

interface HandbookPage {
  title: string;
  icon: string;
  lines: string[];
  diagram?: React.ReactNode;
}

const HANDBOOK_PAGES: HandbookPage[] = [
  {
    title: 'VERIFICATION',
    icon: '🔍',
    lines: [
      'Match NAME on all docs',
      'Match SSN: ID ↔ 1040',
      'Mismatch → REJECT',
    ],
    diagram: (
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="border-2 border-amber-600 rounded px-4 py-2 font-mono text-sm text-amber-200 text-center">
          <div className="text-[10px] text-amber-400/60 uppercase tracking-widest mb-1">Citizen ID</div>
          <div>John Doe</div>
          <div className="text-xs text-amber-400/50">SSN: 123-45-6789</div>
        </div>
        <div className="text-2xl text-amber-400">⟷</div>
        <div className="border-2 border-amber-600 rounded px-4 py-2 font-mono text-sm text-amber-200 text-center">
          <div className="text-[10px] text-amber-400/60 uppercase tracking-widest mb-1">Form 1040</div>
          <div>John Doe</div>
          <div className="text-xs text-amber-400/50">SSN: 123-45-6789</div>
        </div>
      </div>
    ),
  },
  {
    title: 'MATH CHECK',
    icon: '🧮',
    lines: [
      'Gross Income − Deductions',
      '= Taxable Income',
      'Numbers must add up',
    ],
    diagram: (
      <div className="flex flex-col items-center gap-1 mt-2 font-mono text-lg text-amber-200">
        <div className="flex items-center gap-3">
          <span className="text-green-400">$80,000</span>
          <span className="text-amber-400">−</span>
          <span className="text-red-400">$15,000</span>
        </div>
        <div className="w-40 border-t-2 border-amber-600 my-1" />
        <div className="flex items-center gap-2">
          <span className="text-amber-400">=</span>
          <span className="text-amber-100 font-bold">$65,000</span>
        </div>
      </div>
    ),
  },
  {
    title: 'UV STAMP',
    icon: '🔦',
    lines: [
      'Every doc has a stamp',
      'Use UV Scanner [2] to check',
      'VALID = clean · FAKE = fraud',
    ],
    diagram: (
      <div className="flex items-center justify-center gap-8 mt-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-14 border-2 border-green-500/60 rounded flex items-center justify-center relative overflow-hidden" style={{ background: 'rgba(63,163,92,0.08)' }}>
            <div className="font-mono text-xs font-bold tracking-wider text-green-400" style={{ textShadow: '0 0 8px rgba(63,163,92,0.5)' }}>VALID</div>
          </div>
          <span className="text-[10px] text-green-400/70 uppercase tracking-wider">Clean</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-14 border-2 border-red-500/60 rounded flex items-center justify-center relative overflow-hidden" style={{ background: 'rgba(180,71,63,0.08)' }}>
            <div className="font-mono text-xs font-bold tracking-wider text-red-400" style={{ textShadow: '0 0 8px rgba(180,71,63,0.5)' }}>FAKE</div>
          </div>
          <span className="text-[10px] text-red-400/70 uppercase tracking-wider">Fraud</span>
        </div>
      </div>
    ),
  },
  {
    title: 'FREEZE BUTTON',
    icon: '❄️',
    lines: [
      'FAKE stamp → use FREEZE',
      'Freezes assets on the spot',
      'Major fraud = bonus pay',
    ],
    diagram: (
      <div className="flex flex-col items-center gap-3 mt-2">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 border-2 border-red-500/60 rounded font-mono text-sm text-red-400 font-bold" style={{ background: 'rgba(180,71,63,0.1)' }}>
            FAKE STAMP
          </div>
          <div className="text-xl text-amber-400">→</div>
          <div className="px-4 py-1.5 border-2 border-blue-400/60 rounded font-mono text-sm text-blue-300 font-bold" style={{ background: 'rgba(58,106,191,0.1)' }}>
            ❄️ FREEZE
          </div>
        </div>
      </div>
    ),
  },
];

interface Props {
  onStart: () => void;
}

type Phase = 'intro' | 'handbook';

export default function IntroSequence({ onStart }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [typedCount, setTypedCount] = useState(0);
  const [textDone, setTextDone] = useState(false);
  const [fading, setFading] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [handbookPage, setHandbookPage] = useState(0);
  const [handbookReady, setHandbookReady] = useState(false);
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
    setTimeout(() => {
      setPhase('handbook');
      setTimeout(() => setHandbookReady(true), 80);
    }, 300);
  }, []);

  const handleNextPage = useCallback(() => {
    if (fading) return;
    const ctx = getOrResumeAudioCtx(audioCtxRef);
    if (ctx) playPageTurn(ctx);

    if (handbookPage < HANDBOOK_PAGES.length - 1) {
      setHandbookPage(p => p + 1);
    } else {
      setFading(true);
      setTimeout(() => {
        if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
        onStart();
      }, 700);
    }
  }, [handbookPage, onStart, fading]);

  const handlePrevPage = useCallback(() => {
    const ctx = getOrResumeAudioCtx(audioCtxRef);
    if (ctx) playPageTurn(ctx);
    if (handbookPage > 0) setHandbookPage(p => p - 1);
  }, [handbookPage]);

  const page = HANDBOOK_PAGES[handbookPage];
  const isLastPage = handbookPage === HANDBOOK_PAGES.length - 1;

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

        {phase === 'handbook' && (
          <motion.div
            key="handbook"
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: '#0e0a07' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)',
              }}
            />

            <AnimatePresence>
              {handbookReady && (
                <motion.div
                  key="handbook-card"
                  className="relative z-10 w-full max-w-lg mx-4"
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <div
                    className="relative rounded-sm shadow-2xl overflow-hidden"
                    style={{
                      background: '#1a1410',
                      border: '2px solid #6f4b1f',
                      boxShadow: '0 8px 40px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.05)',
                    }}
                  >
                    <div className="px-6 py-4 border-b flex items-center justify-between"
                         style={{ background: '#0d0906', borderColor: '#6f4b1f' }}>
                      <div>
                        <p className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: '#7a5520' }}>
                          Ministry of Finance
                        </p>
                        <h2 className="font-mono text-lg font-bold tracking-[0.15em] uppercase" style={{ color: '#e0a11b' }}>
                          Inspector Handbook
                        </h2>
                      </div>
                      <div className="font-mono text-xs px-2 py-1 rounded" style={{ background: '#2a1a0a', color: '#7a5520', border: '1px solid #6f4b1f55' }}>
                        {handbookPage + 1} / {HANDBOOK_PAGES.length}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={handbookPage}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.25 }}
                        className="px-8 py-8"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <span className="text-3xl">{page.icon}</span>
                          <h3 className="font-mono text-2xl font-bold tracking-[0.2em] uppercase" style={{ color: '#f3dfb2' }}>
                            {page.title}
                          </h3>
                        </div>

                        <div className="flex flex-col gap-4 mb-6">
                          {page.lines.map((line, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 + i * 0.12, duration: 0.3 }}
                              className="flex items-center gap-3"
                            >
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#e0a11b' }} />
                              <span className="font-mono text-base tracking-wide" style={{ color: '#f3dfb2' }}>
                                {line}
                              </span>
                            </motion.div>
                          ))}
                        </div>

                        {page.diagram && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                            className="p-4 rounded border"
                            style={{ background: 'rgba(224,161,27,0.04)', borderColor: '#6f4b1f55' }}
                          >
                            {page.diagram}
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    <div className="px-8 pb-6 flex items-center justify-between gap-3">
                      {handbookPage > 0 ? (
                        <button
                          onClick={handlePrevPage}
                          className="px-5 py-2.5 font-mono text-sm tracking-[0.15em] uppercase border transition-colors hover:bg-amber-900/20"
                          style={{ borderColor: '#6f4b1f', color: '#7a5520' }}
                        >
                          ← Back
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        onClick={handleNextPage}
                        className="px-8 py-2.5 font-mono text-sm font-bold tracking-[0.2em] uppercase border-2 transition-colors"
                        style={{
                          borderColor: '#e0a11b',
                          color: isLastPage ? '#1a1008' : '#e0a11b',
                          background: isLastPage ? '#e0a11b' : 'transparent',
                        }}
                        onMouseOver={e => {
                          if (isLastPage) e.currentTarget.style.background = '#c88a10';
                          else e.currentTarget.style.background = 'rgba(224,161,27,0.12)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = isLastPage ? '#e0a11b' : 'transparent';
                        }}
                      >
                        {isLastPage ? 'Begin Shift →' : 'Next →'}
                      </button>
                    </div>

                    <div className="px-8 pb-4 flex justify-center gap-2">
                      {HANDBOOK_PAGES.map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full transition-all duration-200"
                          style={{
                            background: i === handbookPage ? '#e0a11b' : '#6f4b1f44',
                          }}
                        />
                      ))}
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
