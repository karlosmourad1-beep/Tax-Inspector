import { useState } from 'react';
import { AnyDocument, TaxReturnDoc, W2Doc, ExpenseDoc, IDDoc, ScheduleDDoc } from '@/types/game';
import { formatMoney, cn } from '@/lib/utils';
import { PortraitSVG } from '@/components/ui/PortraitSVG';

export function fieldGroup(suffix: string): string | null {
  if (suffix === 'name') return 'name';
  if (suffix === 'employer') return 'employer';
  if (suffix === 'ssn') return 'ssn';
  if (suffix === 'wages' || suffix === 'gross') return 'income';
  if (suffix === 'total' || suffix === 'ded') return 'deductions';
  if (suffix === 'taxable') return 'taxable';
  return null;
}

function OfficialStamp({ uvActive, isFraud }: { uvActive: boolean; isFraud: boolean }) {
  const [hovering, setHovering] = useState(false);
  const showReveal = uvActive && hovering;
  const revealText = isFraud ? 'FAKE' : 'VALID';
  const revealColor = isFraud ? '#e04040' : '#40b060';
  const revealShadow = isFraud ? '0 0 12px rgba(224,64,64,0.6)' : '0 0 12px rgba(64,176,96,0.6)';

  return (
    <div
      className="relative flex items-center justify-center select-none"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="relative w-[100px] h-[56px] flex items-center justify-center rounded-sm"
        style={{
          border: '2px solid rgba(107,0,0,0.55)',
          background: 'rgba(107,0,0,0.04)',
        }}
      >
        <svg viewBox="0 0 100 56" width={100} height={56} className="absolute inset-0">
          <rect x="4" y="4" width="92" height="48" rx="2" fill="none" stroke="rgba(107,0,0,0.3)" strokeWidth="1" strokeDasharray="3 2" />
          <text x="50" y="22" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="8" fontWeight="bold" fill="rgba(107,0,0,0.5)" letterSpacing="2">
            OFFICIAL
          </text>
          <text x="50" y="36" textAnchor="middle" fontFamily='"Courier New",monospace' fontSize="7" fill="rgba(107,0,0,0.4)" letterSpacing="1">
            M.O.F. STAMP
          </text>
          <circle cx="17" cy="42" r="4" fill="none" stroke="rgba(107,0,0,0.25)" strokeWidth="0.8" />
          <circle cx="83" cy="42" r="4" fill="none" stroke="rgba(107,0,0,0.25)" strokeWidth="0.8" />
        </svg>

        {showReveal && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-sm z-10 transition-opacity duration-200"
            style={{
              background: isFraud
                ? 'rgba(80,10,10,0.85)'
                : 'rgba(10,60,20,0.85)',
              border: `2px solid ${revealColor}`,
              boxShadow: revealShadow,
            }}
          >
            <span
              className="font-mono text-xl font-bold tracking-[0.3em] uppercase"
              style={{
                color: revealColor,
                textShadow: revealShadow,
              }}
            >
              {revealText}
            </span>
          </div>
        )}
      </div>

      {uvActive && (
        <div
          className="absolute inset-0 rounded-sm pointer-events-none animate-pulse"
          style={{
            border: '1px solid rgba(120,80,255,0.3)',
            boxShadow: '0 0 8px rgba(120,80,255,0.15)',
          }}
        />
      )}
    </div>
  );
}

function FormWrapper({ title, children, className, uvActive = false, isFraud = false }: {
  title: string; children: React.ReactNode; className?: string;
  uvActive?: boolean; isFraud?: boolean;
}) {
  return (
    <div className={cn(
      "w-[280px] paper-texture-bg text-ink font-typewriter paper-shadow rounded-sm border border-ink/25 relative overflow-hidden",
      className
    )}>
      <div className="p-5 flex flex-col gap-3">
        <div className="border-b-2 border-ink/60 pb-2 text-center">
          <h2 className="font-stamped text-base font-bold tracking-wider">{title}</h2>
        </div>
        {children}
        <div className="mt-2 pt-2 border-t border-ink/20 flex justify-center">
          <OfficialStamp uvActive={uvActive} isFraud={isFraud} />
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  fieldKey: string;
  onFieldClick: (key: string, value: string) => void;
  highlightGroup: { group: string; value: string } | null;
}

function Field({ label, value, fieldKey, onFieldClick, highlightGroup }: FieldProps) {
  const suffix = fieldKey.split(':')[1];
  const myGroup = fieldGroup(suffix);
  const inGroup   = highlightGroup && myGroup && myGroup === highlightGroup.group;
  const isMatch   = inGroup && value === highlightGroup!.value;
  const isMismatch = inGroup && value !== highlightGroup!.value;
  const isActive  = highlightGroup && myGroup && myGroup === highlightGroup.group && value === highlightGroup.value;

  return (
    <div
      onClick={() => { if (myGroup) onFieldClick(fieldKey, value); }}
      className={cn(
        "flex flex-col gap-1 px-3 py-3 rounded border-2 select-none transition-all duration-150",
        myGroup ? "cursor-pointer" : "cursor-default",
        isMatch    && "border-green-500 bg-green-50/70 ring-2 ring-green-400",
        isMismatch && "border-red-500 bg-red-50/70 ring-2 ring-red-400",
        !inGroup && isActive && "border-amber-500 bg-amber-50/40",
        !inGroup && !isActive && "border-ink/20 bg-black/5 hover:bg-black/10",
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest text-ink-faded">{label}</span>
      <span className={cn(
        "text-xl font-bold leading-tight",
        isMatch    && "text-green-700",
        isMismatch && "text-red-700",
      )}>
        {value}
      </span>
      {isMatch    && <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">✓ Match</span>}
      {isMismatch && <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">✗ Mismatch</span>}
    </div>
  );
}

export interface RenderFormProps {
  doc: AnyDocument;
  highlightGroup: { group: string; value: string } | null;
  onFieldClick: (key: string, value: string) => void;
  uvActive?: boolean;
  isFraud?: boolean;
}

export function RenderForm({ doc, highlightGroup, onFieldClick, uvActive = false, isFraud = false }: RenderFormProps) {
  const fp = (suffix: string, value: string) => (
    <Field
      label={suffix === 'name' ? 'Name' : suffix === 'ssn' ? 'SSN' : suffix === 'employer' ? 'Employer' :
             suffix === 'wages' ? 'Wages' : suffix === 'gross' ? 'Gross Income' :
             suffix === 'total' ? 'Total Deductions' : suffix === 'ded' ? 'Deductions' : suffix === 'taxable' ? 'Taxable Income' : suffix}
      value={value}
      fieldKey={`${doc.id}:${suffix}`}
      highlightGroup={highlightGroup}
      onFieldClick={onFieldClick}
    />
  );

  switch (doc.type) {

    case '1040': {
      const d = doc as TaxReturnDoc;
      return (
        <FormWrapper title="FORM 1040-FI" uvActive={uvActive} isFraud={isFraud}>
          {fp('name', d.name)}
          {fp('ssn', d.ssn)}
          {fp('gross', formatMoney(d.grossIncome))}
          {fp('ded', formatMoney(d.deductions))}
          {fp('taxable', formatMoney(d.taxableIncome))}
          <div className="text-[9px] text-ink-faded font-bold uppercase tracking-wider mt-2 px-2 py-1 border-t">
            (Gross − Deductions = Taxable)
          </div>
        </FormWrapper>
      );
    }

    case 'W2': {
      const d = doc as W2Doc;
      return (
        <FormWrapper title="W-2 STATEMENT" uvActive={uvActive} isFraud={isFraud}>
          {fp('name', d.name)}
          {fp('employer', d.employer)}
          {fp('wages', formatMoney(d.wages))}
        </FormWrapper>
      );
    }

    case 'EXPENSE': {
      const d = doc as ExpenseDoc;
      return (
        <FormWrapper title="EXPENSE REPORT" uvActive={uvActive} isFraud={isFraud}>
          {fp('name', d.name)}
          {fp('total', formatMoney(d.totalExpenses))}
          {d.lineItems.some(i => i.isSuspect) && (
            <div className="px-3 py-2 rounded border border-amber-600/50 bg-amber-50/50 text-amber-800 text-sm font-bold">
              ⚠ EXPENSES EXCESSIVE — verify breakdown
            </div>
          )}
        </FormWrapper>
      );
    }

    case 'ID': {
      const d = doc as IDDoc;
      return (
        <FormWrapper title="CITIZEN ID" uvActive={uvActive} isFraud={isFraud}>
          <div className="flex gap-3 mb-1">
            {d.avatarSeed !== undefined && (
              <div className="shrink-0 border-2 border-ink/30 overflow-hidden"
                   style={{ width: 56, height: 70, background: '#cec1a6' }}>
                <PortraitSVG seed={d.avatarSeed} w={56} h={70} disguise={d.disguise} />
              </div>
            )}
            <div className="flex flex-col flex-1 gap-1">
              {fp('name', d.name)}
              {fp('ssn', d.ssn)}
              {fp('dob', d.dob)}
            </div>
          </div>
        </FormWrapper>
      );
    }

    case 'SCHEDULE_D': {
      const d = doc as ScheduleDDoc;
      const ltPct = Math.round(d.ltRate * 100);
      return (
        <FormWrapper title="SCHEDULE D" uvActive={uvActive} isFraud={isFraud}>
          {fp('name', d.name)}
          <Field label="Short-Term Gains" value={formatMoney(d.shortTermGains)}
                 fieldKey={`${doc.id}:st`} highlightGroup={highlightGroup} onFieldClick={onFieldClick} />
          <Field label={`Long-Term Gains (${ltPct}%)`} value={formatMoney(d.longTermGains)}
                 fieldKey={`${doc.id}:lt`} highlightGroup={highlightGroup} onFieldClick={onFieldClick} />
          <Field label="Capital Gains Tax" value={formatMoney(d.totalCapitalGainsTax)}
                 fieldKey={`${doc.id}:cg`} highlightGroup={highlightGroup} onFieldClick={onFieldClick} />
        </FormWrapper>
      );
    }
  }
}
