import { AnyDocument, TaxReturnDoc, W2Doc, ExpenseDoc, IDDoc, ScheduleDDoc } from '@/types/game';
import { formatMoney, cn } from '@/lib/utils';
import { calculateOrdinaryTax } from '@/lib/taxBrackets';

// ─── Form Wrapper ──────────────────────────────────────────────────────────────
function FormWrapper({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "w-[340px] paper-texture-bg text-ink font-typewriter paper-shadow rounded-sm relative overflow-hidden",
      "border border-ink/20",
      className
    )}>
      <div className="absolute top-2 right-2 text-[10px] text-ink-faded opacity-50">REV 1984</div>
      <div className="absolute bottom-2 left-2 text-[10px] text-ink-faded opacity-50 font-terminal">||||| ||| || |||</div>
      <div className="p-5 flex flex-col h-full">
        <div className="border-b-2 border-ink pb-2 mb-4 text-center">
          <h2 className="font-stamped text-xl font-bold tracking-wider">{title}</h2>
        </div>
        <div className="flex-1 flex flex-col gap-3 text-sm">{children}</div>
      </div>
    </div>
  );
}

// ─── Clickable Field ───────────────────────────────────────────────────────────
function Field({ label, value, highlight = false, fieldKey, circledFields, onCircle }: {
  label: string; value: string | number; highlight?: boolean;
  fieldKey: string; circledFields: Set<string>; onCircle: (k: string) => void;
}) {
  const isCircled = circledFields.has(fieldKey);
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 border-b border-ink/10 pb-1 relative rounded cursor-pointer select-none transition-all duration-150",
        isCircled ? "ring-2 ring-red-500 ring-offset-1 bg-red-50/60" : "hover:bg-black/5"
      )}
      onClick={(e) => { e.stopPropagation(); onCircle(fieldKey); }}
      title="Click to circle this field as suspicious"
    >
      <span className="text-xs font-bold text-ink-faded uppercase tracking-wider">{label}</span>
      <span className={cn("font-medium", highlight && "bg-yellow-200/50", isCircled && "text-red-700 font-bold")}>{value}</span>
      {isCircled && (
        <span className="absolute -top-1 -right-1 text-[9px] font-bold text-red-600 bg-white border border-red-400 rounded-full px-1">✗</span>
      )}
    </div>
  );
}

function ClickRow({ label, value, fieldKey, circledFields, onCircle, bold = false }: {
  label: string; value: string; fieldKey: string; circledFields: Set<string>;
  onCircle: (k: string) => void; bold?: boolean;
}) {
  const isCircled = circledFields.has(fieldKey);
  return (
    <div
      className={cn(
        "flex justify-between rounded px-1 py-0.5 cursor-pointer transition-all",
        isCircled ? "ring-2 ring-red-500 bg-red-50/60" : "hover:bg-black/5",
        bold && "font-bold"
      )}
      onClick={(e) => { e.stopPropagation(); onCircle(fieldKey); }}
    >
      <span className={cn("text-xs", bold && "font-bold")}>{label}</span>
      <span className={isCircled ? "text-red-700 font-bold" : ""}>{value}</span>
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

    // ─── FORM 1040 ─────────────────────────────────────────────────────────────
    case '1040': {
      const d = doc as TaxReturnDoc;
      const { lines } = calculateOrdinaryTax(d.taxableIncome);

      return (
        <FormWrapper title="FORM 1040-FI" className="h-[530px]">
          <Field label="Taxpayer Name" value={d.name} fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
          <Field label="Social Security No." value={d.ssn} fieldKey={`${doc.id}:ssn`} circledFields={circledFields} onCircle={onCircle} />

          <div className="mt-1 p-2.5 bg-black/5 rounded border border-ink/20 flex flex-col gap-1.5">
            <ClickRow label="1. Gross Income:" value={formatMoney(d.grossIncome)} fieldKey={`${doc.id}:gross`} circledFields={circledFields} onCircle={onCircle} />
            <ClickRow label="2. Deductions:" value={`– ${formatMoney(d.deductions)}`} fieldKey={`${doc.id}:ded`} circledFields={circledFields} onCircle={onCircle} />
            <div className="border-t border-ink/30 my-0.5" />
            <ClickRow label="3. Taxable Income:" value={formatMoney(d.taxableIncome)} fieldKey={`${doc.id}:taxable`} circledFields={circledFields} onCircle={onCircle} bold />
          </div>

          {/* Progressive bracket breakdown */}
          <div className="p-2 border border-dashed border-ink/30 rounded bg-black/5 flex flex-col gap-1">
            <div className="text-[9px] font-bold uppercase tracking-widest text-ink-faded mb-0.5">Progressive Tax Calculation</div>
            {lines.map((l, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-ink-faded">{l.label}:</span>
                <span>{formatMoney(l.tax)}</span>
              </div>
            ))}
            {lines.length === 0 && (
              <div className="text-[10px] text-ink-faded italic">No taxable income.</div>
            )}
          </div>

          <div
            className={cn(
              "mt-auto p-3 rounded border-2 border-ink cursor-pointer transition-all",
              circledFields.has(`${doc.id}:taxowed`) ? "ring-2 ring-red-500 bg-red-50/60 border-red-500" : "bg-black/10"
            )}
            onClick={(e) => { e.stopPropagation(); onCircle(`${doc.id}:taxowed`); }}
          >
            <div className="flex justify-between items-center font-bold">
              <span className="text-xs">4. TAX OWED:</span>
              <span className={cn("text-base", circledFields.has(`${doc.id}:taxowed`) ? "text-red-700" : "")}>{formatMoney(d.taxOwed)}</span>
            </div>
          </div>
          <div className="text-[9px] italic opacity-50 text-center">"Under penalty of perjury, I declare these facts are true."</div>
        </FormWrapper>
      );
    }

    // ─── W-2 ───────────────────────────────────────────────────────────────────
    case 'W2': {
      const d = doc as W2Doc;
      return (
        <FormWrapper title="W-2 STATEMENT" className="h-[360px]">
          <div className="border-2 border-ink p-3 bg-white/30 rounded flex flex-col gap-3">
            <Field label="a. Employee Name" value={d.name} fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
            <Field label="b. Employee SSN" value={d.ssn} fieldKey={`${doc.id}:ssn`} circledFields={circledFields} onCircle={onCircle} />
            <Field label="c. Employer" value={d.employer} fieldKey={`${doc.id}:employer`} circledFields={circledFields} onCircle={onCircle} />
            <div className="mt-1 border-t-2 border-ink pt-2">
              <Field label="1. Wages, tips, other comp." value={formatMoney(d.wages)} highlight fieldKey={`${doc.id}:wages`} circledFields={circledFields} onCircle={onCircle} />
            </div>
          </div>
          <div className="mt-auto text-[9px] text-center text-ink-faded uppercase tracking-widest">Department of the Treasury</div>
        </FormWrapper>
      );
    }

    // ─── EXPENSE REPORT ────────────────────────────────────────────────────────
    case 'EXPENSE': {
      const d = doc as ExpenseDoc;
      return (
        <FormWrapper title="EXPENSE REPORT" className="h-[320px]">
          <Field label="Submitted By" value={d.name} fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
          <div className="flex-1 mt-2 border border-ink/20 p-2 text-xs flex flex-col gap-1">
            <div className="flex justify-between text-ink-faded border-b border-ink/20 pb-1 mb-1 text-[9px] uppercase tracking-wider">
              <span>Category</span><span>Amount</span>
            </div>
            {d.lineItems.map((item, i) => (
              <div key={i} className={cn(
                "flex justify-between py-0.5 border-b border-ink/10 last:border-0",
                item.isSuspect && "text-amber-700 font-semibold"
              )}>
                <span>{item.description}{item.isSuspect && <span className="ml-1 text-[8px] text-red-500 font-bold">[?]</span>}</span>
                <span>{formatMoney(item.amount)}</span>
              </div>
            ))}
          </div>
          <div
            className={cn(
              "mt-1 flex justify-between items-center font-bold text-sm p-2 rounded cursor-pointer transition-all",
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

    // ─── ID CARD ───────────────────────────────────────────────────────────────
    case 'ID': {
      const d = doc as IDDoc;
      return (
        <FormWrapper title="CITIZEN ID CARD" className="h-[220px] w-[380px] bg-blue-50/50">
          <div className="flex gap-4">
            <div className="w-24 h-32 bg-ink/10 border-2 border-ink flex items-center justify-center overflow-hidden shrink-0">
              <svg viewBox="0 0 24 24" className="w-16 h-16 text-ink/30" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <Field label="Full Name" value={d.name} fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />
              <div className="flex gap-3">
                <Field label="DOB" value={d.dob} fieldKey={`${doc.id}:dob`} circledFields={circledFields} onCircle={onCircle} />
                <Field label="SSN" value={d.ssn} fieldKey={`${doc.id}:ssn`} circledFields={circledFields} onCircle={onCircle} />
              </div>
              <div className="mt-auto">
                <img src={`${import.meta.env.BASE_URL}images/seal.png`} alt="Seal" className="w-10 h-10 opacity-40 ml-auto" />
              </div>
            </div>
          </div>
        </FormWrapper>
      );
    }

    // ─── SCHEDULE D (Capital Gains) ────────────────────────────────────────────
    case 'SCHEDULE_D': {
      const d = doc as ScheduleDDoc;
      const ltPct = Math.round(d.ltRate * 100);
      return (
        <FormWrapper title="SCHEDULE D — CAPITAL GAINS" className="h-[400px]">
          <Field label="Taxpayer Name" value={d.name} fieldKey={`${doc.id}:name`} circledFields={circledFields} onCircle={onCircle} />

          <div className="p-2 border border-ink/20 rounded bg-black/5 flex flex-col gap-1.5 text-xs">
            <div className="text-[9px] font-bold uppercase tracking-widest text-ink-faded mb-1">Part I — Short-Term (Held &lt; 1 Year)</div>
            <ClickRow
              label="Net Short-Term Gains:"
              value={formatMoney(d.shortTermGains)}
              fieldKey={`${doc.id}:st-gains`}
              circledFields={circledFields} onCircle={onCircle}
            />
            <ClickRow
              label="Short-Term Tax (Ordinary Rate):"
              value={formatMoney(d.shortTermTax)}
              fieldKey={`${doc.id}:st-tax`}
              circledFields={circledFields} onCircle={onCircle}
            />
          </div>

          <div className="p-2 border border-ink/20 rounded bg-black/5 flex flex-col gap-1.5 text-xs">
            <div className="text-[9px] font-bold uppercase tracking-widest text-ink-faded mb-1">Part II — Long-Term (Held ≥ 1 Year)</div>
            <div className="text-[9px] text-amber-700 italic">Preferential rate applies: {ltPct}%</div>
            <ClickRow
              label="Net Long-Term Gains:"
              value={formatMoney(d.longTermGains)}
              fieldKey={`${doc.id}:lt-gains`}
              circledFields={circledFields} onCircle={onCircle}
            />
            <ClickRow
              label={`Long-Term Tax (${ltPct}%):`}
              value={formatMoney(d.longTermTax)}
              fieldKey={`${doc.id}:lt-tax`}
              circledFields={circledFields} onCircle={onCircle}
            />
          </div>

          <div
            className={cn(
              "mt-auto p-3 rounded border-2 border-ink cursor-pointer transition-all",
              circledFields.has(`${doc.id}:total`) ? "ring-2 ring-red-500 bg-red-50/60 border-red-500" : "bg-black/10"
            )}
            onClick={(e) => { e.stopPropagation(); onCircle(`${doc.id}:total`); }}
          >
            <div className="flex justify-between items-center font-bold text-sm">
              <span>TOTAL CAPITAL GAINS TAX:</span>
              <span className={circledFields.has(`${doc.id}:total`) ? "text-red-700" : ""}>{formatMoney(d.totalCapitalGainsTax)}</span>
            </div>
          </div>
          <div className="text-[9px] italic opacity-50 text-center">Short-term = ordinary rate. Long-term = preferential rate.</div>
        </FormWrapper>
      );
    }
  }
}
