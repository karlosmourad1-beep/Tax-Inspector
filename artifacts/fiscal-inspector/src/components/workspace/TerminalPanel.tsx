import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TerminalPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function TerminalPanel({ title, children, className, noPadding = false }: TerminalPanelProps) {
  return (
    <div className={cn(
      "border-2 border-amber-600/50 bg-desk-dark/95 backdrop-blur flex flex-col shadow-lg shadow-black/50 overflow-hidden",
      "relative crt-overlay before:opacity-30",
      className
    )}>
      {/* Header */}
      <div className="bg-amber-600/20 border-b border-amber-600/50 px-3 py-1 flex justify-between items-center">
        <span className="font-terminal font-bold text-amber-500 tracking-widest text-sm uppercase">
          {title}
        </span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse" />
        </div>
      </div>
      
      {/* Content */}
      <div className={cn("flex-1 overflow-y-auto custom-scrollbar", !noPadding && "p-4")}>
        {children}
      </div>
    </div>
  );
}
