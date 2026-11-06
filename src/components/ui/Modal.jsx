/**
 * Diálogo modal (Esc e clique fora fecham; vira bottom-sheet no mobile).
 */
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { IconButton } from "./Button";
import { cn } from "../../lib/cn";

export function Modal({ open, onClose, title, children, footer, wide }) {
  let d = useRef(null);
  return (
    useEffect(() => {
      if (!open) return;
      let u = (L) => L.key === "Escape" && onClose();
      return (
        window.addEventListener("keydown", u),
        () => window.removeEventListener("keydown", u)
      );
    }, [open, onClose]),
    open ? (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-scrim sm:items-center sm:p-6"
        onMouseDown={(u) => u.target === u.currentTarget && onClose()}
      >
        <div
          ref={d}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            "flex max-h-[92vh] w-full flex-col rounded-t-xl border border-line bg-surface shadow-xl sm:rounded-xl",
            wide ? "sm:max-w-3xl" : "sm:max-w-lg",
          )}
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            <IconButton icon={X} label="Fechar" onClick={onClose} />
          </header>
          <div className="overflow-y-auto p-4">{children}</div>
          {footer && (
            <footer className="flex flex-wrap justify-end gap-2 border-t border-line px-4 py-3">
              {footer}
            </footer>
          )}
        </div>
      </div>
    ) : null
  );
}
