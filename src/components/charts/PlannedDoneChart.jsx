/**
 * Barras agrupadas de minutos planejados × executados por dia (SVG puro).
 */
import { useElementWidth } from "../../hooks/useElementWidth";

export function PlannedDoneChart({ days, height = 170 }) {
  let [t, r] = useElementWidth(),
    l = Math.max(r, 240),
    o = height,
    d = {
      l: 34,
      r: 6,
      t: 8,
      b: 22,
    },
    u = l - d.l - d.r,
    L = o - d.t - d.b,
    g = Math.max(60, ...days.map((f) => Math.max(f.planned, f.done, f.cap || 0))),
    m = (f) => d.t + L - (f / g) * L,
    h = Math.min(26, u / days.length / 3);
  return (
    <div ref={t} className="w-full" role="img" aria-label="Minutos planejados e executados por dia">
      {r > 0 && (
        <svg width={l} height={o}>
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={d.l} x2={l - d.r} y1={m(g * f)} y2={m(g * f)} stroke="var(--grid)" />
              <text
                x={d.l - 5}
                y={m(g * f) + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="var(--muted)"
              >
                {Math.round((g * f) / 6) / 10}h
              </text>
            </g>
          ))}
          {days.map((f, n) => {
            let i = d.l + (n + 0.5) * (u / days.length);
            return (
              <g key={n}>
                <rect
                  x={i - h - 1}
                  y={m(f.planned)}
                  width={h}
                  height={L - (m(f.planned) - d.t)}
                  fill="none"
                  stroke="var(--ink2)"
                  strokeWidth="1.5"
                  rx="2"
                >
                  <title>{`${f.label}: planejado ${f.planned} min`}</title>
                </rect>
                <rect
                  x={i + 1}
                  y={m(f.done)}
                  width={h}
                  height={L - (m(f.done) - d.t)}
                  fill="var(--series1)"
                  rx="2"
                >
                  <title>{`${f.label}: executado ${f.done} min`}</title>
                </rect>
                <text
                  x={i}
                  y={o - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill={f.today ? "var(--ink)" : "var(--muted)"}
                  fontWeight={f.today ? 700 : 400}
                >
                  {f.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <div className="mt-1 flex gap-4 text-[11px] text-ink2">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm border-[1.5px] border-ink2" />
          Planejado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-series1" />
          Executado
        </span>
      </div>
    </div>
  );
}
