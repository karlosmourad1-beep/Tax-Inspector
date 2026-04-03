import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { DAILY_EVENTS } from '@/lib/narrative';

const EVENT_META: Record<string, {
  headline: string;
  subline: string;
  effect: string;
  col1: string[];
  col2: string[];
  color: string;
}> = {
  market_shock: {
    headline: 'MARKET PANIC',
    subline: 'Emergency decree issued overnight',
    effect: 'WAGES −30% TODAY',
    col1: [
      'Ministry officials cited "systemic instability"',
      'as justification for the emergency austerity',
      'order. Citizens are advised to expect delays.',
      '',
      'Clerk wages effective immediately reduced',
      'across all processing districts.',
    ],
    col2: [
      'Audit error penalties doubled for this period.',
      'Cross-reference bracket tables carefully.',
      '',
      '"We must stabilize the fiscal ledger before',
      'any recovery can begin." — Deputy Minister',
    ],
    color: '#cc4444',
  },
  hyperinflation: {
    headline: 'COST OF LIVING',
    subline: 'Ministry announces emergency index adjustment',
    effect: '$120 AUTO-DEDUCTED',
    col1: [
      'The Ministry confirmed rising costs across',
      'all districts. Rents, food, and essentials',
      'will be deducted automatically from wages.',
      '',
      'Capital gains filings surge this period.',
      'Schedule D cross-reference now mandatory.',
    ],
    col2: [
      'Short-term vs. long-term classification',
      'errors carry doubled penalties today.',
      '',
      '"The index reflects reality," said the',
      'Ministry\'s Bureau of Economic Truth.',
    ],
    color: '#d07020',
  },
  audit_sweep: {
    headline: 'AUDIT SWEEP',
    subline: 'Ministry conducts final performance review',
    effect: 'YOUR RECORD IS PERMANENT',
    col1: [
      'Senior oversight will review every decision',
      'made during today\'s processing window.',
      'Clerks are reminded that accuracy scores',
      'determine final classification.',
      '',
      'Wages increased 25% for final audit day.',
    ],
    col2: [
      'All citations will be individually reviewed.',
      'Clerks with exemplary records may receive',
      'commendation certificates.',
      '',
      '"The Ministry sees everything." — Internal',
      'Oversight Division, Memo #7-Final.',
    ],
    color: '#c8a020',
  },
};

const FILLER_LINES = [
  '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
  '▓▓▓▓▓▓▓▓▓▓▓▓',
  '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
];

function FakePhoto() {
  return (
    <div
      className="w-full border border-black/30"
      style={{ background: '#9a8f7e', height: 60, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 4px)',
      }} />
      <div style={{
        position: 'absolute', bottom: 4, left: 6, right: 6,
        fontSize: 7, color: '#3a3028', fontFamily: 'serif', lineHeight: 1.2,
      }}>
        Queues outside Ministry Processing Office, Day {Math.floor(Math.random() * 4) + 2}
      </div>
    </div>
  );
}

function FakeChart({ color }: { color: string }) {
  const bars = [65, 80, 55, 90, 40, 72, 88];
  return (
    <div className="w-full border border-black/20 px-2 pt-1 pb-0.5" style={{ background: '#f0e8d4' }}>
      <div style={{ fontSize: 6.5, color: '#2a2018', fontFamily: 'serif', marginBottom: 2 }}>
        WAGE INDEX — 7-DAY PERIOD
      </div>
      <div className="flex items-end gap-0.5" style={{ height: 24 }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            flex: 1, height: `${h}%`,
            background: i === bars.length - 1 ? color : '#6a5840',
          }} />
        ))}
      </div>
    </div>
  );
}

export default function DayStartScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, startDay } = engine;
  const event = DAILY_EVENTS[state.day];
  const meta  = event ? EVENT_META[event.type] : null;

  // Only show newspaper on event days
  const hasNewspaper = !!event && !!meta;
  const [phase, setPhase] = useState<'newspaper' | 'day-screen'>(hasNewspaper ? 'newspaper' : 'day-screen');

  useEffect(() => {
    setPhase(hasNewspaper ? 'newspaper' : 'day-screen');
  }, [state.day, hasNewspaper]);

  useEffect(() => {
    if (phase === 'newspaper') {
      const timer = setTimeout(() => setPhase('day-screen'), 3800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase]);

  const dayColor = meta?.color ?? '#e0a11b';

  return (
    <div
      className="h-screen w-full flex items-center justify-center"
      style={{ background: '#120d0a', color: '#f3dfb2' }}
    >
      <AnimatePresence mode="wait">

        {/* ── NEWSPAPER ── */}
        {phase === 'newspaper' && meta && (
          <motion.div
            key="newspaper"
            initial={{ rotateZ: -22, scale: 0.85, opacity: 0, x: -120, y: 80 }}
            animate={{ rotateZ: -2, scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ rotateZ: 8, scale: 0.9, opacity: 0, x: 160, y: -60 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'center bottom' }}
          >
            {/* Paper */}
            <div
              style={{
                width: 420,
                background: '#ede3cb',
                border: '2px solid #8b7355',
                boxShadow: '0 24px 72px rgba(0,0,0,0.85), 4px 4px 0 rgba(0,0,0,0.3)',
                fontFamily: 'Georgia, "Times New Roman", serif',
                padding: '16px 20px 14px',
                color: '#1a1208',
              }}
            >
              {/* Masthead */}
              <div style={{ borderBottom: '3px solid #1a1208', paddingBottom: 6, marginBottom: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.5em', fontWeight: 900, textTransform: 'uppercase', color: '#1a1208' }}>
                  ✦ Ministry Times ✦
                </div>
                <div style={{ fontSize: 7.5, letterSpacing: '0.15em', color: '#5a4a30', marginTop: 1 }}>
                  Est. 1994 &emsp;|&emsp; Official Record of the Ministry &emsp;|&emsp; Day {state.day} Edition
                </div>
              </div>

              {/* Dateline */}
              <div style={{ borderBottom: '1px solid #1a1208', paddingBottom: 3, marginBottom: 8, fontSize: 7.5, color: '#5a4a30', display: 'flex', justifyContent: 'space-between' }}>
                <span>MINISTRY DISTRICT — MORNING EDITION</span>
                <span>ONE MINISTRY CREDIT</span>
              </div>

              {/* Main headline */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                <div style={{
                  fontSize: 42, fontWeight: 900, lineHeight: 1, textAlign: 'center',
                  color: meta.color, textTransform: 'uppercase',
                  textShadow: '1px 2px 0 rgba(0,0,0,0.18)',
                  marginBottom: 4,
                }}>
                  {meta.headline}
                </div>
                <div style={{ fontSize: 12, textAlign: 'center', fontStyle: 'italic', color: '#3a2c18', marginBottom: 6, letterSpacing: '0.03em' }}>
                  {meta.subline}
                </div>
              </motion.div>

              {/* Divider */}
              <div style={{ borderTop: '2px solid #1a1208', borderBottom: '1px solid #1a1208', padding: '2px 0', marginBottom: 8, textAlign: 'center' }}>
                <div style={{
                  fontSize: 15, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: meta.color, fontStyle: 'normal',
                }}>
                  {meta.effect}
                </div>
              </div>

              {/* Two-column body */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
              >
                {/* Left col */}
                <div>
                  <FakePhoto />
                  <div style={{ marginTop: 6 }}>
                    {meta.col1.map((line, i) => (
                      <div key={i} style={{ fontSize: 7.5, lineHeight: 1.55, color: line === '' ? 'transparent' : '#2a2018', marginBottom: 0 }}>
                        {line || '​'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right col */}
                <div>
                  <FakeChart color={meta.color} />
                  <div style={{ marginTop: 6 }}>
                    {meta.col2.map((line, i) => (
                      <div key={i} style={{ fontSize: 7.5, lineHeight: 1.55, color: line === '' ? 'transparent' : '#2a2018', fontStyle: line.startsWith('"') ? 'italic' : 'normal' }}>
                        {line || '​'}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, borderTop: '1px solid #8b7355', paddingTop: 4 }}>
                    {FILLER_LINES.slice(0, 3).map((l, i) => (
                      <div key={i} style={{ fontSize: 6, color: '#c8b898', fontFamily: 'monospace', marginBottom: 1 }}>{l}</div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid #8b7355', marginTop: 8, paddingTop: 4, fontSize: 6.5, color: '#8b7355', textAlign: 'center' }}>
                The Ministry Times is the Official Record. Reproduction without authorization is a Ministry violation.
              </div>
            </div>

            {/* Click to skip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center mt-3 cursor-pointer"
              style={{ fontSize: 11, color: '#6f4b1f', letterSpacing: '0.2em' }}
              onClick={() => setPhase('day-screen')}
            >
              [ CLICK TO CONTINUE ]
            </motion.div>
          </motion.div>
        )}

        {/* ── DAY START SCREEN ── */}
        {phase === 'day-screen' && (
          <motion.div
            key="day-screen"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center gap-6 text-center"
            style={{ maxWidth: 480 }}
          >
            {/* Day label */}
            <div style={{ color: '#7a5520', fontSize: 13, letterSpacing: '0.5em', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase' }}>
              DAY {state.day} OF 7
            </div>

            {/* Title */}
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '0.06em', color: '#f3dfb2', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
              TAXES<br />PLEASE
            </div>

            {/* Event impact — only 3 lines */}
            {event && meta && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col items-center gap-2 px-8 py-5 border-2"
                style={{ borderColor: `${dayColor}55`, background: `${dayColor}10` }}
              >
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.12em', color: dayColor, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  {meta.headline}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f3dfb2', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                  {meta.effect}
                </div>
                {event.ruleAddendum && (
                  <div style={{ fontSize: 11, color: '#a08060', fontFamily: 'monospace', maxWidth: 320, lineHeight: 1.5 }}>
                    {event.ruleAddendum}
                  </div>
                )}
              </motion.div>
            )}

            {/* Start button */}
            <motion.button
              onClick={startDay}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '18px 48px',
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                border: `2px solid ${dayColor}`,
                background: `${dayColor}12`,
                color: dayColor,
                cursor: 'pointer',
              }}
            >
              Start Shift →
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
