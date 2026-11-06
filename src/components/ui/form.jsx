/**
 * Campos de formulário: Field, TextInput, NumberInput, Select, Textarea, Checkbox.
 */
import { cn } from "../../lib/cn";

const autoWidthClass = (a) => (/(^|\s)(!?w-|min-w-)/.test(a || "") ? "" : "w-full");

const INPUT_BASE =
  "rounded-md border border-line2 bg-surface px-2.5 text-[13px] text-ink placeholder:text-muted focus:border-accent";

export const Field = ({ label, hint, children, className }) => (
  <label className={cn("flex min-w-0 flex-col gap-1", className)}>
    <span className="text-xs font-medium text-ink2">{label}</span>
    {children}
    {hint && <span className="text-[11px] text-muted">{hint}</span>}
  </label>
);

export const TextInput = ({ className, ...s }) => (
  <input {...s} className={cn(INPUT_BASE, "h-9", autoWidthClass(className), className)} />
);

export const NumberInput = ({ value, onChange, className, ...r }) => (
  <input
    type="number"
    inputMode="decimal"
    {...r}
    value={value ?? ""}
    onChange={(l) => onChange(l.target.value === "" ? null : Number(l.target.value))}
    className={cn(INPUT_BASE, "h-9 tabular-nums", autoWidthClass(className), className)}
  />
);

export const Select = ({ className, children, ...t }) => (
  <select {...t} className={cn(INPUT_BASE, "h-9 pr-7", autoWidthClass(className), className)}>
    {children}
  </select>
);

export const Textarea = ({ className, ...s }) => (
  <textarea
    {...s}
    className={cn(INPUT_BASE, "min-h-[72px] py-2", autoWidthClass(className), className)}
  />
);

export const Checkbox = ({ label, checked, onChange, id: r }) => (
  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink">
    <input
      id={r}
      type="checkbox"
      checked={!!checked}
      onChange={(l) => onChange(l.target.checked)}
      className="h-4 w-4 accent-[var(--accent)]"
    />
    {label}
  </label>
);
