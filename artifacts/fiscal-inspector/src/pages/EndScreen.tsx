import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { formatMoney } from '@/lib/utils';
import { calculateEnding } from '@/lib/narrative';

const TITLE_COLOR: Record<string, string> = {
  green:  '#3fa35c',
  red:    '#b4473f',
  amber:  '#e0a11b',
  blue:   '#5a9abf',
  purple: '#9b59b6',
};

function playEndingAudio(color: string) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const isGood = color === 'green' || color === 'blue';

    const note = (freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type  = type;
      osc.frequency.setValueAtTime(freq, now + start);
      g.gain.setValueAtTime(0, now + start);
      g.gain.linearRampToValueAtTime(vol, now + start + 0.12);
      g.gain.setValueAtTime(vol * 0.75, now + start + dur * 0.65);
      g.gain.linearRampToValueAtTime(0, now + start + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    };

    note(41, 0, 7.5, 0.20);
    note(55, 0, 7.5, 0.12);

    const chord = isGood ? [220, 277, 330] : [220, 261, 311];
    chord.forEach((f, i) => note(f, 0.5 + i * 0.07, 4.8, 0.13, 'triangle'));

    const melody = color === 'red'
      ? [329, 293, 261, 220, 196]
      : color === 'green'
        ? [261, 294, 329, 370, 329]
        : [294, 261, 277, 220, 247];
    melody.forEach((f, i) => note(f, 1.3 + i * 0.65, 1.1, 0.19, 'triangle'));

    note(isGood ? 523 : 415, 4.5, 1.0, 0.28, 'sine');

    const bell  = ctx.createOscillator();
    const bellG = ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(isGood ? 440 : 370, now + 4.8);
    bell.frequency.exponentialRampToValueAtTime(isGood ? 220 : 110, now + 11);
    bellG.gain.setValueAtTime(0.55, now + 4.8);
    bellG.gain.exponentialRampToValueAtTime(0.001, now + 11);
    bell.connect(bellG);
    bellG.connect(ctx.destination);
    bell.start(now + 4.8);
    bell.stop(now + 11.5);
  } catch (_) { /* ignore */ }
}

export default function EndScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, returnToMenu, startGame } = engine;
  const isVictory   = state.status === 'VICTORY';
  const audioPlayed = useRef(false);

  const ending = state.ending ?? calculateEnding(
    state.money, state.citations, state.alignment, state.worldState
  );

  const titleColor = TITLE_COLOR[ending.color] ?? TITLE_COLOR.amber;

  useEffect(() => {
    if (!audioPlayed.current) {
      audioPlayed.current = true;
      playEndingAudio(ending.color);
    }
  }, [ending.color]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: '#080504' }}
    >
      {/* Radial vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)' }}
      />

      {/* Film-grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-2xl w-full">

        {/* Status label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="font-terminal text-[10px] uppercase mb-8"
          style={{ color: '#3a2a14', letterSpacing: '0.45em' }}
        >
          {isVictory ? '— CASE CLOSED —' : '— TERMINATED —'}
        </motion.div>

        {/* Giant ending title */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-stamped uppercase leading-none mb-8"
          style={{
            fontSize: 'clamp(52px, 9vw, 90px)',
            color: titleColor,
            textShadow: `0 0 80px ${titleColor}55, 0 0 160px ${titleColor}22`,
            letterSpacing: '0.07em',
          }}
        >
          {ending.title}
        </motion.h1>

        {/* Rule */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.7 }}
          style={{ width: 180, height: 1, background: `${titleColor}33`, marginBottom: 26 }}
        />

        {/* One-line subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 0.8 }}
          className="font-terminal text-xs uppercase tracking-widest mb-12"
          style={{ color: '#7a5a30', letterSpacing: '0.2em', maxWidth: 460 }}
        >
          {ending.subtitle}
        </motion.p>

        {/* 3 compact stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3, duration: 0.7 }}
          className="flex items-center gap-12 mb-16"
        >
          {[
            {
              label: 'Days Served',
              value: `${Math.min(state.day, 7)} / 7`,
              color: '#6a5030',
            },
            {
              label: 'Balance',
              value: formatMoney(state.money),
              color: state.money >= 0 ? '#3fa35c' : '#b4473f',
            },
            {
              label: 'Citations',
              value: `${state.citations} / 5`,
              color: state.citations >= 3 ? '#b4473f' : '#6a5030',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className="font-terminal text-[9px] uppercase"
                style={{ color: '#3a2a14', letterSpacing: '0.3em' }}
              >
                {label}
              </div>
              <div
                className="font-terminal text-2xl font-bold"
                style={{ color }}
              >
                {value}
              </div>
            </div>
          ))}
        </motion.div>

        {/* PLAY AGAIN — large, prominent */}
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.6 }}
          onClick={startGame}
          className="font-terminal text-sm font-bold uppercase mb-5 px-16 py-5 border-2 transition-all duration-200"
          style={{
            borderColor: titleColor,
            background: titleColor,
            color: '#080504',
            letterSpacing: '0.32em',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = titleColor;
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.background = titleColor;
            (e.currentTarget as HTMLButtonElement).style.color = '#080504';
          }}
        >
          Play Again
        </motion.button>

        {/* Main Menu — smaller, below */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.1, duration: 0.5 }}
          onClick={returnToMenu}
          className="font-terminal text-[10px] uppercase transition-all duration-200"
          style={{ color: '#3a2a14', letterSpacing: '0.28em' }}
          onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9a7a50'; }}
          onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3a2a14'; }}
        >
          Main Menu
        </motion.button>
      </div>
    </div>
  );
}
