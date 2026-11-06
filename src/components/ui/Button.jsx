/**
 * Botões: Button (primary, soft, ghost, danger) e IconButton.
 */
import { cn } from "../../lib/cn";

export const Button = ({
  variant = "soft",
  size = "md",
  icon: Icon,
  children,
  className,
  ...o
}) => {
  let d = {
    primary: "bg-accent text-onAccent hover:bg-accentHover border-transparent",
    soft: "bg-surface text-ink hover:bg-surface2 border-line2",
    ghost: "bg-transparent text-ink2 hover:bg-surface2 border-transparent",
    danger: "bg-surface text-critInk hover:bg-critSoft border-line2",
  }[variant];
  return (
    <button
      type="button"
      {...o}
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none",
        d,
        size === "sm" ? "h-7 px-2 text-xs gap-1" : "h-9 px-3 text-[13px] gap-1.5",
        className,
      )}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 16} aria-hidden />}
      {children}
    </button>
  );
};

export const IconButton = ({ icon: Icon, label, className, ...r }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    {...r}
    className={cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-md text-ink2 hover:bg-surface2",
      className,
    )}
  >
    <Icon size={16} aria-hidden />
  </button>
);
