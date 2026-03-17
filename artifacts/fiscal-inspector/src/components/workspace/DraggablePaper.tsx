import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AnyDocument } from '@/types/game';
import { RenderForm } from '../forms/PaperForms';

interface DraggablePaperProps {
  doc: AnyDocument;
  initialX: number;
  initialY: number;
  zIndex: number;
  onFocus: () => void;
  circledFields: Set<string>;
  onCircle: (key: string) => void;
  isNew?: boolean;
}

// Derive a stable, deterministic rotation from the doc id so it doesn't
// re-randomise on every render, but each paper has its own slant.
function seedRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return ((h % 500) / 1000) * (h % 2 === 0 ? 1 : -1); // –0.25 … +0.25 deg
}

export function DraggablePaper({
  doc, initialX, initialY, zIndex, onFocus, circledFields, onCircle, isNew = false,
}: DraggablePaperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const rotation = useMemo(() => seedRotation(doc.id), [doc.id]);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => { setIsDragging(true); onFocus(); }}
      onDragEnd={() => setIsDragging(false)}
      onPointerDown={onFocus}
      initial={isNew
        ? { x: -360, y: initialY + 40, opacity: 0, rotate: -8, scale: 0.92 }
        : { x: initialX, y: initialY - 40, opacity: 0, scale: 0.93, rotate: rotation }
      }
      animate={{
        x: isNew ? initialX : undefined,
        y: initialY,
        opacity: 1,
        scale: isDragging ? 1.03 : 1,
        rotate: isDragging ? 0 : rotation,
      }}
      transition={isNew
        ? { type: 'spring', damping: 22, stiffness: 180, delay: 0.05 }
        : { type: 'spring', damping: 20, stiffness: 200 }
      }
      whileDrag={{ scale: 1.04, rotate: 0, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
      style={{ zIndex }}
      className="absolute cursor-grab active:cursor-grabbing origin-center"
    >
      <RenderForm doc={doc} circledFields={circledFields} onCircle={onCircle} />
    </motion.div>
  );
}
