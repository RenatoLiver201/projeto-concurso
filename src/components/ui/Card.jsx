/**
 * Cartão com cabeçalho opcional.
 */
import { cn } from "../../lib/cn";

export const Card = ({ title, sub, right, children, className, pad = true, id: d }) => (
  <section id={d} className={cn("rounded-lg border border-line bg-surface min-w-0", className)}>
    {(title || right) && (
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
          {sub && <p className="text-xs text-muted">{sub}</p>}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </header>
    )}
    <div className={pad ? "p-4" : ""}>{children}</div>
  </section>
);
