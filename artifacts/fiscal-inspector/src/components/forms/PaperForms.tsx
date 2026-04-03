import { AnyDocument, TaxReturnDoc, W2Doc, ExpenseDoc, IDDoc, ScheduleDDoc } from '@/types/game';
import { formatMoney, cn } from '@/lib/utils';

// ─── Shared wrapper ─────────────────────────────────────────────────────────
function FormWrapper({ title, children, className }: {
  title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn(
      "w-[300px] paper-texture-bg text-ink font-typewriter paper-shadow rounded-sm border border-ink/25 relative overflow-hidden",
      className
    )}>
      <div className="p-5 flex flex-col gap-4">
        <div className="border-b-2 border-ink/60 pb-3 text-center">
          <h2 className="font-stamped text-lg font-bold tracking-wider">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Clickable field — big, readable, easy to tap ──────────────────────────
function Field({ label, value, fieldKey, circledFields, onCircle, accent = false }: {
  label: string;
  value: string | number;
  fieldKey: string;
  circledFields: Set<string>;
  onCircle: (k: string) => void;
  accent?: boolean;
}) {
  const isCircled = circledFields.has(fieldKey);
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onCircle(fieldKey); }}
      className={cn(
        "flex flex-col gap-1 px-3 py-3 rounded border-2 cursor-pointer select-none transition-all",
        isCircled
          ? "border-red-500 bg-red-50/70 ring-2 ring-red-400"
          : "border-ink/20 bg-black/5 hover:bg-black/10",
      )}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest text-ink-faded">{label}</span>
      <span className={cn(
        "text-xl font-bold leading-tight",
        accent && !isCircled && "text-amber-800",
        isCircled && "text-red-700",
      )}>
        {value}
      </span>
      {isCircled && (
        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">⊗ Flagged</span>
      )}
    </div>
  );
}

export interface RenderFormProps {
  doc: AnyDocument;
  circledFields: Set<string>;
  onCircle: (key: string) => void;
}

export function RenderForm({ doc, circledFields, onCircle }: RenderFormProps) {
  switch (doc.type) {

    // ─── FORM 1040 ──────────────────────────────────────────────────────────
    case '1040': {
      const d = doc as TaxReturnDoc;
      return (
        <FormWrapper title="FORM 1040-FI" className="h-auto">
          <Field label="Name" value={d.name}
            fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
          <Field label="SSN" value={d.ssn}
            fieldKey={`${doc.id}:ssn`} circledFields={circledFields} onCircle={onCircle} />
          <Field label="Gross Income" value={formatMoney(d.grossIncome)} accent
            fieldKey={`${doc.id}:gross`} circledFields={circledFields} onCircle={onCircle} />
        </FormWrapper>
      );
    }

    // ─── W-2 ────────────────────────────────────────────────────────────────
    case 'W2': {
      const d = doc as W2Doc;
      return (
        <FormWrapper title="W-2 WAGE STATEMENT" className="h-auto">
          <Field label="Employee Name" value={d.name}
            fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
          <Field label="Employer" value={d.employer}
            fieldKey={`${doc.id}:employer`} circledFields={circledFields} onCircle={onCircle} />
          <Field label="Wages" value={formatMoney(d.wages)} accent
            fieldKey={`${doc.id}:wages`} circledFields={circledFields} onCircle={onCircle} />
        </FormWrapper>
      );
    }

    // ─── EXPENSE REPORT ─────────────────────────────────────────────────────
    case 'EXPENSE': {
      const d = doc as ExpenseDoc;
      return (
        <FormWrapper title="EXPENSE REPORT" className="h-auto">
          <Field label="Submitted By" value={d.name}
            fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
          <Field label="Total Deductions" value={formatMoney(d.totalExpenses)} accent
            fieldKey={`${doc.id}:total`} circledFields={circledFields} onCircle={onCircle} />
          {d.lineItems.some(i => i.isSuspect) && (
            <div className="px-3 py-2 rounded border border-amber-600/40 bg-amber-50/40 text-amber-800 text-sm font-bold">
              ⚠ Suspicious line items detected
            </div>
          )}
        </FormWrapper>
      );
    }

    // ─── ID CARD ────────────────────────────────────────────────────────────
    case 'ID': {
      const d = doc as IDDoc;
      return (
        <FormWrapper title="CITIZEN ID CARD" className="h-auto">
          <Field label="Full Name" value={d.name}
            fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
          <Field label="SSN" value={d.ssn}
            fieldKey={`${doc.id}:ssn`} circledFields={circledFields} onCircle={onCircle} />
        </FormWrapper>
      );
    }

    // ─── SCHEDULE D ─────────────────────────────────────────────────────────
    case 'SCHEDULE_D': {
      const d = doc as ScheduleDDoc;
      const ltPct = Math.round(d.ltRate * 100);
      return (
        <FormWrapper title="SCHEDULE D" className="h-auto">
          <Field label="Taxpayer Name" value={d.name}
            fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
          <Field label={`Short-Term Gains`} value={formatMoney(d.shortTermGains)}
            fieldKey={`${doc.id}:st-gains`} circledFields={circledFields} onCircle={onCircle} />
          <Field label={`Long-Term Gains (${ltPct}% rate)`} value={formatMoney(d.longTermGains)}
            fieldKey={`${doc.id}:lt-gains`} circledFields={circledFields} onCircle={onCircle} />
          <Field label="Total Capital Gains Tax" value={formatMoney(d.totalCapitalGainsTax)} accent
            fieldKey={`${doc.id}:total`} circledFields={circledFields} onCircle={onCircle} />
        </FormWrapper>
      );
    }
  }
}
