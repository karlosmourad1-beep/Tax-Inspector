import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface StampProps {
  type: 'APPROVE' | 'REJECT' | 'FREEZE' | null;
}

function InkTexture({ color, seed }: { color: string; seed: number }) {
  const rects = useMemo(() => {
    const r: { x: number; y: number; w: number; h: number; o: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const s = Math.sin(seed * 100 + i * 7.3) * 0.5 + 0.5;
      r.push({
        x: s * 100,
        y: Math.cos(seed * 50 + i * 3.1) * 50 + 50,
        w: 2 + s * 6,
        h: 1 + s * 3,
        o: 0.08 + s * 0.15,
      });
    }
    return r;
  }, [seed]);

  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" preserveAspectRatio="none">
      {rects.map((r, i) => (
        <rect
          key={i}
          x={`${r.x}%`}
          y={`${r.y}%`}
          width={r.w}
          height={r.h}
          fill={color}
          opacity={r.o}
          rx="1"
        />
      ))}
    </svg>
  );
}

let stampCounter = 0;

export function Stamp({ type }: StampProps) {
  const instance = useMemo(() => {
    if (!type) return null;
    stampCounter++;
    const seed = Math.sin(stampCounter * 9301 + 49297) * 0.5 + 0.5;
    return {
      id: stampCounter,
      rotate: type === 'APPROVE' ? -8 + seed * 6 : type === 'FREEZE' ? -2 + seed * 4 : 5 + seed * 6,
      initRotate: type === 'APPROVE' ? -18 : type === 'FREEZE' ? -5 : 15,
      opacity: 0.75 + seed * 0.15,
      borderTop: 5 + seed * 3,
      borderBottom: 4 + (1 - seed) * 4,
      borderLeft: 5 + (1 - seed) * 3,
      borderRight: 4 + seed * 4,
      filterSeed: Math.floor(seed * 100),
      textureSeed: seed * 77 + 13,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const color =
    type === 'APPROVE' ? '#2a8a44' :
    type === 'FREEZE'  ? '#3a7abf' :
                         '#aa2020';
  const label =
    type === 'APPROVE' ? 'APPROVED' :
    type === 'FREEZE'  ? 'FROZEN' :
                         'REJECTED';

  return (
    <AnimatePresence>
      {type && instance && (
        <motion.div
          key={instance.id}
          initial={{ scale: 2.8, opacity: 0, rotate: instance.initRotate, y: -40 }}
          animate={{
            scale: 1,
            opacity: 1,
            rotate: instance.rotate,
            y: 0,
            transition: {
              type: 'spring',
              stiffness: 600,
              damping: 20,
              mass: 0.8,
            },
          }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
          className="absolute z-50 pointer-events-none flex items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div
            className="relative font-stamped text-7xl font-bold tracking-widest uppercase px-8 py-4"
            style={{
              color,
              opacity: instance.opacity,
              border: `6px solid ${color}`,
              borderRadius: 2,
              borderTopWidth: instance.borderTop,
              borderBottomWidth: instance.borderBottom,
              borderLeftWidth: instance.borderLeft,
              borderRightWidth: instance.borderRight,
              textShadow: `1px 1px 0 ${color}33, -1px 0 0 ${color}22`,
              filter: 'url(#stamp-roughen)',
              mixBlendMode: 'multiply',
            }}
          >
            <InkTexture color={color} seed={instance.textureSeed} />
            {label}
          </div>
          <svg width="0" height="0" className="absolute">
            <defs>
              <filter id="stamp-roughen">
                <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed={instance.filterSeed} result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
