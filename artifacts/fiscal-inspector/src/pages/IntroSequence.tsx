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
  tag: string;
  lines: string[];
  diagram?: React.ReactNode;
}

const HANDBOOK_PAGES: HandbookPage[] = [
  {
    title: 'Document Verification',
    tag: 'RULE I',
    lines: [
      'Match the FULL NAME across every document in the file.',
      'Cross-check the SSN between the Citizen ID and Form 1040.',
      'Any mismatch in name or SSN → REJECT the filing immediately.',
    ],
    diagram: (
      <div className="flex items-start justify-center gap-3 mt-1">
        <div className="flex flex-col items-center gap-1">
          <div className="border border-stone-500 rounded-sm px-3 py-2 text-center" style={{ background: 'rgba(120,100,70,0.15)', minWidth: 90 }}>
            <div className="text-[9px] uppercase tracking-widest text-stone-500 mb-1">Citizen ID</div>
            <div className="font-bold text-stone-700 text-sm">J. Harmon</div>
            <div className="text-[10px] text-stone-500 mt-0.5">SSN 421-77-3018</div>
          </div>
        </div>
        <div className="text-2xl text-stone-500 mt-4">⟷</div>
        <div className="flex flex-col items-center gap-1">
          <div className="border border-stone-500 rounded-sm px-3 py-2 text-center" style={{ background: 'rgba(120,100,70,0.15)', minWidth: 90 }}>
            <div className="text-[9px] uppercase tracking-widest text-stone-500 mb-1">Form 1040</div>
            <div className="font-bold text-stone-700 text-sm">J. Harmon</div>
            <div className="text-[10px] text-stone-500 mt-0.5">SSN 421-77-3018</div>
          </div>
        </div>
        <div className="mt-4 text-green-700 font-bold text-xs tracking-widest">✓ MATCH</div>
      </div>
    ),
  },
  {
    title: 'Math Verification',
    tag: 'RULE II',
    lines: [
      'Verify: Gross Income − Deductions = Taxable Income.',
      'Check that Tax Owed matches the progressive bracket rate.',
      'Any arithmetic error → REJECT the filing.',
    ],
    diagram: (
      <div className="flex flex-col items-center gap-1 mt-1 font-mono text-base text-stone-700">
        <div className="flex items-center gap-3">
          <span className="text-green-700 font-bold">$80,000</span>
          <span className="text-stone-500">−</span>
          <span className="text-red-700 font-bold">$15,000</span>
        </div>
        <div className="w-40 border-t border-stone-500 my-1" />
        <div className="flex items-center gap-2">
          <span className="text-stone-500">=</span>
          <span className="font-bold text-stone-800">$65,000  ✓</span>
        </div>
        <div className="text-[10px] text-stone-500 mt-1 tracking-wide uppercase">Taxable Income — Confirmed</div>
      </div>
    ),
  },
  {
    title: 'UV Stamp Inspection',
    tag: 'RULE III',
    lines: [
      'Every document carries a Ministry of Finance stamp.',
      'Activate the UV Scanner [key 2] and hover the document.',
      'VALID stamp = authentic.  FAKE stamp = fraudulent filing.',
    ],
    diagram: (
      <div className="flex items-center justify-center gap-8 mt-1">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-20 h-12 rounded-sm border border-green-700/40 flex items-center justify-center" style={{ background: 'rgba(63,163,92,0.10)' }}>
            <span className="font-mono text-xs font-bold text-green-700 tracking-widest">VALID</span>
          </div>
          <span className="text-[9px] text-green-700/80 uppercase tracking-widest">Authentic</span>
        </div>
        <div className="text-stone-400 font-bold">vs</div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-20 h-12 rounded-sm border border-red-700/40 flex items-center justify-center" style={{ background: 'rgba(180,71,63,0.10)' }}>
            <span className="font-mono text-xs font-bold text-red-700 tracking-widest">FAKE</span>
          </div>
          <span className="text-[9px] text-red-700/80 uppercase tracking-widest">Fraud Detected</span>
        </div>
      </div>
    ),
  },
  {
    title: 'The Freeze Order',
    tag: 'RULE IV',
    lines: [
      'UV reveals a FAKE stamp?  Issue a FREEZE — not a rejection.',
      'A Freeze seizes all assets pending criminal investigation.',
      'Correct freezes earn bonus hazard pay.  Protect the Ministry.',
    ],
    diagram: (
      <div className="flex flex-col items-center gap-3 mt-1">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-sm border border-red-600/50 font-mono text-xs text-red-700 font-bold tracking-wider" style={{ background: 'rgba(180,71,63,0.10)' }}>
            FAKE STAMP
          </div>
          <div className="text-stone-500 font-bold text-lg">→</div>
          <div className="px-4 py-1.5 rounded-sm border-2 border-blue-700/50 font-mono text-xs text-blue-700 font-bold tracking-wider" style={{ background: 'rgba(29,78,216,0.08)' }}>
            ❄ FREEZE
          </div>
        </div>
        <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-1">Hazard Pay Issued on Confirmation</div>
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
            if (ctx && ctx.state === 'running') playTypewriterClick(ctx);
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
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
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
            style={{
              background: 'radial-gradient(ellipse at center, #2a1f14 0%, #110d08 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* subtle grain */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
                backgroundSize: '200px 200px',
                mixBlendMode: 'overlay',
              }}
            />

            <AnimatePresence>
              {handbookReady && (
                <motion.div
                  key="book"
                  className="relative z-10"
                  style={{ perspective: 1200 }}
                  initial={{ opacity: 0, y: 40, rotateX: 6 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                  {/* ── OUTER BOOK SHADOW ─────────────────────────────────── */}
                  <div
                    className="absolute -inset-2 rounded-sm"
                    style={{
                      boxShadow: '0 24px 80px rgba(0,0,0,0.75), 0 8px 24px rgba(0,0,0,0.5)',
                      background: 'transparent',
                      zIndex: -1,
                    }}
                  />

                  {/* ── BOOK BODY ─────────────────────────────────────────── */}
                  <div
                    className="flex rounded-sm overflow-hidden"
                    style={{ width: 'min(680px, 92vw)', minHeight: 420 }}
                  >

                    {/* ── LEFT: LEATHER COVER / SPINE ───────────────────── */}
                    <div
                      className="relative flex flex-col items-center justify-between py-6"
                      style={{
                        width: 52,
                        flexShrink: 0,
                        background: 'linear-gradient(180deg, #3b2410 0%, #2a1a0c 40%, #3b2410 100%)',
                        borderRight: '3px solid #1a0e06',
                        boxShadow: 'inset -4px 0 10px rgba(0,0,0,0.45)',
                      }}
                    >
                      {/* spine stitching lines */}
                      <div className="absolute inset-x-0 top-10 flex flex-col gap-3 items-center opacity-30">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="w-4 border-t border-stone-400" />
                        ))}
                      </div>
                      {/* spine title (rotated) */}
                      <div
                        className="absolute font-mono text-[8px] tracking-[0.25em] uppercase text-amber-700/60 select-none"
                        style={{ transform: 'rotate(-90deg) translateX(-50%)', whiteSpace: 'nowrap', top: '50%', left: '50%' }}
                      >
                        Inspector's Handbook
                      </div>
                      {/* spine decorative bands */}
                      <div className="w-full h-0.5" style={{ background: '#5a3618' }} />
                      <div className="w-full h-0.5" style={{ background: '#5a3618' }} />
                    </div>

                    {/* ── RIGHT: PARCHMENT PAGE ─────────────────────────── */}
                    <div
                      className="relative flex flex-col flex-1"
                      style={{
                        background: 'linear-gradient(135deg, #f5efde 0%, #ede3c8 60%, #e8dab8 100%)',
                        borderLeft: '1px solid #c9b888',
                      }}
                    >
                      {/* subtle page texture lines */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 23px, #8b7355 23px, #8b7355 24px)',
                        }}
                      />

                      {/* page-edge fold corner top-right */}
                      <div
                        className="absolute top-0 right-0 w-8 h-8 pointer-events-none"
                        style={{
                          background: 'linear-gradient(225deg, #c9b888 45%, transparent 45%)',
                          opacity: 0.5,
                        }}
                      />

                      {/* ── HEADER STAMP ────────────────────────────────── */}
                      <div
                        className="relative z-10 flex items-start justify-between px-7 pt-6 pb-3"
                        style={{ borderBottom: '1.5px solid #c9b888' }}
                      >
                        <div>
                          <div className="font-mono text-[8px] tracking-[0.35em] uppercase text-stone-500 mb-0.5">
                            Ministry of Finance · Issued to Inspector
                          </div>
                          <h2
                            className="font-serif text-stone-800 font-bold"
                            style={{ fontSize: '1.15rem', letterSpacing: '0.05em' }}
                          >
                            Inspector's Field Handbook
                          </h2>
                        </div>
                        {/* stamped page tag */}
                        <div
                          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-sm mt-0.5"
                          style={{
                            border: '2px solid #7a5c2a',
                            background: 'rgba(122,92,42,0.08)',
                            minWidth: 52,
                          }}
                        >
                          <div className="font-mono text-[8px] tracking-[0.2em] text-stone-500 uppercase">Page</div>
                          <div className="font-mono text-base font-bold text-stone-700">{handbookPage + 1}</div>
                          <div className="font-mono text-[8px] tracking-[0.15em] text-stone-400">of {HANDBOOK_PAGES.length}</div>
                        </div>
                      </div>

                      {/* ── PAGE CONTENT ────────────────────────────────── */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={handbookPage}
                          initial={{ opacity: 0, x: 18 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -18 }}
                          transition={{ duration: 0.22 }}
                          className="relative z-10 flex-1 px-7 py-5 flex flex-col"
                        >
                          {/* rule tag + title */}
                          <div className="flex items-baseline gap-3 mb-4">
                            <span
                              className="font-mono text-[9px] tracking-[0.3em] uppercase px-2 py-0.5 rounded-sm border"
                              style={{ color: '#7a5c2a', borderColor: '#c9b888', background: 'rgba(122,92,42,0.08)' }}
                            >
                              {page.tag}
                            </span>
                            <h3
                              className="font-serif font-bold text-stone-800"
                              style={{ fontSize: '1.1rem' }}
                            >
                              {page.title}
                            </h3>
                          </div>

                          {/* rule lines */}
                          <div className="flex flex-col gap-3 mb-5">
                            {page.lines.map((line, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.08 + i * 0.1, duration: 0.25 }}
                                className="flex items-start gap-3"
                              >
                                <span className="font-mono text-stone-400 text-xs mt-0.5 shrink-0">
                                  {String(i + 1).padStart(2, '0')}.
                                </span>
                                <p className="font-mono text-[13px] leading-snug text-stone-700">
                                  {line}
                                </p>
                              </motion.div>
                            ))}
                          </div>

                          {/* diagram area */}
                          {page.diagram && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.35, duration: 0.25 }}
                              className="rounded-sm px-5 py-4 mt-auto"
                              style={{
                                background: 'rgba(122,92,42,0.06)',
                                border: '1px dashed #c9b888',
                              }}
                            >
                              {page.diagram}
                            </motion.div>
                          )}
                        </motion.div>
                      </AnimatePresence>

                      {/* ── FOOTER: PAGE DOTS + NAVIGATION ─────────────── */}
                      <div
                        className="relative z-10 flex items-center justify-between px-7 py-4"
                        style={{ borderTop: '1.5px solid #c9b888' }}
                      >
                        {/* dots */}
                        <div className="flex gap-2">
                          {HANDBOOK_PAGES.map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full transition-all duration-200"
                              style={{ background: i === handbookPage ? '#7a5c2a' : '#c9b88877' }}
                            />
                          ))}
                        </div>

                        {/* nav buttons */}
                        <div className="flex items-center gap-3">
                          {handbookPage > 0 && (
                            <button
                              onClick={handlePrevPage}
                              className="font-mono text-xs tracking-[0.15em] uppercase px-4 py-2 transition-colors"
                              style={{
                                border: '1px solid #c9b888',
                                color: '#7a5c2a',
                                background: 'transparent',
                                borderRadius: 2,
                              }}
                              onMouseOver={e => (e.currentTarget.style.background = 'rgba(122,92,42,0.10)')}
                              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              ← Back
                            </button>
                          )}
                          <button
                            onClick={handleNextPage}
                            className="font-mono text-xs tracking-[0.2em] uppercase px-6 py-2 font-bold transition-colors"
                            style={{
                              border: '2px solid #7a5c2a',
                              color: isLastPage ? '#f5efde' : '#4a3518',
                              background: isLastPage ? '#7a5c2a' : 'transparent',
                              borderRadius: 2,
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = isLastPage ? '#5a3618' : 'rgba(122,92,42,0.14)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = isLastPage ? '#7a5c2a' : 'transparent';
                            }}
                          >
                            {isLastPage ? 'Begin Shift →' : 'Next Page →'}
                          </button>
                        </div>
                      </div>
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
