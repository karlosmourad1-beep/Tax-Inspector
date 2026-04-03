const SKINS  = ['#c9aa8a','#b59070','#9e7a58','#8a6445','#6b4a32','#d5c5a8','#a88a68','#7a5a3e'];
const HAIRS  = ['#1a1208','#2d200e','#4a3010','#1f1f20','#3d2c18','#8a7a62','#585040'];
const SHIRTS = ['hsl(210,14%,22%)','hsl(0,0%,18%)','hsl(25,18%,22%)','hsl(100,8%,20%)','hsl(220,10%,26%)','hsl(0,6%,22%)'];

export function PortraitSVG({ seed, w, h, disguise }: { seed: number; w: number; h: number; disguise?: string }) {
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

  const baseAccessory = (seed * 17) % 6;
  const hasGlasses = disguise === 'glasses' || disguise === 'glasses_hat' || disguise === 'glasses_mustache' || disguise === 'corporate_badge'
    ? true
    : !disguise && (baseAccessory === 3 || baseAccessory === 4);
  const hasHat = disguise === 'hat' || disguise === 'glasses_hat'
    ? true
    : !disguise && baseAccessory === 5;
  const hasMustache = disguise === 'mustache' || disguise === 'glasses_mustache';
  const hasBadge    = disguise === 'corporate_badge';
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
        <circle cx={cx-7} cy={eyeY} r="5.5" fill="none" stroke="#1a1208" strokeWidth="1.8" />
        <circle cx={cx+7} cy={eyeY} r="5.5" fill="none" stroke="#1a1208" strokeWidth="1.8" />
        <line x1={cx-1.5} y1={eyeY} x2={cx+1.5} y2={eyeY} stroke="#1a1208" strokeWidth="1.4" />
        <line x1={cx-24}  y1={eyeY} x2={cx-12.5} y2={eyeY} stroke="#1a1208" strokeWidth="1" />
        <line x1={cx+12.5} y1={eyeY} x2={cx+24}  y2={eyeY} stroke="#1a1208" strokeWidth="1" />
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
