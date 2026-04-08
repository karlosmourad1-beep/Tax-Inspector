import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameEngine } from '@/hooks/useGameEngine';
import { DAILY_EVENTS } from '@/lib/narrative';

// ─── Noise data URL for photo grain overlay ───────────────────────────────────
const NOISE_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ─── Event metadata ───────────────────────────────────────────────────────────
const EVENT_META: Record<string, {
  headline:    string;
  subline:     string;
  effect:      string;
  body:        string;
  caption:     string;
  side1_hed:   string;
  side1:       string;
  side2_hed:   string;
  side2:       string;
  accentColor: string;
}> = {
  market_shock: {
    headline:    'MARKET PANIC',
    subline:     'Emergency austerity decree issued before dawn',
    effect:      '⚠  CLERK WAGES REDUCED 30% TODAY  ⚠',
    body:        'Ministry officials cited "systemic instability" as justification for emergency wage reductions across all processing districts. All clerk salaries will be reduced effective immediately. Error penalties are doubled for this period. Citizens are advised to expect delays and to carry identification.',
    caption:     'Crowds gathered outside the Exchange Ministry before dawn as news of the decree spread.',
    side1_hed:   'BANK QUEUES',
    side1:       'Withdrawal limits imposed at all Ministry-affiliated banks. Citizens advised to carry identification and ration documentation at all times.',
    side2_hed:   'DEPUTY MINISTER',
    side2:       '"We must stabilize the fiscal ledger before any recovery can begin." Officials would not comment on duration of measures.',
    accentColor: '#8b1a1a',
  },
  hyperinflation: {
    headline:    'COST OF LIVING CRISIS',
    subline:     'Ministry announces emergency index adjustment — costs deducted automatically',
    effect:      '⚠  $120 AUTO-DEDUCTED FROM ALL WAGES  ⚠',
    body:        'The cost of living index has surged to its highest recorded level in Ministry history. Rents, food, and essential expenses will be deducted automatically from all wages this period. Capital gains filings are up 40% — Schedule D cross-reference is now mandatory for all submitted returns.',
    caption:     'Citizens queue through the night as shelves empty across the district.',
    side1_hed:   'SCHEDULE D ALERT',
    side1:       'Short-term vs. long-term capital gains classification errors now carry doubled penalties. Cross-reference all bracket tables.',
    side2_hed:   'BUREAU STATEMENT',
    side2:       '"The index reflects reality," said the Ministry\'s Bureau of Economic Truth. No further comment was offered to the press.',
    accentColor: '#7a4010',
  },
  audit_sweep: {
    headline:    'MINISTRY AUDIT SWEEP',
    subline:     'Final performance review begins — every decision will be scrutinized',
    effect:      '⚠  YOUR PERMANENT RECORD IS BEING COMPILED  ⚠',
    body:        'Senior oversight officials will review every decision made during today\'s processing window. Accuracy scores determine your final classification and permanent employment record. All citations from the full seven-day period will be individually reviewed by the Ministry compliance board. Wages are increased 25% as a final incentive.',
    caption:     'Ministry oversight officials assembled outside District Processing offices before morning shift.',
    side1_hed:   'COMMENDATIONS',
    side1:       'Clerks with exemplary accuracy records may receive commendation certificates. Perfect records are eligible for grade advancement.',
    side2_hed:   'INTERNAL MEMO 7-FINAL',
    side2:       '"The Ministry sees everything." Memo #7-Final distributed to all processing clerks. No exceptions.',
    accentColor: '#5a4a08',
  },
};

// ─── Photo wrapper: grain + vignette over any SVG ────────────────────────────
function PhotoWrapper({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div>
      <div style={{ position: 'relative', border: '1.5px solid #2a2018', overflow: 'hidden', filter: 'contrast(1.06) brightness(0.92)' }}>
        {children}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE_URL, backgroundSize: '180px 180px', opacity: 0.22, mixBlendMode: 'multiply', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 42%, transparent 38%, rgba(0,0,0,0.38) 100%)', pointerEvents: 'none' }} />
      </div>
      <div style={{ fontSize: 6.5, fontStyle: 'italic', color: '#3a3028', marginTop: 3, lineHeight: 1.35, fontFamily: 'Georgia,"Times New Roman",serif' }}>
        {caption}
      </div>
    </div>
  );
}

// ─── PHOTO 1: Market Shock — Panicking crowd outside exchange building ─────────
function MarketShockPhoto() {
  return (
    <svg viewBox="0 0 198 158" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
      {/* Sky */}
      <rect width="198" height="158" fill="#b8b2aa"/>
      <rect width="198" height="98" fill="#c6c0b8"/>
      {/* Clouds */}
      <ellipse cx="45" cy="22" rx="42" ry="17" fill="#d2ccc4" opacity="0.65"/>
      <ellipse cx="155" cy="16" rx="55" ry="20" fill="#cec8c0" opacity="0.5"/>
      <ellipse cx="110" cy="30" rx="28" ry="10" fill="#d0cac2" opacity="0.4"/>
      {/* Exchange building body */}
      <rect x="28" y="52" width="142" height="82" fill="#7e7870"/>
      {/* Attic / frieze band */}
      <rect x="24" y="44" width="150" height="10" fill="#6e6860"/>
      {/* Pediment */}
      <polygon points="24,44 174,44 160,24 38,24" fill="#686258"/>
      {/* Pediment acroteria */}
      <rect x="22" y="42" width="152" height="4" fill="#5a5448"/>
      {/* Columns — 5 across */}
      {[44, 69, 94, 119, 144].map((x, i) => (
        <g key={i}>
          <rect x={x} y={26} width={9} height={108} fill="#545048"/>
          <rect x={x - 2} y={24} width={13} height={4} fill="#4a4440"/>
          <rect x={x - 2} y={130} width={13} height={4} fill="#4a4440"/>
        </g>
      ))}
      {/* Building windows / dark recesses */}
      {[35, 78, 120, 158].map((x, i) => (
        <rect key={i} x={x} y={68} width={15} height={22} fill="#3e3c38" rx="0.5"/>
      ))}
      {[35, 78, 120, 158].map((x, i) => (
        <rect key={i} x={x} y={100} width={15} height={20} fill="#3e3c38" rx="0.5"/>
      ))}
      {/* Entrance doors (center) */}
      <rect x="87" y="100" width="24" height="34" fill="#343230"/>
      {/* Steps */}
      <rect x="16" y="132" width="166" height="6" fill="#686460"/>
      <rect x="8"  y="138" width="182" height="6" fill="#747270"/>
      <rect x="0"  y="144" width="198" height="14" fill="#808080"/>
      {/* Ground */}
      <rect x="0" y="144" width="198" height="14" fill="#6e6c6a"/>
      {/* Crowd of panicking figures — dark silhouettes */}
      {/* Figure 1 — arms raised left */}
      <g fill="#2a2420">
        <ellipse cx="22" cy="134" rx="5" ry="5.5"/>
        <rect x="17" y="139" width="10" height="16" rx="1"/>
        <line x1="22" y1="141" x2="11" y2="130" stroke="#2a2420" strokeWidth="3" strokeLinecap="round"/>
        <line x1="22" y1="141" x2="32" y2="132" stroke="#2a2420" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* Figure 2 */}
      <g fill="#1e1a18">
        <ellipse cx="46" cy="132" rx="5" ry="5.5"/>
        <rect x="41" y="137" width="10" height="18" rx="1"/>
        <line x1="46" y1="139" x2="38" y2="128" stroke="#1e1a18" strokeWidth="3" strokeLinecap="round"/>
        <line x1="46" y1="139" x2="56" y2="131" stroke="#1e1a18" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* Figure 3 */}
      <g fill="#2a2420">
        <ellipse cx="70" cy="133" rx="5" ry="5.5"/>
        <rect x="65" y="138" width="10" height="17" rx="1"/>
        <line x1="70" y1="140" x2="62" y2="130" stroke="#2a2420" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* Figure 4 */}
      <g fill="#1a1816">
        <ellipse cx="93" cy="131" rx="5.5" ry="6"/>
        <rect x="87" y="137" width="11" height="18" rx="1"/>
        <line x1="93" y1="139" x2="103" y2="129" stroke="#1a1816" strokeWidth="3" strokeLinecap="round"/>
        <line x1="93" y1="139" x2="83" y2="131" stroke="#1a1816" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* Figure 5 */}
      <g fill="#2a2420">
        <ellipse cx="118" cy="132" rx="5" ry="5.5"/>
        <rect x="113" y="137" width="10" height="17" rx="1"/>
        <line x1="118" y1="139" x2="108" y2="130" stroke="#2a2420" strokeWidth="3" strokeLinecap="round"/>
        <line x1="118" y1="139" x2="128" y2="129" stroke="#2a2420" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* Figure 6 */}
      <g fill="#1e1a18">
        <ellipse cx="141" cy="133" rx="5" ry="5.5"/>
        <rect x="136" y="138" width="10" height="16" rx="1"/>
        <line x1="141" y1="140" x2="133" y2="131" stroke="#1e1a18" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* Figure 7 — arms both up */}
      <g fill="#2a2420">
        <ellipse cx="164" cy="132" rx="5" ry="5.5"/>
        <rect x="159" y="137" width="10" height="17" rx="1"/>
        <line x1="164" y1="139" x2="154" y2="129" stroke="#2a2420" strokeWidth="3" strokeLinecap="round"/>
        <line x1="164" y1="139" x2="174" y2="129" stroke="#2a2420" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* Figure 8 */}
      <g fill="#1a1816">
        <ellipse cx="186" cy="134" rx="5" ry="5.5"/>
        <rect x="181" y="139" width="10" height="14" rx="1"/>
        <line x1="186" y1="141" x2="178" y2="131" stroke="#1a1816" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* ── Stock chart inset (top-left) ── */}
      <rect x="5" y="5" width="68" height="42" fill="rgba(238,230,218,0.93)"/>
      <rect x="5" y="5" width="68" height="7" fill="rgba(190,178,162,0.95)"/>
      <text x="8" y="11" fontSize="4.5" fill="#2a2018" fontFamily="Georgia,serif" fontWeight="bold">EXCHANGE INDEX</text>
      <line x1="10" y1="43" x2="70" y2="43" stroke="#8a7860" strokeWidth="0.7"/>
      <line x1="10" y1="13" x2="10" y2="43" stroke="#8a7860" strokeWidth="0.7"/>
      <polyline points="12,22 22,20 30,28 40,17 50,25 60,38 70,43"
        stroke="#3a3028" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <polyline points="12,22 22,20 30,28 40,17 50,25 60,38 70,43"
        stroke="#8b1a1a" strokeWidth="0.8" fill="none" strokeLinejoin="round" opacity="0.8"/>
      {/* ── Smoke / atmosphere rising from crowd ── */}
      <ellipse cx="90" cy="118" rx="12" ry="5" fill="#b0a89e" opacity="0.35"/>
      <ellipse cx="130" cy="112" rx="16" ry="6" fill="#b0a89e" opacity="0.28"/>
      <ellipse cx="60" cy="120" rx="10" ry="4" fill="#b0a89e" opacity="0.3"/>
    </svg>
  );
}

// ─── PHOTO 2: Hyperinflation — Empty shelves, long queue ─────────────────────
function HyperinflationPhoto() {
  return (
    <svg viewBox="0 0 198 158" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
      {/* Background */}
      <rect width="198" height="158" fill="#c2bcb4"/>
      {/* Sky */}
      <rect width="198" height="90" fill="#ccC6be"/>
      {/* Overcast clouds */}
      <ellipse cx="60" cy="20" rx="55" ry="18" fill="#d8d2ca" opacity="0.6"/>
      <ellipse cx="160" cy="28" rx="45" ry="14" fill="#d0cac2" opacity="0.5"/>
      {/* Background buildings (left side) */}
      <rect x="0"   y="18" width="55" height="108" fill="#787068"/>
      {/* Windows left building */}
      {[[8,28],[26,28],[8,50],[26,50],[8,72],[26,72]].map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={14} height={12} fill={i%3===0?"#4a4640":"#686460"} rx="0.5"/>
      ))}
      {/* Background buildings (right side) */}
      <rect x="143" y="22" width="55" height="104" fill="#787068"/>
      {/* Windows right building */}
      {[[148,32],[166,32],[148,52],[166,52],[148,72],[166,72]].map(([x,y],i) => (
        <rect key={i} x={x} y={y} width={14} height={12} fill={i%2===0?"#4a4640":"#686460"} rx="0.5"/>
      ))}
      {/* Central storefront */}
      <rect x="50" y="38" width="98" height="90" fill="#7c7872"/>
      {/* Store sign fascia */}
      <rect x="50" y="38" width="98" height="14" fill="#686460"/>
      {/* Store name placard */}
      <rect x="56" y="41" width="86" height="8" fill="#5a5450"/>
      <text x="99" y="47" textAnchor="middle" fontSize="5" fill="#c0b8a8" fontFamily="Georgia,serif" letterSpacing="1">STATE PROVISIONS</text>
      {/* Large window / interior view */}
      <rect x="54" y="54" width="90" height="52" fill="#686460"/>
      {/* Shelves inside — horizontal lines with empty rect spots */}
      {[60, 72, 84, 96].map((y, row) => (
        <g key={row}>
          <rect x="56" y={y} width="86" height="2" fill="#5a5450"/>
          {[58, 72, 86, 100, 114, 128].map((x, col) => (
            <rect key={col} x={x} y={y - 9} width={10} height={9}
              fill={row === 1 && col < 2 ? "#8a8278" : row === 2 && col === 3 ? "#7a7268" : "none"}
              stroke="#5a5450" strokeWidth="0.5"/>
          ))}
        </g>
      ))}
      {/* "SOLD OUT" sticker on window */}
      <rect x="76" y="80" width="46" height="14" fill="#3a3428" opacity="0.9" transform="rotate(-8 99 87)"/>
      <text x="99" y="89" textAnchor="middle" fontSize="6.5" fill="#d8d0c0" fontFamily="Georgia,serif"
        fontWeight="bold" letterSpacing="1.5" transform="rotate(-8 99 87)">SOLD OUT</text>
      {/* Store door — shuttered */}
      <rect x="80" y="106" width="38" height="22" fill="#5a5450"/>
      {[108,111,114,117,120,123,126].map((y, i) => (
        <line key={i} x1="80" y1={y} x2="118" y2={y} stroke="#686460" strokeWidth="0.8"/>
      ))}
      {/* Ground / pavement */}
      <rect x="0"  y="128" width="198" height="8"  fill="#969290"/>
      <rect x="0"  y="136" width="198" height="22" fill="#888480"/>
      {/* Pavement cracks */}
      <line x1="30" y1="136" x2="40" y2="158" stroke="#7a7672" strokeWidth="0.6"/>
      <line x1="80" y1="140" x2="88" y2="158" stroke="#7a7672" strokeWidth="0.5"/>
      {/* Queue of figures receding left to right (perspective) */}
      {/* Person 1 — closest, largest, right side */}
      <g fill="#2a2420">
        <ellipse cx="160" cy="121" rx="6" ry="7"/>
        <rect x="154" y="128" width="12" height="22" rx="1"/>
        <line x1="160" y1="130" x2="150" y2="126" stroke="#2a2420" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="160" y1="130" x2="170" y2="126" stroke="#2a2420" strokeWidth="3.5" strokeLinecap="round"/>
      </g>
      {/* Person 2 */}
      <g fill="#1e1a18">
        <ellipse cx="175" cy="122" rx="5.5" ry="6.5"/>
        <rect x="169" y="129" width="11" height="20" rx="1"/>
        <line x1="175" y1="131" x2="166" y2="127" stroke="#1e1a18" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* Person 3 — medium */}
      <g fill="#2a2420">
        <ellipse cx="188" cy="124" rx="5" ry="5.5"/>
        <rect x="183" y="130" width="10" height="17" rx="1"/>
        <line x1="188" y1="131" x2="180" y2="128" stroke="#2a2420" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="188" y1="131" x2="196" y2="127" stroke="#2a2420" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      {/* Persons 4–8 — progressively smaller (receding) */}
      {[142, 130, 119, 110, 100].map((x, i) => {
        const s = 4.5 - i * 0.5;
        const y = 125 + i * 0.8;
        return (
          <g key={i} fill="#242018">
            <ellipse cx={x} cy={y} rx={s} ry={s + 0.5}/>
            <rect x={x - s} y={y + s + 1} width={s * 2} height={(4 - i * 0.4) * 4} rx="0.8"/>
          </g>
        );
      })}
      {/* Lamppost on left */}
      <rect x="25" y="46" width="3" height="82" fill="#5a5450"/>
      <rect x="14" y="46" width="17" height="3" fill="#5a5450" rx="1"/>
      <ellipse cx="21" cy="46" rx="5" ry="5" fill="#d4ccbc" opacity="0.55"/>
      {/* Fallen price sign on ground */}
      <rect x="8" y="134" width="36" height="16" fill="#e0d8c8" transform="rotate(-15 26 142)"/>
      <text x="26" y="144" textAnchor="middle" fontSize="4.8" fill="#2a2018" fontFamily="Georgia,serif"
        fontWeight="bold" transform="rotate(-15 26 142)">BREAD: 48 CR</text>
    </svg>
  );
}

// ─── PHOTO 3: Audit Sweep — Ministry building at dawn, agents in formation ────
function AuditSweepPhoto() {
  return (
    <svg viewBox="0 0 198 158" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
      {/* Sky — heavy overcast */}
      <rect width="198" height="158" fill="#a8a8a6"/>
      <rect width="198" height="82" fill="#b4b4b2"/>
      {/* Cloud bank */}
      <ellipse cx="50"  cy="18" rx="55" ry="20" fill="#c2c2c0" opacity="0.7"/>
      <ellipse cx="150" cy="12" rx="65" ry="22" fill="#bcbcba" opacity="0.6"/>
      <ellipse cx="100" cy="35" rx="40" ry="13" fill="#c0c0be" opacity="0.4"/>
      {/* Horizon glow (dawn) */}
      <rect x="0" y="68" width="198" height="14" fill="#c8c4bc" opacity="0.5"/>
      {/* Ministry building — symmetrical, grand */}
      <rect x="10" y="52" width="178" height="86" fill="#848280"/>
      {/* Attic storey */}
      <rect x="6"  y="43" width="186" height="12" fill="#767472"/>
      {/* Cornice */}
      <rect x="2"  y="39" width="194" height="6"  fill="#6e6c6a"/>
      {/* Roof parapet */}
      {[4, 22, 40, 58, 76, 94, 112, 130, 148, 166, 184].map((x, i) => (
        <rect key={i} x={x} y={34} width={10} height={8} fill="#686664"/>
      ))}
      {/* Columns — 7 main + 2 pilasters at sides */}
      {[16, 38, 60, 82, 104, 126, 148, 168].map((x, i) => (
        <g key={i}>
          <rect x={x} y={40} width={10} height={98} fill="#6a6866" rx="0.5"/>
          <rect x={x - 2} y={37} width={14} height={5} fill="#606260"/>
          <rect x={x - 2} y={134} width={14} height={4} fill="#606260"/>
        </g>
      ))}
      {/* Building windows — dark rectangular recesses */}
      {[20, 64, 108, 152].map((x, i) => (
        <g key={i}>
          <rect x={x} y={62} width={18} height={26} fill="#404240" rx="0.5"/>
          <rect x={x} y={96} width={18} height={22} fill="#404240" rx="0.5"/>
        </g>
      ))}
      {/* Central entrance arch */}
      <rect x="83" y="90" width="32" height="48" fill="#3c3e3c"/>
      <path d="M83,90 Q99,72 115,90" fill="#3c3e3c"/>
      {/* Ministry seal above entrance */}
      <circle cx="99" cy="74" r="9" fill="#767472" stroke="#606260" strokeWidth="1.2"/>
      <circle cx="99" cy="74" r="6" fill="none" stroke="#565856" strokeWidth="0.8"/>
      <line x1="99" y1="68" x2="99" y2="80" stroke="#565856" strokeWidth="0.7"/>
      <line x1="93" y1="74" x2="105" y2="74" stroke="#565856" strokeWidth="0.7"/>
      {/* Steps — 3 wide */}
      <rect x="4"  y="136" width="190" height="6"  fill="#7e7e7c"/>
      <rect x="0"  y="142" width="198" height="6"  fill="#8a8a88"/>
      <rect x="-4" y="148" width="206" height="10" fill="#969694"/>
      {/* Ground */}
      <rect x="0" y="148" width="198" height="10" fill="#7c7c7a"/>
      {/* ── Row of 9 uniformed agents — precise formation ── */}
      {[10, 30, 50, 70, 90, 110, 130, 150, 170].map((x, i) => (
        <g key={i} fill="#1c1e1c">
          {/* Head with hat */}
          <ellipse cx={x + 5} cy={138} rx={4} ry={4.5}/>
          <rect x={x + 1} y={131} width={8} height={4} fill="#161816" rx="0.5"/>
          <rect x={x - 1} y={134} width={12} height={1.5} fill="#161816"/>
          {/* Body */}
          <rect x={x + 1} y={142} width={8} height={14} rx="0.5"/>
          {/* Arms at sides */}
          <line x1={x + 2} y1={145} x2={x - 2} y2={152} stroke="#1c1e1c" strokeWidth="2" strokeLinecap="round"/>
          <line x1={x + 8} y1={145} x2={x + 12} y2={152} stroke="#1c1e1c" strokeWidth="2" strokeLinecap="round"/>
        </g>
      ))}
      {/* Long shadows across the ground */}
      <rect x="0" y="148" width="198" height="10" fill="rgba(0,0,0,0.3)"/>
      {/* Flagpole */}
      <rect x="97" y="8" width="3" height="36" fill="#5a5a58"/>
      {/* Flag — stiff, horizontal */}
      <polygon points="100,8 100,18 122,13" fill="#484a48"/>
      {/* Black vehicles parked at left */}
      <rect x="0"  y="146" width="22" height="10" fill="#2a2c2a" rx="1"/>
      <rect x="24" y="146" width="22" height="10" fill="#2a2c2a" rx="1"/>
      {/* Headlights */}
      <rect x="2"  y="148" width="4" height="4" fill="#8a8880" rx="0.5"/>
      <rect x="26" y="148" width="4" height="4" fill="#8a8880" rx="0.5"/>
    </svg>
  );
}

// ─── Horizontal rule component ────────────────────────────────────────────────
function Rule({ thick }: { thick?: boolean }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: thick ? 3 : 1, background: '#2a2018', marginBottom: thick ? 2 : 0 }}/>
      {thick && <div style={{ height: 1, background: '#2a2018' }}/>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DayStartScreen({ engine }: { engine: ReturnType<typeof useGameEngine> }) {
  const { state, startDay } = engine;
  const event = DAILY_EVENTS[state.day];
  const meta  = event ? EVENT_META[event.type] : null;

  const hasNewspaper = !!event && !!meta;
  const displayMeta = meta ?? EVENT_META['market_shock'];
  const [phase, setPhase] = useState<'newspaper' | 'day-screen'>(hasNewspaper ? 'newspaper' : 'day-screen');

  useEffect(() => {
    setPhase(hasNewspaper ? 'newspaper' : 'day-screen');
  }, [state.day, hasNewspaper]);

  useEffect(() => {
    if (phase === 'newspaper') {
      const t = setTimeout(() => setPhase('day-screen'), 4200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase]);

  const dayColor = displayMeta.accentColor ?? '#e0a11b';

  return (
    <div
      className="h-screen w-full flex items-center justify-center"
      style={{ background: '#120d0a', overflow: 'hidden' }}
    >
      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════════════════
            NEWSPAPER FRONT PAGE
            ════════════════════════════════════════════════════════════════════ */}
        {phase === 'newspaper' && (
          <motion.div
            key="newspaper"
            initial={{ rotateZ: -18, scale: 0.78, opacity: 0, x: -180, y: 120 }}
            animate={{ rotateZ: -1.5, scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ rotateZ: 12, scale: 0.88, opacity: 0, x: 200, y: -80 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 1.2 }}
            style={{ transformOrigin: '50% 100%', cursor: 'pointer' }}
            onClick={() => setPhase('day-screen')}
          >
            {/* ── Paper ── */}
            <div style={{
              width: 530,
              background: 'linear-gradient(160deg, #f2e8d4 0%, #ede3cb 40%, #e8dcc4 100%)',
              border: '1.5px solid #8b7355',
              boxShadow: '0 28px 80px rgba(0,0,0,0.9), 6px 8px 0 rgba(0,0,0,0.4), -2px 2px 0 rgba(0,0,0,0.15)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: '#1a1208',
              padding: '14px 18px 12px',
              position: 'relative',
            }}>

              {/* ── Paper texture overlay ── */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
                backgroundImage: NOISE_URL, backgroundSize: '220px 220px',
                opacity: 0.06, mixBlendMode: 'multiply',
              }}/>

              {/* ─ MASTHEAD ─────────────────────────────────────── */}
              <div style={{ textAlign: 'center', paddingBottom: 8 }}>
                <div style={{ fontSize: 7, letterSpacing: '0.55em', color: '#5a4a30', textTransform: 'uppercase', marginBottom: 4 }}>
                  Established 1994 &emsp;·&emsp; Official Record of the Ministry &emsp;·&emsp; One Credit
                </div>
                <div style={{
                  fontSize: 38, fontWeight: 900, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#0e0c08', lineHeight: 1,
                  textShadow: '1px 1px 0 rgba(0,0,0,0.12)',
                }}>
                  Ministry Times
                </div>
                <div style={{ fontSize: 7, letterSpacing: '0.3em', color: '#6a5a38', marginTop: 4, textTransform: 'uppercase' }}>
                  Morning Edition &emsp;·&emsp; Day {state.day} &emsp;·&emsp; Ministry District
                </div>
              </div>

              <Rule thick />

              {/* ─ EDITION LINE ──────────────────────────────────── */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 6.5, color: '#6a5a38', padding: '3px 0 4px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                <span>Processing District — Authorized Publication</span>
                <span>Vol. {state.day + 24}, No. {state.day * 3 + 11}</span>
                <span>Restricted Distribution</span>
              </div>

              <Rule />

              {/* ─ MAIN CONTENT AREA (headline + photo side by side) ─ */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                style={{ display: 'flex', gap: 14, marginTop: 8, marginBottom: 8 }}
              >
                {/* Left: Headline + subline + body */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Headline */}
                  <div style={{
                    fontSize: 48, fontWeight: 900, lineHeight: 1, textTransform: 'uppercase',
                    color: displayMeta.accentColor, letterSpacing: '-0.01em',
                    textShadow: '1px 2px 0 rgba(0,0,0,0.15)',
                  }}>
                    {displayMeta.headline}
                  </div>
                  {/* Deck / subline */}
                  <div style={{ fontSize: 11.5, fontStyle: 'italic', color: '#3a2c18', lineHeight: 1.35 }}>
                    {displayMeta.subline}
                  </div>
                  <Rule />
                  {/* Body text */}
                  <div style={{ fontSize: 8, lineHeight: 1.65, color: '#2a2018', columnCount: 1 }}>
                    {displayMeta.body}
                  </div>
                  {/* Byline */}
                  <div style={{ fontSize: 6.5, color: '#7a6848', marginTop: 2, letterSpacing: '0.08em' }}>
                    — MINISTRY TIMES STAFF CORRESPONDENT
                  </div>
                </div>

                {/* Right: Newspaper photo */}
                <div style={{ width: 194, flexShrink: 0 }}>
                  <PhotoWrapper caption={displayMeta.caption}>
                    {event.type === 'market_shock'  && <MarketShockPhoto/>}
                    {event.type === 'hyperinflation' && <HyperinflationPhoto/>}
                    {event.type === 'audit_sweep'    && <AuditSweepPhoto/>}
                  </PhotoWrapper>
                </div>
              </motion.div>

              <Rule thick />

              {/* ─ EFFECT BANNER ─────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                style={{
                  textAlign: 'center', padding: '5px 8px',
                  fontSize: 10.5, fontWeight: 900, letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: displayMeta.accentColor,
                  fontFamily: 'Georgia, serif',
                }}
              >
                {displayMeta.effect}
              </motion.div>

              <Rule thick />

              {/* ─ TWO-COLUMN SIDE STORIES ───────────────────────── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.62, duration: 0.35 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 7 }}
              >
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #8b7355', paddingBottom: 2, marginBottom: 4 }}>
                    {displayMeta.side1_hed}
                  </div>
                  <div style={{ fontSize: 7.5, lineHeight: 1.6, color: '#2a2018' }}>
                    {displayMeta.side1}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #8b7355', paddingBottom: 2, marginBottom: 4 }}>
                    {displayMeta.side2_hed}
                  </div>
                  <div style={{ fontSize: 7.5, lineHeight: 1.6, color: '#2a2018', fontStyle: 'italic' }}>
                    {displayMeta.side2}
                  </div>
                </div>
              </motion.div>

              {/* ─ FOOTER ────────────────────────────────────────── */}
              <div style={{ borderTop: '1px solid #8b7355', marginTop: 8, paddingTop: 4, textAlign: 'center', fontSize: 6.2, color: '#8b7355', letterSpacing: '0.05em' }}>
                The Ministry Times is the Official Record of the Ministry. Unauthorized reproduction is a Ministry violation.
              </div>

            </div>

            {/* Click hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              style={{ textAlign: 'center', marginTop: 10, fontSize: 10.5, color: '#6f4b1f', letterSpacing: '0.22em', fontFamily: 'monospace' }}
            >
              [ CLICK TO CONTINUE ]
            </motion.div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            DAY START — MINISTRY CHECK-IN DOCUMENT
            ════════════════════════════════════════════════════════════════════ */}
        {phase === 'day-screen' && (
          <motion.div
            key="day-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #2a2826 0%, #1e1c1a 35%, #161412 100%)',
            }}
          >
            {/* concrete wall texture */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: NOISE_URL,
              backgroundSize: '220px 220px',
              opacity: 0.18,
              mixBlendMode: 'overlay',
            }} />
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at 50% 30%, rgba(60,50,38,0.25) 0%, transparent 70%)',
            }} />

            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-10 flex flex-col items-center"
              style={{ width: 'min(520px, 92vw)' }}
            >
              {/* ── MINISTRY CREST ── */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex flex-col items-center mb-5"
              >
                <svg viewBox="0 0 80 72" width="68" height="62" className="mb-2">
                  {/* shield body */}
                  <path d="M40,2 L72,16 L72,38 Q72,60 40,70 Q8,60 8,38 L8,16 Z"
                    fill="none" stroke="#8a7040" strokeWidth="2.5" />
                  <path d="M40,6 L68,18 L68,37 Q68,57 40,66 Q12,57 12,37 L12,18 Z"
                    fill="rgba(138,112,64,0.08)" stroke="#6a5430" strokeWidth="1" />
                  {/* eagle silhouette */}
                  <path d="M40,18 L32,28 L22,26 L28,34 L24,42 L34,38 L40,46 L46,38 L56,42 L52,34 L58,26 L48,28 Z"
                    fill="#8a7040" opacity="0.85" />
                  {/* center dot */}
                  <circle cx="40" cy="34" r="3" fill="#c9a84c" opacity="0.7" />
                  {/* horizontal bars */}
                  <line x1="18" y1="52" x2="62" y2="52" stroke="#6a5430" strokeWidth="1" opacity="0.6" />
                  <line x1="22" y1="56" x2="58" y2="56" stroke="#6a5430" strokeWidth="0.8" opacity="0.4" />
                </svg>
                <div style={{
                  fontFamily: '"Courier Prime", monospace',
                  fontSize: 10,
                  letterSpacing: '0.45em',
                  color: '#7a6538',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}>
                  Ministry of Revenue
                </div>
                <div style={{
                  fontFamily: '"VT323", monospace',
                  fontSize: 11,
                  letterSpacing: '0.55em',
                  color: '#4a3c24',
                  textTransform: 'uppercase',
                  marginTop: 3,
                }}>
                  Efficiency Is Our Currency
                </div>
              </motion.div>

              {/* ── SHIFT CARD (paper) ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
                className="relative w-full"
                style={{
                  background: 'linear-gradient(160deg, #e8e2d4 0%, #ddd6c4 50%, #d6ceba 100%)',
                  border: '1.5px solid #a0906c',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                  padding: '28px 32px 24px',
                }}
              >
                {/* paper texture lines */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 26px, rgba(139,115,85,0.08) 26px, rgba(139,115,85,0.08) 27px)',
                }} />
                {/* subtle grain */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: NOISE_URL,
                  backgroundSize: '160px 160px',
                  opacity: 0.08,
                  mixBlendMode: 'multiply',
                }} />

                {/* card header line */}
                <div className="relative z-10" style={{
                  borderBottom: '2px solid #8b7355',
                  paddingBottom: 10,
                  marginBottom: 18,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}>
                  <div>
                    <div style={{
                      fontFamily: '"Courier Prime", monospace',
                      fontSize: 9,
                      letterSpacing: '0.3em',
                      color: '#6a5a40',
                      textTransform: 'uppercase',
                      marginBottom: 2,
                    }}>
                      District 7 — Processing Bureau
                    </div>
                    <div style={{
                      fontFamily: '"Courier Prime", monospace',
                      fontSize: 11,
                      letterSpacing: '0.2em',
                      color: '#4a3c28',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}>
                      Daily Attendance Check-In
                    </div>
                  </div>
                  <div style={{
                    fontFamily: '"Courier Prime", monospace',
                    fontSize: 9,
                    color: '#8b7355',
                    textAlign: 'right',
                    lineHeight: 1.5,
                  }}>
                    Form MR-7<br />Rev. 04.15
                  </div>
                </div>

                {/* DAY X OF 7 — typewriter style */}
                <div className="relative z-10 text-center" style={{ marginBottom: 16 }}>
                  <div style={{
                    fontFamily: '"Courier Prime", monospace',
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: '0.35em',
                    color: '#2a2018',
                    textTransform: 'uppercase',
                  }}>
                    Day {state.day} of 7
                  </div>
                  <div style={{
                    width: '60%',
                    margin: '6px auto 0',
                    borderBottom: '1px dashed #a0906c',
                  }} />
                </div>

                {/* TAXES PLEASE — ink-bleed effect */}
                <div className="relative z-10 text-center" style={{ marginBottom: 14 }}>
                  <div style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 52,
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    color: '#1a1208',
                    lineHeight: 1,
                    textShadow: '1px 0 0 rgba(26,18,8,0.3), -1px 0 0 rgba(26,18,8,0.15), 0 1px 0 rgba(26,18,8,0.2), 0 0 3px rgba(26,18,8,0.12)',
                    filter: 'url(#inkBleed)',
                  }}>
                    TAXES<br />PLEASE
                  </div>
                  {/* SVG filter for ink bleed */}
                  <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                      <filter id="inkBleed">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
                      </filter>
                    </defs>
                  </svg>
                </div>

                {/* Event notice (if any) */}
                {event && meta && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="relative z-10"
                    style={{
                      border: `1.5px solid ${dayColor}66`,
                      background: `${dayColor}0a`,
                      padding: '12px 20px',
                      marginBottom: 10,
                    }}
                  >
                    <div style={{
                      fontFamily: '"Courier Prime", monospace',
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      color: dayColor,
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      marginBottom: 4,
                    }}>
                      {displayMeta.headline}
                    </div>
                    <div style={{
                      fontFamily: '"Courier Prime", monospace',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#3a3028',
                      textAlign: 'center',
                      letterSpacing: '0.06em',
                    }}>
                      {displayMeta.effect.replace(/⚠\s+/g, '').replace(/\s+⚠/g, '')}
                    </div>
                    {event.ruleAddendum && (
                      <div style={{
                        fontFamily: '"Courier Prime", monospace',
                        fontSize: 9.5,
                        color: '#6a5a40',
                        textAlign: 'center',
                        marginTop: 4,
                        lineHeight: 1.5,
                      }}>
                        {event.ruleAddendum}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* card footer */}
                <div className="relative z-10" style={{
                  borderTop: '1px solid #b0a080',
                  paddingTop: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{
                    fontFamily: '"Courier Prime", monospace',
                    fontSize: 8,
                    color: '#8b7355',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                  }}>
                    Inspector Copy — Do Not Duplicate
                  </div>
                  <div style={{
                    fontFamily: '"Courier Prime", monospace',
                    fontSize: 8,
                    color: '#8b7355',
                  }}>
                    MR-7/{state.day.toString().padStart(2, '0')}
                  </div>
                </div>

                {/* ── RED "ENTRY PERMITTED" STAMP ── */}
                <motion.div
                  initial={{ opacity: 0, scale: 1.3, rotate: -25 }}
                  animate={{ opacity: 0.85, scale: 1, rotate: -15 }}
                  transition={{ delay: 0.6, duration: 0.35, type: 'spring', stiffness: 200, damping: 14 }}
                  className="absolute pointer-events-none select-none"
                  style={{
                    top: '20%',
                    right: '6%',
                    zIndex: 20,
                  }}
                >
                  <div style={{
                    border: '4px solid #9b2020',
                    borderRadius: 4,
                    padding: '8px 18px',
                    fontFamily: '"Courier Prime", monospace',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#9b2020',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    lineHeight: 1.3,
                    textAlign: 'center',
                    background: 'rgba(155,32,32,0.04)',
                    boxShadow: 'inset 0 0 12px rgba(155,32,32,0.08)',
                  }}>
                    ENTRY<br />PERMITTED
                  </div>
                </motion.div>
              </motion.div>

              {/* ── STAMP BUTTON (bottom-right) ── */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="w-full flex justify-end mt-6"
              >
                <motion.button
                  onClick={startDay}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.96, y: 2 }}
                  style={{
                    fontFamily: '"Courier Prime", monospace',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: '#d6ceba',
                    cursor: 'pointer',
                    padding: '14px 36px',
                    background: 'linear-gradient(180deg, #5a4428 0%, #3a2a16 60%, #2a1c0e 100%)',
                    border: '2px solid #7a6238',
                    borderRadius: 3,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.6), 0 2px 0 #8a7040, inset 0 1px 0 rgba(255,255,255,0.08)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    position: 'relative',
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>Start Shift →</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
