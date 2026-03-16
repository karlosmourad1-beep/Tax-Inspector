import { useState } from 'react';
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
}

export function DraggablePaper({ doc, initialX, initialY, zIndex, onFocus, circledFields, onCircle }: DraggablePaperProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true);
        onFocus();
      }}
      onDragEnd={() => setIsDragging(false)}
      onPointerDown={onFocus}
      initial={{ x: initialX, y: initialY - 50, opacity: 0, scale: 0.9 }}
      animate={{ y: initialY, opacity: 1, scale: isDragging ? 1.02 : 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      style={{ zIndex }}
      className="absolute cursor-grab active:cursor-grabbing origin-center"
    >
      <RenderForm doc={doc} circledFields={circledFields} onCircle={onCircle} />
    </motion.div>
  );
}
