import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StampProps {
  type: 'APPROVE' | 'REJECT' | null;
}

export function Stamp({ type }: StampProps) {
  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: type === 'APPROVE' ? -15 : 15 }}
          animate={{ scale: 1, opacity: 1, rotate: type === 'APPROVE' ? -5 : 8 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "absolute z-50 pointer-events-none flex items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "border-[8px] rounded-sm px-8 py-4 font-stamped text-7xl font-bold tracking-widest uppercase shadow-2xl",
            "backdrop-blur-sm bg-white/10",
            type === 'APPROVE' ? "text-stamp-green border-stamp-green" : "text-stamp-red border-stamp-red"
          )}
          style={{
            textShadow: '0px 0px 4px rgba(255,255,255,0.5)',
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.2)'
          }}
        >
          {type === 'APPROVE' ? 'APPROVED' : 'REJECTED'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
