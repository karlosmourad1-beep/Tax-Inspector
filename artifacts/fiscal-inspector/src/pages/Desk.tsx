import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine, DAILY_GOALS } from '@/hooks/useGameEngine';
import { DraggablePaper } from '@/components/workspace/DraggablePaper';
import stackBillImg  from '@assets/image_1775629923935.png';
import singleBillImg from '@assets/image_1775629927550.png';
import { Stamp } from '@/components/ui/Stamp';
import { formatMoney, cn } from '@/lib/utils';
import { DailyLog, Client } from '@/types/game';
import { fieldGroup } from '@/components/forms/PaperForms';
import {
  InspectorToolbar, CalculatorOverlay, UVScannerOverlay, LedgerOverlay, FamilyMonitorOverlay,
  type ToolType,
} from '@/components/workspace/InspectorToolkit';
import {
  Clock, ShieldAlert, DollarSign, CheckCircle2, XCircle,
  Snowflake, TrendingDown, FileText, AlertTriangle,
} from 'lucide-react';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:     '#120d0a',
  panel:  '#16110e',
  border: '#6f4b1f',
  accent: '#e0a11b',
  muted:  '#7a5520',
  green:  '#3fa35c',
  red:    '#b4473f',
  text:   '#f3dfb2',
  desk:   'linear-gradient(170deg, #251a12 0%, #1a110c 100%)',
};

// ─── Envelope SVG (physical mail design) ─────────────────────────────────────
function EnvelopeSVG({ client }: { client: Client }) {
  const isVIP    = client.isVIP;
  const hasBribe = !!client.hasBribe;
  const billCount = Math.min(Math.floor((client.brideAmount ?? 20) / 10), 5);
  const deskNum   = (client.avatarSeed % 9) + 1;

  // Manila/buff envelope palette
  const envBase  = '#d6bc7a';
  const envDark  = '#a08840';
  const envShade = '#b8a258';
  const envLight = '#e8d498';

  // Bribe: envelope is thicker — extra drop shadow
  const extraShadow = hasBribe ? ', 0 12px 32px rgba(0,0,0,0.5)' : '';

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <svg
        viewBox="0 0 340 220"
        width={340} height={hasBribe ? 236 : 220}
        style={{ display: 'block', filter: `drop-shadow(0 8px 28px rgba(0,0,0,0.65))${extraShadow}` }}
      >
        {/* Bribe envelope bulge shadow underneath */}
        {hasBribe && (
          <>
            <ellipse cx="170" cy="228" rx="148" ry="7" fill="rgba(0,0,0,0.28)" />
            <rect x="4" y="34" width="332" height="190" rx="5" fill={envShade} opacity="0.6" />
            <rect x="8" y="38" width="328" height="188" rx="5" fill={envBase} opacity="0.5" />
          </>
        )}

        {/* === ENVELOPE BODY === */}
        <rect x="0" y="30" width="340" height="190" rx="5" fill={envBase} />

        {/* Subtle paper texture — horizontal lines */}
        {[60, 90, 120, 150, 180, 210].map(y => (
          <line key={y} x1="0" y1={y} x2="340" y2={y} stroke={envDark} strokeWidth="0.3" opacity="0.12" />
        ))}

        {/* Left & right diagonal fold marks (diamond-back style) */}
        <polygon points="0,30 170,136 0,220" fill={envDark} opacity="0.18" />
        <polygon points="340,30 170,136 340,220" fill={envDark} opacity="0.18" />
        {/* Bottom fold crease */}
        <line x1="0" y1="220" x2="170" y2="136" stroke={envDark} strokeWidth="0.8" opacity="0.3" />
        <line x1="340" y1="220" x2="170" y2="136" stroke={envDark} strokeWidth="0.8" opacity="0.3" />

        {/* === FLAP (top) === */}
        {hasBribe ? (
          /* Slightly bulging flap — lift it a tiny bit to show cash beneath */
          <>
            {/* Cash bills peeking from under flap */}
            {Array.from({ length: Math.min(billCount, 4) }).map((_, i) => (
              <rect
                key={i}
                x={118 + i * 8} y={2 + i}
                width={104 - i * 6} height={24}
                rx="2" fill={i % 2 === 0 ? '#2d4010' : '#3a5018'}
                opacity={0.9 - i * 0.1}
              />
            ))}
            {/* Serial-number-like stripe on top bill */}
            <text x="170" y="18" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="9" fill="#6a9020" fontWeight="bold" opacity="0.9">
              MF·{String(client.avatarSeed).padStart(5,'0')}·A
            </text>
            {/* Flap over the bills */}
            <polygon points="0,30 170,126 340,30 340,0 0,0" fill={envBase} />
            <line x1="0" y1="30" x2="340" y2="30" stroke={envDark} strokeWidth="1" opacity="0.4" />
          </>
        ) : (
          <>
            <polygon points="0,30 170,126 340,30 340,0 0,0" fill={envBase} />
            <line x1="0" y1="30" x2="340" y2="30" stroke={envDark} strokeWidth="0.8" opacity="0.4" />
          </>
        )}

        {/* Flap center fold crease line */}
        <line x1="0" y1="30" x2="170" y2="126" stroke={envDark} strokeWidth="0.5" opacity="0.25" />
        <line x1="340" y1="30" x2="170" y2="126" stroke={envDark} strokeWidth="0.5" opacity="0.25" />

        {/* === POSTAGE STAMP (top right) === */}
        <rect x="266" y="8" width="60" height="48" rx="2" fill={envLight} stroke={envDark} strokeWidth="0.8" />
        {/* Perforated edges (dashed border) */}
        <rect x="268" y="10" width="56" height="44" rx="1" fill="none" stroke={envDark} strokeWidth="0.6" strokeDasharray="2.5,1.5" opacity="0.5" />
        {/* Stamp art */}
        <rect x="270" y="12" width="52" height="38" rx="1" fill="#3d5a18" />
        <text x="296" y="30" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="7" fill="#8ab840" fontWeight="bold">M.O.F.</text>
        <text x="296" y="40" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="6" fill="#6a9020">DISTRICT 7</text>
        <text x="296" y="47" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="6" fill="#5a7a18">TAX AUTH.</text>
        {/* Cancellation wavy lines */}
        <line x1="258" y1="14" x2="270" y2="14" stroke={envDark} strokeWidth="1" opacity="0.4" />
        <line x1="258" y1="18" x2="270" y2="18" stroke={envDark} strokeWidth="1" opacity="0.35" />
        <line x1="258" y1="22" x2="270" y2="22" stroke={envDark} strokeWidth="1" opacity="0.3" />
        {/* Circular cancellation ring */}
        <circle cx="258" cy="20" r="16" fill="none" stroke={envDark} strokeWidth="0.8" opacity="0.3" />

        {/* === RETURN ADDRESS (top left) === */}
        <text x="14" y="46" fontFamily='"Courier New",monospace' fontSize="7" fill={envDark} opacity="0.65">DISTRICT TAX AUTHORITY</text>
        <text x="14" y="56" fontFamily='"Courier New",monospace' fontSize="7" fill={envDark} opacity="0.45">GOVERNMENT DISTRICT 7</text>

        {/* === CENTER INTAKE STAMP === */}
        {hasBribe ? (
          <>
            <rect x="68" y="72" width="204" height="56" rx="3" fill="none" stroke="#7a3800" strokeWidth="2.5" />
            <text x="170" y="100" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="13" fontWeight="bold" fill="#7a3800">CONFIDENTIAL</text>
            <text x="170" y="118" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="10" fill="#7a3800">SEALED — DO NOT OPEN</text>
          </>
        ) : (
          <>
            <rect x="88" y="76" width="164" height="52" rx="3" fill="none" stroke="#6b0000" strokeWidth="2.5" />
            <text x="170" y="103" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="13" fontWeight="bold" fill="#6b0000">MINISTRY</text>
            <text x="170" y="120" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="10" fill="#6b0000">
              {isVIP ? 'PRIORITY INTAKE' : 'STANDARD INTAKE'}
            </text>
          </>
        )}

        {/* === RECIPIENT ADDRESS (center-left) === */}
        <text x="20" y="158" fontFamily='"Courier New",monospace' fontSize="8" fill={envDark} opacity="0.55">TO: TAX INSPECTION BUREAU</text>
        <text x="20" y="169" fontFamily='"Courier New",monospace' fontSize="8" fill={envDark} opacity="0.42">DEPT. REVENUE — DESK {deskNum}</text>
        <text x="20" y="180" fontFamily='"Courier New",monospace' fontSize="8" fill={envDark} opacity="0.35">DISTRICT 7, GOVERNMENT QUARTER</text>

        {/* === CASE NUMBER (bottom left) === */}
        <text x="14" y="215" fontFamily='"Courier New",monospace' fontSize="8" fill={envDark} opacity="0.38">
          CASE NO. {client.id.slice(0, 14).toUpperCase()}
        </text>

        {/* VIP gold trim */}
        {isVIP && (
          <rect x="2" y="2" width="336" height="216" rx="4" fill="none" stroke="#c8a800" strokeWidth="2.5" />
        )}

        {/* Outer envelope border */}
        <rect x="0" y="0" width="340" height="220" rx="5" fill="none" stroke={envDark} strokeWidth="1" opacity="0.3" />
      </svg>

      <div style={{
        position: 'absolute', bottom: hasBribe ? -14 : -30, left: 0, right: 0, textAlign: 'center',
        fontFamily: '"Courier New",monospace', fontSize: 10,
        color: C.accent, letterSpacing: '0.22em', opacity: 0.7,
        textTransform: 'uppercase',
      }}>
        Click to open case
      </div>
    </div>
  );
}

// ─── Paper-rustle sound (white noise burst) ───────────────────────────────────
function playRustle() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const rate = ctx.sampleRate;
    const dur  = 0.18;
    const buf  = ctx.createBuffer(1, Math.floor(rate * dur), rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // amplitude tapers off quickly (simulate a short scrape)
      const env = Math.pow(1 - i / data.length, 1.6);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src    = ctx.createBufferSource();
    src.buffer   = buf;
    const lpf    = ctx.createBiquadFilter();
    lpf.type     = 'lowpass';
    lpf.frequency.value = 2800;
    const hpf    = ctx.createBiquadFilter();
    hpf.type     = 'highpass';
    hpf.frequency.value = 400;
    const gain   = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(lpf); lpf.connect(hpf); hpf.connect(gain); gain.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + dur + 0.02);
  } catch (_) { /* silently skip if AudioContext unavailable */ }
}

// (BankNoteSVG removed — bill imagery handled directly in BribeStack)

// ─── Portrait palettes (all desaturated) ────────────────────────────────────
const SKINS  = ['#c9aa8a','#b59070','#9e7a58','#8a6445','#6b4a32','#d5c5a8','#a88a68','#7a5a3e'];
const HAIRS  = ['#1a1208','#2d200e','#4a3010','#1f1f20','#3d2c18','#8a7a62','#585040'];
const SHIRTS = ['hsl(210,14%,22%)','hsl(0,0%,18%)','hsl(25,18%,22%)','hsl(100,8%,20%)','hsl(220,10%,26%)','hsl(0,6%,22%)'];

function PortraitSVG({ seed, w, h, disguise }: { seed: number; w: number; h: number; disguise?: string }) {
  const skin  = SKINS[(seed * 13) % SKINS.length];
  const hair  = HAIRS[(seed * 7)  % HAIRS.length];
  const shirt = SHIRTS[(seed * 11) % SHIRTS.length];
  const headRx = [13, 14, 16, 11][seed % 4];
  const headRy = [16, 14, 13, 17][seed % 4];
  const hairType  = (seed * 3) % 5;
  const eyeHeavy  = (seed * 5) % 3 === 0;
  const mouthDown = (seed * 3) % 3 > 0;
  const browStyle = (seed * 23) % 3;
  const cx = 32, headCy = 38, eyeY = headCy - 1;
  const filterId = `vg${seed}`;

  // Disguise overrides — recurring characters get forced accessories
  const baseAccessory = (seed * 17) % 6;
  const hasGlasses = disguise === 'glasses' || disguise === 'glasses_hat' || disguise === 'glasses_mustache' || disguise === 'corporate_badge'
    ? true
    : !disguise && (baseAccessory === 3 || baseAccessory === 4);
  const hasHat = disguise === 'hat' || disguise === 'glasses_hat'
    ? true
    : !disguise && baseAccessory === 5;
  const hasMustache = disguise === 'mustache' || disguise === 'glasses_mustache';
  const hasBadge    = disguise === 'corporate_badge';
  // Silly glasses style for disguises
  const sillyGlasses = disguise === 'glasses_mustache' || disguise === 'glasses_hat';

  return (
    <svg width={w} height={h} viewBox="0 0 64 80"
         style={{ filter: 'sepia(22%) contrast(0.88) saturate(0.72)', display: 'block' }}>
      <rect width="64" height="80" fill="#cec1a6" />
      <radialGradient id={filterId} cx="50%" cy="45%" r="65%">
        <stop offset="55%" stopColor="transparent" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
      </radialGradient>
      <rect width="64" height="80" fill={`url(#${filterId})`} />
      {hasHat && <>
        <rect x={cx-18} y={headCy-headRy-13} width="36" height="11" rx="2" fill={hair} />
        <rect x={cx-23} y={headCy-headRy-3}  width="46" height="4"  rx="1" fill={hair} />
      </>}
      {hairType === 0 && <ellipse cx={cx} cy={headCy-headRy+4} rx={headRx+1} ry={7} fill={hair} />}
      {hairType === 1 && <ellipse cx={cx} cy={headCy-headRy+2} rx={headRx+2} ry={10} fill={hair} />}
      {hairType === 2 && <ellipse cx={cx} cy={headCy-headRy+1} rx={headRx-2} ry={3} fill={hair} opacity="0.35" />}
      {hairType === 3 && <>
        <ellipse cx={cx-3} cy={headCy-headRy+3} rx={headRx+3} ry={7} fill={hair} />
        <path d={`M${cx+5} ${headCy-headRy+2} Q${cx+headRx+2} ${headCy-headRy+8} ${cx+headRx} ${headCy-headRy+16}`} stroke={hair} strokeWidth="4" fill="none" />
      </>}
      {hairType === 4 && <>
        <ellipse cx={cx} cy={headCy-headRy+5} rx={headRx+1} ry={8} fill={hair} />
        <path d={`M${cx-4} ${headCy-headRy+8} L${cx} ${headCy-headRy+14} L${cx+4} ${headCy-headRy+8}`} fill="#cec1a6" />
      </>}
      <ellipse cx={cx} cy={headCy} rx={headRx} ry={headRy} fill={skin} />
      <rect x={cx-5} y={headCy+headRy-2} width="10" height="10" fill={skin} />
      <path d={`M${cx-28} 80 L${cx-14} ${headCy+headRy+5} L${cx} ${headCy+headRy+9} L${cx+14} ${headCy+headRy+5} L${cx+28} 80 Z`} fill={shirt} />
      <path d={`M${cx-8} ${headCy+headRy+4} L${cx} ${headCy+headRy+13} L${cx+8} ${headCy+headRy+4}`} fill="#c4b79e" />
      {browStyle === 0 && <>
        <line x1={cx-11} y1={eyeY-7} x2={cx-4} y2={eyeY-7} stroke={hair} strokeWidth="1.5" strokeLinecap="round" />
        <line x1={cx+4}  y1={eyeY-7} x2={cx+11} y2={eyeY-7} stroke={hair} strokeWidth="1.5" strokeLinecap="round" />
      </>}
      {browStyle === 1 && <>
        <path d={`M${cx-11} ${eyeY-5} Q${cx-7} ${eyeY-9} ${cx-3} ${eyeY-8}`} stroke={hair} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d={`M${cx+3}  ${eyeY-8} Q${cx+7} ${eyeY-9} ${cx+11} ${eyeY-5}`} stroke={hair} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>}
      {browStyle === 2 && <>
        <line x1={cx-11} y1={eyeY-7} x2={cx-4} y2={eyeY-6} stroke={hair} strokeWidth="2.8" strokeLinecap="round" />
        <line x1={cx+4}  y1={eyeY-6} x2={cx+11} y2={eyeY-7} stroke={hair} strokeWidth="2.8" strokeLinecap="round" />
      </>}
      <ellipse cx={cx-7} cy={eyeY} rx="2.8" ry={eyeHeavy ? 1.7 : 2.2} fill="#1c1610" />
      <ellipse cx={cx+7} cy={eyeY} rx="2.8" ry={eyeHeavy ? 1.7 : 2.2} fill="#1c1610" />
      <circle cx={cx-6}  cy={eyeY-0.7} r="0.75" fill="rgba(255,255,255,0.32)" />
      <circle cx={cx+7.8} cy={eyeY-0.7} r="0.75" fill="rgba(255,255,255,0.32)" />
      {hasGlasses && !sillyGlasses && <>
        <rect x={cx-16} y={eyeY-4} width="10" height="7" rx="2" fill="none" stroke="#1a1208" strokeWidth="1.3" />
        <rect x={cx+6}  y={eyeY-4} width="10" height="7" rx="2" fill="none" stroke="#1a1208" strokeWidth="1.3" />
        <line x1={cx-6}  y1={eyeY} x2={cx+6}  y2={eyeY} stroke="#1a1208" strokeWidth="1.3" />
        <line x1={cx-24} y1={eyeY} x2={cx-16} y2={eyeY} stroke="#1a1208" strokeWidth="1" />
        <line x1={cx+16} y1={eyeY} x2={cx+24} y2={eyeY} stroke="#1a1208" strokeWidth="1" />
      </>}
      {sillyGlasses && <>
        {/* Oversized round "silly" glasses */}
        <circle cx={cx-7} cy={eyeY} r="5.5" fill="none" stroke="#1a1208" strokeWidth="1.8" />
        <circle cx={cx+7} cy={eyeY} r="5.5" fill="none" stroke="#1a1208" strokeWidth="1.8" />
        <line x1={cx-1.5} y1={eyeY} x2={cx+1.5} y2={eyeY} stroke="#1a1208" strokeWidth="1.4" />
        <line x1={cx-24}  y1={eyeY} x2={cx-12.5} y2={eyeY} stroke="#1a1208" strokeWidth="1" />
        <line x1={cx+12.5} y1={eyeY} x2={cx+24} y2={eyeY} stroke="#1a1208" strokeWidth="1" />
      </>}
      {hasMustache && (
        <path
          d={`M${cx-9} ${eyeY+11} Q${cx-5} ${eyeY+7} ${cx} ${eyeY+9} Q${cx+5} ${eyeY+7} ${cx+9} ${eyeY+11} Q${cx+5} ${eyeY+14} ${cx} ${eyeY+12} Q${cx-5} ${eyeY+14} ${cx-9} ${eyeY+11} Z`}
          fill={hair} opacity="0.9"
        />
      )}
      {hasBadge && (
        <rect x={cx+10} y={headCy+headRy+3} width="12" height="8" rx="1" fill="#4a7fb5" stroke="#2a5a8a" strokeWidth="0.8" />
      )}
      {!hasMustache && (
        <>
          <path d={`M${cx} ${eyeY+3} L${cx-2} ${eyeY+9} L${cx+2} ${eyeY+9}`} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeLinecap="round" />
          {mouthDown
            ? <path d={`M${cx-6} ${eyeY+15} Q${cx} ${eyeY+14} ${cx+6} ${eyeY+15}`} stroke="#5a3a28" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            : <line x1={cx-6} y1={eyeY+14} x2={cx+6} y2={eyeY+14} stroke="#5a3a28" strokeWidth="1.3" strokeLinecap="round" />
          }
        </>
      )}
      {hasMustache && (
        <path d={`M${cx} ${eyeY+3} L${cx-2} ${eyeY+9} L${cx+2} ${eyeY+9}`} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeLinecap="round" />
      )}
    </svg>
  );
}

// ─── Tiny queue thumbnail for top bar ───────────────────────────────────────
function QueueThumb({ seed, isVIP, isActive, isDone, disguise, isRecurring }: {
  seed: number; isVIP?: boolean; isActive?: boolean; isDone?: boolean;
  disguise?: string; isRecurring?: boolean;
}) {
  if (isDone) return (
    <div className="w-6 h-7 border border-dashed rounded-sm opacity-20" style={{ borderColor: C.border }} />
  );
  return (
    <div className="relative shrink-0 rounded-sm overflow-hidden border"
         style={{
           width: 24, height: 30,
           borderColor: isActive ? C.accent : isRecurring ? '#6aabf066' : '#6f4b1f55',
           boxShadow: isActive ? `0 0 6px ${C.accent}55` : isRecurring ? '0 0 4px #6aabf040' : 'none',
           opacity: isDone ? 0.2 : 1,
         }}>
      <PortraitSVG seed={seed} w={24} h={30} disguise={disguise} />
      {isVIP      && <span className="absolute top-0 right-0.5 text-yellow-300 leading-none" style={{ fontSize: 6 }}>★</span>}
      {isRecurring && !isVIP && <span className="absolute top-0 left-0.5 text-sky-300 leading-none" style={{ fontSize: 6 }}>↩</span>}
    </div>
  );
}



// ─── Citation sound (standalone, no engine dependency) ───────────────────────
function playCitationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Layer 1: brutal low impact thud
    const thud = ctx.createOscillator();
    const thudG = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, now);
    thud.frequency.exponentialRampToValueAtTime(20, now + 0.3);
    thudG.gain.setValueAtTime(0.9, now);
    thudG.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    thud.connect(thudG); thudG.connect(ctx.destination);
    thud.start(now); thud.stop(now + 0.32);

    // Layer 2: harsh descending buzz
    const buzz = ctx.createOscillator();
    const buzzG = ctx.createGain();
    buzz.type = 'sawtooth';
    buzz.frequency.setValueAtTime(220, now + 0.02);
    buzz.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    buzzG.gain.setValueAtTime(0.0, now);
    buzzG.gain.linearRampToValueAtTime(0.55, now + 0.02);
    buzzG.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    buzz.connect(buzzG); buzzG.connect(ctx.destination);
    buzz.start(now); buzz.stop(now + 0.38);

    // Layer 3: high crack on impact
    const crack = ctx.createOscillator();
    const crackG = ctx.createGain();
    crack.type = 'triangle';
    crack.frequency.setValueAtTime(900, now);
    crack.frequency.exponentialRampToValueAtTime(200, now + 0.06);
    crackG.gain.setValueAtTime(0.4, now);
    crackG.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    crack.connect(crackG); crackG.connect(ctx.destination);
    crack.start(now); crack.stop(now + 0.08);
  } catch (_) { /* ignore */ }
}

// ─── Citation Modal ───────────────────────────────────────────────────────────
function CitationModal({ log, onContinue }: { log: DailyLog; onContinue: () => void }) {
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    playCitationSound();
    const t = setTimeout(() => setFlash(false), 180);
    return () => clearTimeout(t);
  }, []);

  const wrongLabel =
    log.hasBribe && log.decision === 'APPROVE' ? 'BRIBE ACCEPTED — FRAUD APPROVED' :
    log.decision === 'APPROVE' ? 'FRAUDULENT FILING APPROVED' :
    log.decision === 'REJECT'  ? 'VALID FILING REJECTED'      :
                                 'WRONG CALL';

  const shortReason = log.citationReason
    ? log.citationReason.split('.')[0].replace(/^(The|This|An|A)\s/i, '').trim().toUpperCase()
    : 'PROCESSING ERROR';

  return (
    <>
      {/* Red screen flash */}
      {flash && (
        <div
          className="absolute inset-0 z-[300] pointer-events-none"
          style={{ background: 'rgba(180,71,63,0.55)' }}
        />
      )}

      {/* Shake + fade-in wrapper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[200] flex items-center justify-center"
        style={{ background: 'rgba(6,1,1,0.92)', backdropFilter: 'blur(2px)' }}
      >
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [0, -10, 10, -8, 8, -4, 4, 0] }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="flex flex-col items-center gap-0 w-[380px]"
        >
          {/* Title */}
          <div
            className="w-full text-center py-3 font-terminal text-xs font-bold uppercase tracking-[0.35em] border-t border-x"
            style={{ borderColor: C.red, background: 'rgba(180,71,63,0.22)', color: C.red }}
          >
            <ShieldAlert className="inline w-3.5 h-3.5 mb-0.5 mr-1.5" />
            Citation Issued
          </div>

          {/* Main panel */}
          <div
            className="w-full border-2 border-t-0 flex flex-col items-center gap-6 px-8 py-8"
            style={{ background: '#100202', borderColor: C.red }}
          >
            {/* Mistake label */}
            <div className="text-center">
              <div className="font-stamped text-2xl tracking-widest uppercase" style={{ color: '#e07070' }}>
                Wrong Decision
              </div>
              <div className="font-terminal text-sm mt-1 uppercase tracking-wider" style={{ color: '#c05050' }}>
                {wrongLabel}
              </div>
            </div>

            {/* Penalty — biggest element */}
            <div className="flex flex-col items-center gap-1">
              <div className="font-terminal text-[10px] uppercase tracking-widest" style={{ color: '#7a3030' }}>
                Penalty
              </div>
              <div
                className="font-stamped leading-none"
                style={{ fontSize: '5rem', color: C.red, textShadow: `0 0 24px ${C.red}88` }}
              >
                {formatMoney(log.earnings)}
              </div>
            </div>

            {/* Reason — short, no paragraph */}
            <div
              className="w-full text-center font-terminal text-xs uppercase tracking-wider px-4 py-2 border"
              style={{ borderColor: C.red + '33', color: '#b06060', background: 'rgba(180,71,63,0.06)' }}
            >
              {shortReason}
            </div>

            {/* Button */}
            <button
              onClick={onContinue}
              className="w-full py-3 font-terminal text-sm font-bold uppercase tracking-[0.3em] border transition-all"
              style={{ borderColor: C.red, color: C.text, background: 'rgba(180,71,63,0.16)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(180,71,63,0.32)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(180,71,63,0.16)')}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ─── Correct decision flash ───────────────────────────────────────────────────
function CorrectFlash({ log, onDone }: { log: DailyLog; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  const isFreeze = log.decision === 'FREEZE';
  const color = isFreeze ? '#6aabf0' : C.green;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[190] pointer-events-none"
    >
      <div className="font-stamped text-4xl uppercase tracking-[0.25em] px-10 py-5 border-4 shadow-2xl"
           style={{
             color,
             borderColor: color,
             background: 'rgba(0,0,0,0.75)',
             boxShadow: `0 0 40px ${color}55, 0 0 80px ${color}22`,
           }}>
        {log.decision === 'APPROVE' ? '✓ APPROVED' : log.decision === 'REJECT' ? '✓ REJECTED' : '✓ FROZEN'}
      </div>
      <div className="text-center mt-2 font-terminal text-sm" style={{ color }}>
        +{formatMoney(log.earnings)}
      </div>
    </motion.div>
  );
}

// ─── Fraud types that trigger escalation report ──────────────────────────────
const MAJOR_FRAUD_TYPES = new Set([
  'money_laundering', 'offshore_accounts', 'insider_trading',
  'capital_gains_misclass', 'shell_company_legal', 'bribe_attempt',
]);
const isMajorFraudLog = (log: DailyLog) =>
  log.wasCorrect && (log.decision === 'FREEZE' || (log.decision === 'REJECT' && MAJOR_FRAUD_TYPES.has(log.fraudType ?? '')));

const FRAUD_LABELS: Record<string, string> = {
  money_laundering:        'Money Laundering',
  offshore_accounts:       'Undeclared Offshore Assets',
  insider_trading:         'Insider Trading',
  capital_gains_misclass:  'Capital Gains Misclassification',
  shell_company_legal:     'Shell Company — Regulatory Violation',
  bribe_attempt:           'Bribery Attempt',
  name_mismatch:           'Identity Falsification',
  ssn_mismatch:            'SSN Fraud',
  w2_mismatch:             'Income Misreporting',
  expense_mismatch:        'Fraudulent Deductions',
  math_error:              'Tax Calculation Fraud',
  tax_error:               'Incorrect Tax Filing',
};

const FREEZE_OUTCOMES: Record<string, string> = {
  money_laundering:       'Financial assets frozen. Criminal investigation launched. Case forwarded to Financial Crimes Unit.',
  offshore_accounts:      'Offshore holdings seized. International compliance violation registered. Assets pending repatriation.',
  insider_trading:        'Trading records impounded. Securities Enforcement Division notified. Account access suspended.',
  capital_gains_misclass: 'Portfolio records seized. Tax liability recalculated and back-taxes levied.',
  shell_company_legal:    'Corporate accounts frozen. Regulatory compliance audit initiated. Board subpoenaed.',
  bribe_attempt:          'Cash seized. Filing frozen. Bribery report filed with Ministry Internal Affairs. Criminal case opened against the filer.',
};
const REJECT_OUTCOMES: Record<string, string> = {
  money_laundering:       'Filing rejected. Evidence packet forwarded to Financial Intelligence Unit for further review.',
  offshore_accounts:      'Filing rejected. Undisclosed foreign accounts flagged for IRS international compliance review.',
  insider_trading:        'Filing rejected. Suspicious trading data forwarded to Securities Enforcement Division.',
  capital_gains_misclass: 'Filing rejected. Gain reclassification logged and sent to tax correction bureau.',
  shell_company_legal:    'Filing rejected. Shell company structure flagged for regulatory compliance audit.',
};
const DEFAULT_OUTCOME = 'Filing flagged. Case forwarded to the Ministry audit division for further investigation.';

// ─── Fraud Escalation Report ──────────────────────────────────────────────────
function FraudEscalationModal({ log, onContinue }: { log: DailyLog; onContinue: () => void }) {
  const fraudLabel   = FRAUD_LABELS[log.fraudType ?? '']   ?? 'Financial Irregularity';
  const isFreeze     = log.decision === 'FREEZE';
  const outcomeMap   = isFreeze ? FREEZE_OUTCOMES : REJECT_OUTCOMES;
  const outcome      = outcomeMap[log.fraudType ?? ''] ?? DEFAULT_OUTCOME;
  const caseNum      = `MF-${log.clientId.slice(-6).toUpperCase()}-${new Date().getFullYear()}`;
  const accentColor  = isFreeze ? '#6aabf0' : '#e0a11b';
  const accentBg     = isFreeze ? 'rgba(58,106,191,0.12)' : 'rgba(180,71,63,0.10)';
  const borderColor  = isFreeze ? '#3a6abf' : C.red;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(4,1,0,0.94)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 220, delay: 0.05 }}
        className="relative w-[520px] border-2 overflow-hidden"
        style={{ background: '#0c0705', borderColor }}
      >
        {/* Big rotated stamp watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div
            className="font-stamped text-7xl uppercase tracking-[0.2em] opacity-[0.06] rotate-[-18deg] whitespace-nowrap"
            style={{ color: accentColor }}
          >
            {isFreeze ? 'ASSETS FROZEN' : 'FRAUD CONFIRMED'}
          </div>
        </div>

        {/* Header bar */}
        <div className="relative px-6 py-4 border-b flex items-start justify-between gap-4"
             style={{ borderColor: borderColor + '55', background: accentBg }}>
          <div>
            <div className="font-terminal text-[9px] uppercase tracking-[0.25em] mb-1" style={{ color: accentColor, opacity: 0.7 }}>
              Ministry of Finance — Fraud Enforcement Division
            </div>
            <div className="font-stamped text-xl tracking-widest uppercase" style={{ color: accentColor }}>
              {isFreeze ? 'Assets Frozen' : 'Fraud Confirmed'}
            </div>
            <div className="font-terminal text-[9px] mt-1 opacity-50">Case No. {caseNum}</div>
          </div>
          {/* Stamp badge */}
          <div className="shrink-0 w-16 h-16 border-2 rounded-full flex flex-col items-center justify-center text-center"
               style={{ borderColor, background: accentBg }}>
            <div className="font-stamped text-[9px] leading-tight uppercase tracking-wide" style={{ color: accentColor }}>
              {isFreeze ? 'FROZEN' : 'FRAUD'}
            </div>
            <div className="font-stamped text-[8px] opacity-50 leading-tight" style={{ color: accentColor }}>
              CONFIRMED
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="relative px-6 py-5 flex flex-col gap-4">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="font-terminal text-[9px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Subject</div>
              <div className="font-terminal text-sm font-bold" style={{ color: C.text }}>
                {log.clientName}{log.isVIP && <span className="ml-1.5 text-yellow-300 text-[10px]">★ VIP</span>}
              </div>
            </div>
            <div>
              <div className="font-terminal text-[9px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Violation</div>
              <div className="font-terminal text-sm font-bold" style={{ color: accentColor }}>{fraudLabel}</div>
            </div>
          </div>

          <div>
            <div className="font-terminal text-[9px] uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>Outcome</div>
            <p className="font-terminal text-xs leading-relaxed" style={{ color: '#d0bc96' }}>{outcome}</p>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-sm" style={{ borderColor: accentColor + '33', background: accentBg }}>
            <div>
              <div className="font-terminal text-[9px] uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>
                {isFreeze ? 'Enforcement Bonus' : 'Detection Reward'}
              </div>
              <div className="font-terminal text-2xl font-bold" style={{ color: C.green }}>
                {formatMoney(log.earnings)}
              </div>
            </div>
            <div className="font-terminal text-[10px] text-right" style={{ color: C.muted }}>
              <div>{isFreeze ? 'Correct FREEZE' : 'Correct REJECT'}</div>
              <div className="mt-0.5" style={{ color: accentColor }}>Major Fraud</div>
            </div>
          </div>
        </div>

        {/* Continue */}
        <div className="relative px-6 pb-6 border-t pt-4" style={{ borderColor: borderColor + '33' }}>
          <button
            onClick={onContinue}
            className="w-full py-3 font-terminal text-sm font-bold uppercase tracking-widest border transition-all"
            style={{ borderColor, color: C.text, background: accentBg }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseOut={e => (e.currentTarget.style.opacity = '1')}
          >
            Confirmed — Continue Shift
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}



// ─── Bribe confirmation dialog ────────────────────────────────────────────────
function BribeConfirmDialog({ total, onAccept, onDecline }: { total: number; onAccept: () => void; onDecline: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-[250] flex items-center justify-center"
      style={{ background: 'rgba(4,2,0,0.88)', backdropFilter: 'blur(3px)' }}
    >
      <div className="flex flex-col items-center gap-0 w-[360px]" style={{ border: `2px solid #7a5c1a`, background: '#0e0906' }}>
        <div className="w-full text-center py-3 font-terminal text-xs font-bold uppercase tracking-[0.3em]" style={{ background: 'rgba(122,92,26,0.18)', color: '#e0a11b', borderBottom: '1px solid #7a5c1a' }}>
          Cash Found In Envelope
        </div>
        <div className="flex flex-col items-center gap-5 px-8 py-7 w-full">
          <p className="font-terminal text-sm text-center leading-relaxed" style={{ color: '#d0bc96' }}>
            The envelope contains <strong style={{ color: '#e0a11b' }}>${total}</strong> in cash. Taking it locks you into approving this filing.
          </p>
          <div className="w-full rounded border-2 px-4 py-4 text-center" style={{ borderColor: '#b4473f', background: 'rgba(180,71,63,0.16)' }}>
            <div className="font-terminal text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: '#ffb3ab' }}>
              WARNING: BRIBE RISK
            </div>
            <div className="mt-2 font-terminal text-sm leading-relaxed" style={{ color: '#f6cdc8' }}>
              Accepting has a <strong style={{ color: '#ffd76a' }}>25% chance</strong> of getting caught.
              If caught, the game ends immediately and you are <strong style={{ color: '#ffd76a' }}>imprisoned/fired</strong>.
            </div>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={onAccept}
              className="flex-1 py-3 font-terminal text-sm font-bold uppercase tracking-widest border-2 transition-colors"
              style={{ borderColor: '#c8a800', color: '#c8a800', background: 'transparent' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(200,168,0,0.12)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              Take ${total}
            </button>
            <button
              onClick={onDecline}
              className="flex-1 py-3 font-terminal text-sm font-bold uppercase tracking-widest border-2 transition-colors"
              style={{ borderColor: '#6f4b1f', color: '#7a5520', background: 'transparent' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(111,75,31,0.15)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              Leave It
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Bribe money on desk — single bill or stack based on amount ───────────────
// brideAmount < 30 → single bill image ($10/$20)
// brideAmount ≥ 30 → stack image ($30-$50)
function BribeStack({ brideAmount, onClick }: { brideAmount: number; onClick: () => void }) {
  const [grabbed, setGrabbed] = useState(false);
  const isStack = brideAmount >= 30;
  const img     = isStack ? stackBillImg : singleBillImg;
  // Stack sits slightly tilted like it was tossed on the desk
  const tilt    = isStack ? 5 : -4;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.08}
      whileDrag={{ scale: 1.05, rotate: 0 }}
      onDragStart={() => setGrabbed(true)}
      onDragEnd={()   => setGrabbed(false)}
      initial={{ opacity: 0, y: -24, rotate: tilt - 8 }}
      animate={{ opacity: 1, y: 0,   rotate: tilt }}
      exit={{ opacity: 0, scale: 0.78, transition: { duration: 0.16 } }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 180, damping: 18 }}
      onClick={() => { playRustle(); onClick(); }}
      title={`$${brideAmount} cash — click to take · drag to move`}
      className="absolute select-none"
      style={{
        bottom: 104,
        left: 338,
        zIndex: 45,
        cursor: grabbed ? 'grabbing' : 'grab',
        touchAction: 'none',
        filter: 'drop-shadow(3px 6px 10px rgba(0,0,0,0.90))',
      }}
    >
      <img
        src={img}
        draggable={false}
        style={{
          display: 'block',
          // Stack image wider than single to reflect it's physically bigger
          width:  isStack ? 150 : 110,
          imageRendering: 'pixelated',
          userSelect: 'none',
        }}
        alt={isStack ? 'Stack of bills' : 'Single bill'}
      />
      <div
        className="font-terminal text-[10px] font-bold tracking-widest text-center mt-1 pointer-events-none"
        style={{ color: '#8a9a60', textShadow: '0 1px 4px rgba(0,0,0,0.95)' }}
      >
        ${brideAmount} · click to take
      </div>
    </motion.div>
  );
}

// ─── Main Desk Page ──────────────────────────────────────────────────────────
export default function Desk({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, stampAction, processDecision, callNextClient, endDay, actOnMemo, dismissMemo } = engine;

  const [topZIndex, setTopZIndex]     = useState(10);
  const [docZIndices, setDocZIndices] = useState<Record<string, number>>({});
  const [highlightGroup, setHighlightGroup] = useState<{ group: string; value: string } | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<DailyLog | null>(null);
  const [envelopePhase, setEnvelopePhase] = useState<'sealed' | 'opening' | 'open'>(state.currentClient ? 'sealed' : 'open');
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [bribeTaken, setBribeTaken] = useState(false);
  const [showBribeConfirm, setShowBribeConfirm] = useState(false);
  const [bribePop, setBribePop]     = useState<number | null>(null);
  const [bribeConfiscated, setBribeConfiscated] = useState(false);
  const prevLogCount = useRef(0);

  const dailyGoal   = DAILY_GOALS[state.day] ?? 300;
  const dailyEarned = state.dailyLogs.reduce((a, l) => a + l.earnings, 0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (activeTool === 'calculator') {
        if (e.key === 'Escape') setActiveTool(null);
        return;
      }
      const toolKeys: Record<string, ToolType> = { '1': 'calculator', '2': 'uv', '3': 'ledger', '4': 'family' };
      const tool = toolKeys[e.key];
      if (tool) {
        e.preventDefault();
        setActiveTool(prev => prev === tool ? null : tool);
      }
      if (e.key === 'Escape') setActiveTool(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTool]);

  const processedCount = 4 - state.clientsQueue.length - (state.currentClient ? 1 : 0);

  // Detect new decisions → trigger feedback
  useEffect(() => {
    if (state.dailyLogs.length > prevLogCount.current) {
      const last = state.dailyLogs[state.dailyLogs.length - 1];
      setDecisionFeedback(last);
      prevLogCount.current = state.dailyLogs.length;
    }
  }, [state.dailyLogs.length]);

  useEffect(() => {
    if (state.currentClient) {
      setEnvelopePhase('sealed');
      const z: Record<string, number> = {};
      state.currentClient.documents.forEach((d, i) => { z[d.id] = i + 1; });
      setDocZIndices(z);
      setTopZIndex(state.currentClient.documents.length + 1);
      setHighlightGroup(null);
    } else {
      setEnvelopePhase('open');
      setDocZIndices({});
      setHighlightGroup(null);
    }
    setBribeTaken(false);
    setShowBribeConfirm(false);
    setBribePop(null);
    setBribeConfiscated(false);
  }, [state.currentClient?.id]);

  const handleEnvelopeClick = useCallback(() => {
    if (envelopePhase !== 'sealed') return;
    setEnvelopePhase('opening');
    setTimeout(() => setEnvelopePhase('open'), 680);
  }, [envelopePhase]);

  const bringToFront = (id: string) => {
    setTopZIndex(z => z + 1);
    setDocZIndices(prev => ({ ...prev, [id]: topZIndex }));
  };

  // Click a field → highlight matching values across all documents
  const handleFieldClick = useCallback((key: string, value: string) => {
    const suffix = key.split(':')[1];
    const group = fieldGroup(suffix);
    if (!group) return;
    setHighlightGroup(prev =>
      prev && prev.group === group && prev.value === value ? null : { group, value }
    );
  }, []);

  const isDeskDisabled         = !!stampAction || !state.currentClient || envelopePhase !== 'open';
  const isRejectFreezeDisabled = isDeskDisabled || bribeTaken;
  const isContraband           = !!state.currentClient?.isContraband;
  const hasClient              = !!state.currentClient;

  // Bribe stack info
  const clientBribeAmount = state.currentClient?.brideAmount ?? 0;
  const showBribeStack    = !!state.currentClient?.hasBribe && envelopePhase === 'open' && !bribeTaken;
  const canCallNext    = state.clientsQueue.length > 0;
  const isDayEnd       = state.status === 'DAY_END';
  const testBribeNext = () => {
    engine.forceNextBribeCase();
    if (!hasClient && state.status === 'PLAYING') {
      callNextClient();
    }
  };

  // Document initial positions — tight, so fields can be compared without dragging
  const DOC_POS = [
    { x: 24,  y: 60  },
    { x: 160, y: 44  },
    { x: 300, y: 72  },
    { x: 440, y: 56  },
  ];

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden relative"
      style={{ background: C.bg, color: C.text }}
    >

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 z-40 flex items-center justify-between px-5 h-12"
           style={{ background: '#0d0906', borderBottom: `1px solid ${C.border}` }}>

        {/* Left: title + queue strip + memo chip */}
        <div className="flex items-center gap-4">
          <span className="font-stamped text-base tracking-widest" style={{ color: C.accent }}>
            TAXES PLEASE
          </span>

          {/* Queue thumbnails */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: processedCount }).map((_, i) => (
              <QueueThumb key={`done-${i}`} seed={0} isDone />
            ))}
            {state.currentClient && (
              <QueueThumb
                seed={state.currentClient.avatarSeed}
                isVIP={state.currentClient.isVIP}
                disguise={state.currentClient.disguise}
                isRecurring={!!state.currentClient.recurringId}
                isActive
              />
            )}
            {state.clientsQueue.map(c => (
              <QueueThumb
                key={c.id}
                seed={c.avatarSeed}
                isVIP={c.isVIP}
                disguise={c.disguise}
                isRecurring={!!c.recurringId}
              />
            ))}
            {Array.from({ length: Math.max(0, 4 - processedCount - (hasClient ? 1 : 0) - state.clientsQueue.length) }).map((_, i) => (
              <div key={`slot-${i}`} className="w-6 h-7 border border-dashed rounded-sm opacity-10"
                   style={{ borderColor: C.border }} />
            ))}
          </div>

          {/* Event badge */}
          {state.activeEvent && (
            <div className="flex items-center gap-1.5 font-terminal text-[10px] px-2 py-0.5 rounded border"
                 style={{ color: '#e0901b', borderColor: '#e0901b44', background: 'rgba(224,144,27,0.07)' }}>
              <TrendingDown className="w-3 h-3" />
              {state.activeEvent.title}
            </div>
          )}

          {/* Inline memo chip — non-blocking, replaces the floating sticky note */}
          {state.activeMemo && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded border font-terminal text-[10px]"
                 style={{ borderColor: '#d97706aa', background: 'rgba(220,180,30,0.08)', color: '#fcd34d' }}>
              <FileText className="w-3 h-3 shrink-0" />
              <span className="max-w-[200px] truncate">{state.activeMemo.subject}</span>
              {!state.memoActed ? (
                <>
                  <button onClick={actOnMemo}
                    className="ml-1 px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                    style={{ borderColor: '#d97706', color: '#fcd34d', background: 'rgba(220,150,0,0.15)' }}>
                    Act
                  </button>
                  <button onClick={dismissMemo}
                    className="px-1 text-[10px] opacity-40 hover:opacity-70 transition-opacity">
                    ✕
                  </button>
                </>
              ) : (
                <span className="ml-1 text-green-400 text-[9px] font-bold">✓ Noted</span>
              )}
            </div>
          )}
        </div>

        {/* Right: stats */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-3 py-1 border rounded" style={{ borderColor: C.green + '44', background: 'rgba(63,163,92,0.07)' }}>
            <DollarSign className="w-4 h-4" style={{ color: C.green }} />
            <span className="font-terminal text-xl font-bold leading-none" style={{ color: C.green }}>
              {formatMoney(state.money)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-terminal text-xs" style={{ color: C.muted }}>
            <Clock className="w-3.5 h-3.5" />
            <span>DAY {state.day}/7</span>
          </div>
          <div className="flex items-center gap-1.5 font-terminal text-xs" style={{ color: state.citations > 0 ? C.red : C.muted }}>
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{state.citations}/5</span>
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── CENTER DESK (dominant) ─────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: C.desk }}>

          {/* Subtle grain / grid at very low opacity */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              linear-gradient(rgba(111,75,31,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(111,75,31,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }} />

          {/* Stamp animation (centered over desk) */}
          <Stamp type={stampAction} />

          {/* Highlight hint */}
          {highlightGroup && hasClient && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div className="font-terminal text-[11px] px-3 py-1.5 rounded-full uppercase tracking-wider border"
                   style={{ background: 'rgba(14,10,8,0.85)', borderColor: `${C.accent}55`, color: C.accent }}>
                Comparing <strong>{highlightGroup.group}</strong> — green = match · red = mismatch
              </div>
            </div>
          )}

          {/* Empty desk state */}
          {!hasClient && state.status === 'PLAYING' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="font-terminal text-[11px] uppercase tracking-[0.25em] opacity-15 border border-dashed p-8"
                   style={{ borderColor: C.border, color: C.muted }}>
                {canCallNext ? 'Next citizen waiting' : 'All cases processed'}
              </div>
            </div>
          )}

          {/* Documents — only render after envelope is opened */}
          {envelopePhase === 'open' && (
            <div className={cn(
              'absolute inset-0 transition-opacity duration-500',
              isDeskDisabled ? 'opacity-40 pointer-events-none' : 'opacity-100',
            )}>
              {state.currentClient?.documents.map((doc, idx) => (
                <DraggablePaper
                  key={state.currentClient!.id + doc.id}
                  doc={doc}
                  initialX={DOC_POS[idx]?.x ?? 40 + idx * 160}
                  initialY={DOC_POS[idx]?.y ?? 60}
                  zIndex={docZIndices[doc.id] || 1}
                  onFocus={() => bringToFront(doc.id)}
                  highlightGroup={highlightGroup}
                  onFieldClick={handleFieldClick}
                  isNew={idx === 0}
                  uvActive={activeTool === 'uv'}
                  isFraud={!!state.currentClient?.isFraud}
                />
              ))}
            </div>
          )}

          {/* ── Bribe money on desk ───────────────────────────────────────────── */}
          <AnimatePresence>
            {showBribeStack && (
              <BribeStack
                brideAmount={clientBribeAmount}
                onClick={() => setShowBribeConfirm(true)}
              />
            )}
          </AnimatePresence>

          {/* ── Bribe taken indicator ─────────────────────────────────────────── */}
          <AnimatePresence>
            {bribeTaken && envelopePhase === 'open' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute z-40 font-terminal text-xs uppercase tracking-widest px-3 py-1.5 rounded border"
                style={{ bottom: 28, right: 48, color: '#c8a800', borderColor: '#c8a80044', background: 'rgba(200,168,0,0.08)' }}
              >
                ✓ ${clientBribeAmount} Accepted — Approve Only
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Green money pop on bribed Approve ─────────────────────────────── */}
          <AnimatePresence>
            {bribePop !== null && (
              <motion.div
                key="bribe-pop"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -72 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute z-[300] pointer-events-none font-terminal font-bold text-3xl"
                style={{
                  bottom: 90,
                  right: 80,
                  color: '#3fa35c',
                  textShadow: '0 0 20px rgba(63,163,92,0.9), 0 0 6px rgba(63,163,92,0.6)',
                  letterSpacing: '0.08em',
                }}
              >
                +${bribePop}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Confiscated flash on Reject/Freeze with bribe on desk ─────────── */}
          <AnimatePresence>
            {bribeConfiscated && (
              <motion.div
                key="confiscated"
                initial={{ opacity: 1, scale: 0.85 }}
                animate={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="absolute z-[300] pointer-events-none font-terminal font-bold text-base uppercase tracking-[0.3em]"
                style={{
                  bottom: 90,
                  right: 32,
                  color: '#b44740',
                  textShadow: '0 0 12px rgba(180,71,64,0.8)',
                }}
              >
                ✗ CONFISCATED
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Bribe confirm dialog ──────────────────────────────────────────── */}
          <AnimatePresence>
            {showBribeConfirm && (
              <BribeConfirmDialog
                total={clientBribeAmount}
                onAccept={() => {
                  setShowBribeConfirm(false);
                  // 25% chance of getting caught — ends the game immediately
                  if (Math.random() < 0.25) {
                    engine.triggerBribeCaught();
                  } else {
                    setBribeTaken(true);
                    engine.addMoney(clientBribeAmount);
                  }
                }}
                onDecline={() => setShowBribeConfirm(false)}
              />
            )}
          </AnimatePresence>

          {/* ── Envelope overlay ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {state.currentClient && envelopePhase !== 'open' && (
              <motion.div
                key="envelope-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 z-30 flex items-center justify-center"
                style={{ background: 'rgba(8,5,3,0.78)', cursor: 'pointer' }}
                onClick={handleEnvelopeClick}
              >
                <motion.div
                  initial={{ x: 480, rotate: 12, opacity: 0 }}
                  animate={{
                    x:       envelopePhase === 'opening' ? -700 : 0,
                    y:       envelopePhase === 'opening' ? -130 : 0,
                    rotate:  envelopePhase === 'opening' ? -22  : 2,
                    opacity: envelopePhase === 'opening' ? 0    : 1,
                  }}
                  transition={{
                    type:      'spring',
                    stiffness: envelopePhase === 'opening' ? 340 : 180,
                    damping:   envelopePhase === 'opening' ? 30  : 22,
                  }}
                >
                  <EnvelopeSVG client={state.currentClient} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TOOL OVERLAYS (inside workspace for absolute positioning) ──── */}
          <AnimatePresence>
            {activeTool === 'calculator' && (
              <CalculatorOverlay key="calc" onClose={() => setActiveTool(null)} />
            )}
            {activeTool === 'ledger' && (
              <LedgerOverlay
                key="ledger"
                onClose={() => setActiveTool(null)}
                money={state.money}
                dailyGoal={dailyGoal}
                dailyEarned={dailyEarned}
              />
            )}
            {activeTool === 'family' && (
              <FamilyMonitorOverlay
                key="family"
                onClose={() => setActiveTool(null)}
                family={state.family}
              />
            )}
          </AnimatePresence>
          {activeTool === 'uv' && <UVScannerOverlay />}
        </div>

        {/* ── INSPECTOR TOOLBAR ────────────────────────────────────────────────── */}
        <InspectorToolbar
          activeTool={activeTool}
          onSetTool={setActiveTool}
        />
      </div>

      {/* ── BOTTOM ACTION BAR ────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-center gap-3 z-40 px-6 py-4"
           style={{ background: '#0d0906', borderTop: `1px solid ${C.border}` }}>

        {isDayEnd ? (
          <button
            onClick={endDay}
            className="flex items-center gap-3 px-12 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest cursor-pointer transition-all"
            style={{ background: C.panel, borderColor: C.accent, color: C.accent }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(224,161,27,0.12)'; }}
            onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
          >
            {state.day >= 7 ? 'Submit Final Report →' : 'End Shift →'}
          </button>
        ) : hasClient ? (
          <>
            {/* Approve — pulses amber when bribe taken */}
            <button
              onClick={() => {
                if (bribeTaken) {
                  setBribePop(clientBribeAmount);
                  setTimeout(() => setBribePop(null), 1400);
                }
                processDecision('APPROVE', 0);
              }}
              disabled={isDeskDisabled}
              className={cn(
                'flex items-center gap-3 px-10 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest transition-all',
                isDeskDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                bribeTaken && !isDeskDisabled && 'animate-pulse',
              )}
              style={{
                background: C.panel,
                borderColor: bribeTaken ? '#c8a800' : C.green,
                color:       bribeTaken ? '#c8a800' : C.green,
              }}
              onMouseOver={e => { if (!isDeskDisabled) e.currentTarget.style.background = bribeTaken ? 'rgba(200,168,0,0.12)' : 'rgba(63,163,92,0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
            >
              <CheckCircle2 className="w-5 h-5" />
              {bribeTaken ? 'Approve (Bribed)' : 'Approve'}
            </button>

            {/* Reject — locked when bribe taken */}
            <button
              onClick={() => {
                if (showBribeStack) {
                  setBribeConfiscated(true);
                  setTimeout(() => setBribeConfiscated(false), 900);
                }
                processDecision('REJECT', 0);
              }}
              disabled={isRejectFreezeDisabled}
              className={cn(
                'flex items-center gap-3 px-10 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest transition-all',
                isRejectFreezeDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              )}
              style={{ background: C.panel, borderColor: C.red, color: C.red }}
              onMouseOver={e => { if (!isRejectFreezeDisabled) e.currentTarget.style.background = 'rgba(180,71,63,0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>

            {/* Freeze — locked when bribe taken */}
            <button
              onClick={() => {
                if (showBribeStack) {
                  setBribeConfiscated(true);
                  setTimeout(() => setBribeConfiscated(false), 900);
                }
                processDecision('FREEZE', 0);
              }}
              disabled={isRejectFreezeDisabled}
              className={cn(
                'flex items-center gap-3 px-10 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest transition-all',
                isContraband && !isRejectFreezeDisabled && 'animate-pulse',
                isRejectFreezeDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
              )}
              style={{ background: C.panel, borderColor: '#3a6abf', color: '#7ab0f0' }}
              onMouseOver={e => { if (!isRejectFreezeDisabled) e.currentTarget.style.background = 'rgba(58,106,191,0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
            >
              <Snowflake className="w-5 h-5" />
              Freeze
              {isContraband && <AlertTriangle className="w-4 h-4 ml-1 text-yellow-400" />}
            </button>
          </>
        ) : (
          <button
            onClick={canCallNext ? callNextClient : undefined}
            disabled={!canCallNext}
            className={cn(
              'flex items-center gap-3 px-12 py-4 border-2 font-terminal text-base font-bold uppercase tracking-widest transition-all',
              canCallNext ? 'cursor-pointer' : 'opacity-30 cursor-not-allowed',
            )}
            style={{ background: C.panel, borderColor: canCallNext ? C.accent : C.border, color: canCallNext ? C.accent : C.muted }}
            onMouseOver={e => { if (canCallNext) e.currentTarget.style.background = 'rgba(224,161,27,0.12)'; }}
            onMouseOut={e => { e.currentTarget.style.background = C.panel; }}
          >
            {canCallNext ? '▶  Pull from Pile' : 'Queue Empty — Shift Complete'}
          </button>
        )}

      </div>

      {/* ── Decision feedback overlays ───────────────────────────────────────── */}
      <AnimatePresence>
        {decisionFeedback && !decisionFeedback.wasCorrect && (
          <CitationModal
            key="citation"
            log={decisionFeedback}
            onContinue={() => setDecisionFeedback(null)}
          />
        )}
        {decisionFeedback && isMajorFraudLog(decisionFeedback) && (
          <FraudEscalationModal
            key="escalation"
            log={decisionFeedback}
            onContinue={() => setDecisionFeedback(null)}
          />
        )}
        {decisionFeedback && decisionFeedback.wasCorrect && !isMajorFraudLog(decisionFeedback) && (
          <CorrectFlash
            key="flash"
            log={decisionFeedback}
            onDone={() => setDecisionFeedback(null)}
          />
        )}
      </AnimatePresence>

      {/* ── SKIP DAY BUTTON (testing) ────────────────────────────────────────── */}
      <button
        onClick={endDay}
        className="fixed bottom-4 left-4 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 text-xs font-terminal uppercase tracking-wider z-50 transition-colors"
        title="Skip to next day (testing)"
      >
        Skip Day →
      </button>
      <button
        onClick={testBribeNext}
        className="fixed bottom-14 left-4 px-3 py-2 rounded border font-terminal text-[10px] uppercase tracking-widest z-50"
        style={{ background: 'rgba(20,15,10,0.96)', borderColor: '#7a5c1a', color: '#e0a11b' }}
        title="Force the next client to carry a bribe"
      >
        Test Bribe
      </button>
    </div>
  );
}
