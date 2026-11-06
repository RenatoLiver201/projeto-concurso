/**
 * Componentes de feedback e layout: EmptyState, InfoTip, StatCard, ProgressBar, Tabs, PageHeader.
 */
import { useState } from "react";
import { Inbox, Info } from "lucide-react";
import { cn } from "../../lib/cn";

export const EmptyState = ({ icon: Icon = Inbox, title, children, action }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line2 px-6 py-8 text-center">
    <Icon size={22} className="text-muted" aria-hidden />
    <p className="text-[13px] font-medium text-ink">{title}</p>
    {children && <p className="max-w-md text-xs text-ink2">{children}</p>}
    {action}
  </div>
);

function InfoTip({ children }) {
  let [s, t] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Definição"
        aria-expanded={s}
        onClick={() => t(!s)}
        className="rounded p-0.5 text-muted hover:text-ink"
      >
        <Info size={13} aria-hidden />
      </button>
      {s && (
        <span
          role="note"
          className="absolute left-0 top-5 z-30 w-64 rounded-md border border-line2 bg-surface p-2.5 text-xs font-normal leading-snug text-ink2 shadow-lg"
          onClick={() => t(false)}
        >
          {children}
        </span>
      )}
    </span>
  );
}

export const StatCard = ({ label, value, sub, def, tone, big }) => (
  <div className="min-w-0 rounded-lg border border-line bg-surface p-3">
    <div className="flex items-center gap-1 text-xs text-ink2">
      {label}
      {def && <InfoTip>{def}</InfoTip>}
    </div>
    <div
      className={cn(
        "mt-1 font-semibold tabular-nums leading-none",
        big ? "text-3xl" : "text-2xl",
        tone === "crit"
          ? "text-critInk"
          : tone === "warn"
            ? "text-warnInk"
            : tone === "good"
              ? "text-goodInk"
              : "text-ink",
      )}
    >
      {value}
    </div>
    {sub && <div className="mt-1.5 text-[11px] leading-snug text-muted">{sub}</div>}
  </div>
);

export const ProgressBar = ({ value, tone = "accent", label }) => (
  <div
    className="h-1.5 w-full overflow-hidden rounded-full bg-surface2"
    role="progressbar"
    aria-valuenow={Math.round((value || 0) * 100)}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={label}
  >
    <div
      className={cn(
        "h-full rounded-full",
        tone === "good"
          ? "bg-good"
          : tone === "crit"
            ? "bg-crit"
            : tone === "warn"
              ? "bg-serious"
              : "bg-accent",
      )}
      style={{
        width: `${Math.max(0, Math.min(1, value || 0)) * 100}%`,
      }}
    />
  </div>
);

export const Tabs = ({ tabs, value, onChange }) => (
  <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
    {tabs.map(([r, l]) => (
      <button
        key={r}
        role="tab"
        aria-selected={value === r}
        onClick={() => onChange(r)}
        className={cn(
          "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium",
          value === r ? "border-accent text-ink" : "border-transparent text-ink2 hover:text-ink",
        )}
      >
        {l}
      </button>
    ))}
  </div>
);

export const PageHeader = ({ title, sub, children }) => (
  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div className="min-w-0">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      {sub && <p className="mt-0.5 max-w-2xl text-xs text-ink2">{sub}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);
