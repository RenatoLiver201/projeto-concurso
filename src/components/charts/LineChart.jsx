/**
 * Gráfico de linha com meta, tooltip e marcação de amostra pequena (SVG puro).
 */
import { useState } from "react";
import { useElementWidth } from "../../hooks/useElementWidth";

export function LineChart({
  data,
  height = 190,
  target,
  yFmt = (o) => `${Math.round(o * 100)}%`,
  label,
}) {
  let [o, d] = useElementWidth(),
    [u, L] = useState(null),
    g = {
      l: 36,
      r: 10,
      t: 10,
      b: 24,
    },
    m = Math.max(d, 200),
    h = height,
    f = m - g.l - g.r,
    n = h - g.t - g.b,
    i = data.length,
    w = (I) => g.l + (i === 1 ? f / 2 : (I / (i - 1)) * f),
    v = (I) => g.t + (1 - I) * n,
    C = data.map((I, A) => ({
      ...I,
      i: A,
      px: w(A),
      py: I.y == null ? null : v(I.y),
    })),
    x = "",
    b = false;
  for (let I of C) {
    if (I.py == null) {
      b = false;
      continue;
    }
    ((x += `${b ? "L" : "M"}${I.px.toFixed(1)},${I.py.toFixed(1)}`), (b = true));
  }
  let N = Math.ceil(i / Math.max(2, Math.floor(f / 56)));
  return (
    <div ref={o} className="relative w-full" role="img" aria-label={label}>
      {d > 0 && (
        <svg
          width={m}
          height={h}
          onMouseLeave={() => L(null)}
          onMouseMove={(I) => {
            let A = I.currentTarget.getBoundingClientRect(),
              R = I.clientX - A.left;
            L(Math.max(0, Math.min(i - 1, Math.round(((R - g.l) / f) * (i - 1)))));
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((I) => (
            <g key={I}>
              <line
                x1={g.l}
                x2={m - g.r}
                y1={v(I)}
                y2={v(I)}
                stroke="var(--grid)"
                strokeWidth="1"
              />
              <text x={g.l - 6} y={v(I) + 3.5} textAnchor="end" fontSize="10" fill="var(--muted)">
                {yFmt(I)}
              </text>
            </g>
          ))}
          {target != null && (
            <g>
              <line
                x1={g.l}
                x2={m - g.r}
                y1={v(target)}
                y2={v(target)}
                stroke="var(--ink2)"
                strokeDasharray="4 3"
                strokeWidth="1"
              />
              <text x={m - g.r} y={v(target) - 4} textAnchor="end" fontSize="10" fill="var(--ink2)">
                {"meta "}
                {yFmt(target)}
              </text>
            </g>
          )}
          {C.map(
            (I) =>
              (I.i % N === 0 || I.i === i - 1) && (
                <text
                  key={I.i}
                  x={I.px}
                  y={h - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--muted)"
                >
                  {I.x}
                </text>
              ),
          )}
          <path d={x} fill="none" stroke="var(--series1)" strokeWidth="2" strokeLinejoin="round" />
          {C.map(
            (I) =>
              I.py != null && (
                <circle
                  key={I.i}
                  cx={I.px}
                  cy={I.py}
                  r={u === I.i ? 5 : 4}
                  fill={I.low ? "var(--surface)" : "var(--series1)"}
                  stroke="var(--series1)"
                  strokeWidth="2"
                />
              ),
          )}
          {u != null && <line x1={w(u)} x2={w(u)} y1={g.t} y2={g.t + n} stroke="var(--line2)" />}
        </svg>
      )}
      {u != null && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-line2 bg-surface px-2 py-1 text-xs shadow-md"
          style={{
            left: Math.min(Math.max(w(u) + 8, 4), Math.max(m - 150, 4)),
          }}
        >
          <div className="font-medium">{data[u].x}</div>
          <div className="text-ink2">
            {data[u].y == null ? "sem dados" : yFmt(data[u].y)}
            {data[u].n != null && ` · n=${data[u].n}`}
          </div>
          {data[u].low && data[u].y != null && <div className="text-warnInk">amostra pequena</div>}
        </div>
      )}
    </div>
  );
}
