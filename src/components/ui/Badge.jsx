/**
 * Selo colorido por tom (good, warn, crit, serious, info, muted, accent).
 */
import { cn } from "../../lib/cn";

const TONE_CLASSES = {
  good: "bg-goodSoft text-goodInk",
  warn: "bg-warnSoft text-warnInk",
  crit: "bg-critSoft text-critInk",
  serious: "bg-seriousSoft text-seriousInk",
  info: "bg-accentSoft text-accentInk",
  muted: "bg-surface2 text-ink2",
  accent: "bg-accent text-onAccent",
};

export const Badge = ({ tone = "muted", children, className, title }) => (
  <span
    title={title}
    className={cn(
      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap",
      TONE_CLASSES[tone],
      className,
    )}
  >
    {children}
  </span>
);
