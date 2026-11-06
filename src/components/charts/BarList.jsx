/**
 * Gráfico de barras horizontais em lista (CSS puro, sem biblioteca de gráficos).
 */
import { cn } from "../../lib/cn";

export function BarList({ rows, empty }) {
  return rows.length ? (
    <ul className="flex flex-col gap-2.5">
      {rows.map((t, r) => (
        <li
          key={r}
          className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-xs sm:grid-cols-[minmax(0,14rem)_1fr_auto]"
        >
          <span className="truncate text-ink2" title={t.label}>
            {t.label}
          </span>
          <span className="h-3 overflow-hidden rounded-sm bg-surface2">
            {t.value != null && (
              <span
                className={cn(
                  "block h-full rounded-sm",
                  t.hatched ? "bg-hatch" : t.tone === "crit" ? "bg-crit" : "bg-series1",
                )}
                style={{
                  width: `${Math.max(2, Math.min(1, t.value) * 100)}%`,
                }}
              />
            )}
          </span>
          <span className="min-w-[4.5rem] text-right tabular-nums text-ink">{t.text}</span>
        </li>
      ))}
    </ul>
  ) : (
    empty || null
  );
}
