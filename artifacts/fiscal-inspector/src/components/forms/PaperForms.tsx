import { AnyDocument, TaxReturnDoc, W2Doc, ExpenseDoc, IDDoc } from '@/types/game';
import { formatMoney } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FormWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function FormWrapper({ title, children, className }: FormWrapperProps) {
  return (
    <div className={cn(
      "w-[340px] paper-texture-bg text-ink font-typewriter paper-shadow rounded-sm relative overflow-hidden",
      "border border-ink/20",
      className
    )}>
      <div className="absolute top-2 right-2 text-[10px] text-ink-faded opacity-50">REV 1984</div>
      <div className="absolute bottom-2 left-2 text-[10px] text-ink-faded opacity-50 font-terminal barcode">||||| ||| || |||</div>
      <div className="p-5 flex flex-col h-full">
        <div className="border-b-2 border-ink pb-2 mb-4 text-center">
          <h2 className="font-stamped text-xl font-bold tracking-wider">{title}</h2>
        </div>
        <div className="flex-1 flex flex-col gap-3 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  fieldKey: string;
  circledFields: Set<string>;
  onCircle: (key: string) => void;
}

function Field({ label, value, highlight = false, fieldKey, circledFields, onCircle }: FieldProps) {
  const isCircled = circledFields.has(fieldKey);
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-ink/10 pb-1 relative rounded cursor-pointer select-none",
        "transition-all duration-150",
        isCircled
          ? "ring-2 ring-red-500 ring-offset-1 bg-red-50/60"
          : "hover:bg-black/5"
      )}
      onClick={(e) => { e.stopPropagation(); onCircle(fieldKey); }}
      title="Click to circle this field as suspicious"
    >
      <span className="text-xs font-bold text-ink-faded uppercase tracking-wider">{label}</span>
      <span className={cn("font-medium", highlight && "bg-yellow-200/50", isCircled && "text-red-700 font-bold")}>
        {value}
      </span>
      {isCircled && (
        <span className="absolute -top-1 -right-1 text-[9px] font-bold text-red-600 bg-white border border-red-400 rounded-full px-1">
          ✗
        </span>
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
    case '1040': {
      const d = doc as TaxReturnDoc;
      return (
        <FormWrapper title="FORM 1040-FI" className="h-[490px]">
          <Field label="Taxpayer Name" value={d.name} fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
          <Field label="Social Security No." value={d.ssn} fieldKey={`${doc.id}:ssn`} circledFields={circledFields} onCircle={onCircle} />
          <div className="mt-2 p-3 bg-black/5 rounded border border-ink/20 flex flex-col gap-2">
            <div
              className={cn(
                "flex justify-between rounded px-1 py-0.5 cursor-pointer transition-all",
                circledFields.has(`${doc.id}:gross`) ? "ring-2 ring-red-500 bg-red-50/60" : "hover:bg-black/5"
              )}
              onClick={(e) => { e.stopPropagation(); onCircle(`${doc.id}:gross`); }}
            >
              <span className="text-xs font-bold">1. Gross Income:</span>
              <span className={circledFields.has(`${doc.id}:gross`) ? "text-red-700 font-bold" : ""}>{formatMoney(d.grossIncome)}</span>
            </div>
            <div
              className={cn(
                "flex justify-between rounded px-1 py-0.5 cursor-pointer transition-all",
                circledFields.has(`${doc.id}:ded`) ? "ring-2 ring-red-500 bg-red-50/60" : "hover:bg-black/5"
              )}
              onClick={(e) => { e.stopPropagation(); onCircle(`${doc.id}:ded`); }}
            >
              <span className="text-xs font-bold">2. Deductions:</span>
              <span className={circledFields.has(`${doc.id}:ded`) ? "text-red-700 font-bold" : ""}>- {formatMoney(d.deductions)}</span>
            </div>
            <div className="border-t border-ink my-1"></div>
            <div
              className={cn(
                "flex justify-between font-bold rounded px-1 py-0.5 cursor-pointer transition-all",
                circledFields.has(`${doc.id}:taxable`) ? "ring-2 ring-red-500 bg-red-50/60" : "hover:bg-black/5"
              )}
              onClick={(e) => { e.stopPropagation(); onCircle(`${doc.id}:taxable`); }}
            >
              <span className="text-xs">3. Taxable Income:</span>
              <span className={circledFields.has(`${doc.id}:taxable`) ? "text-red-700" : ""}>{formatMoney(d.taxableIncome)}</span>
            </div>
          </div>
          <div
            className={cn(
              "mt-auto p-3 rounded border-2 border-ink cursor-pointer transition-all",
              circledFields.has(`${doc.id}:taxowed`) ? "ring-2 ring-red-500 bg-red-50/60 border-red-500" : "bg-black/10"
            )}
            onClick={(e) => { e.stopPropagation(); onCircle(`${doc.id}:taxowed`); }}
          >
            <div className="flex justify-between items-center font-bold text-lg">
              <span className="text-sm">4. TAX OWED (15%):</span>
              <span className={circledFields.has(`${doc.id}:taxowed`) ? "text-red-700" : ""}>{formatMoney(d.taxOwed)}</span>
            </div>
          </div>
          <div className="text-[10px] italic opacity-60 text-center mt-2">
            "Under penalty of perjury, I declare these facts are true."
          </div>
        </FormWrapper>
      );
    }
    case 'W2': {
      const d = doc as W2Doc;
      return (
        <FormWrapper title="W-2 STATEMENT" className="h-[360px]">
          <div className="border-2 border-ink p-3 bg-white/30 rounded flex flex-col gap-3">
            <Field label="a. Employee Name" value={d.name} fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
            <Field label="b. Employee SSN" value={d.ssn} fieldKey={`${doc.id}:ssn`} circledFields={circledFields} onCircle={onCircle} />
            <Field label="c. Employer" value={d.employer} fieldKey={`${doc.id}:employer`} circledFields={circledFields} onCircle={onCircle} />
            <div className="mt-2 border-t-2 border-ink pt-2">
              <Field label="1. Wages, tips, other comp." value={formatMoney(d.wages)} highlight fieldKey={`${doc.id}:wages`} circledFields={circledFields} onCircle={onCircle} />
            </div>
          </div>
          <div className="mt-auto text-[9px] text-center text-ink-faded uppercase tracking-widest">
            Department of the Treasury
          </div>
        </FormWrapper>
      );
    }
    case 'EXPENSE': {
      const d = doc as ExpenseDoc;
      return (
        <FormWrapper title="EXPENSE REPORT" className="h-[300px]">
          <Field label="Submitted By" value={d.name} fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
          <div className="flex-1 mt-4 border border-ink/20 p-2 text-xs">
            <div className="flex justify-between text-ink-faded border-b border-ink/20 pb-1 mb-2">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Office Supplies</span>
              <span>{formatMoney(d.totalExpenses * 0.3)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Travel &amp; Meals</span>
              <span>{formatMoney(d.totalExpenses * 0.5)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Misc.</span>
              <span>{formatMoney(d.totalExpenses * 0.2)}</span>
            </div>
          </div>
          <div
            className={cn(
              "mt-2 flex justify-between items-center font-bold text-base p-2 rounded cursor-pointer transition-all",
              circledFields.has(`${doc.id}:total`) ? "ring-2 ring-red-500 bg-red-50/60" : "bg-black/5"
            )}
            onClick={(e) => { e.stopPropagation(); onCircle(`${doc.id}:total`); }}
          >
            <span>TOTAL DEDUCTIBLE:</span>
            <span className={circledFields.has(`${doc.id}:total`) ? "text-red-700 font-bold" : ""}>{formatMoney(d.totalExpenses)}</span>
          </div>
        </FormWrapper>
      );
    }
    case 'ID': {
      const d = doc as IDDoc;
      return (
        <FormWrapper title="CITIZEN ID CARD" className="h-[220px] w-[380px] bg-blue-50/50">
          <div className="flex gap-4">
            <div className="w-24 h-32 bg-ink/10 border-2 border-ink flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 24 24" className="w-16 h-16 text-ink/30" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Field label="Full Name" value={d.name} fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
              <div className="flex gap-4">
                <Field label="DOB" value={d.dob} fieldKey={`${doc.id}:dob`} circledFields={circledFields} onCircle={onCircle} />
                <Field label="ID Number (SSN)" value={d.ssn} fieldKey={`${doc.id}:ssn`} circledFields={circledFields} onCircle={onCircle} />
              </div>
              <div className="mt-auto">
                <img src={`${import.meta.env.BASE_URL}images/seal.png`} alt="Seal" className="w-10 h-10 opacity-40 ml-auto" />
              </div>
            </div>
          </div>
        </FormWrapper>
      );
    }
  }
}
