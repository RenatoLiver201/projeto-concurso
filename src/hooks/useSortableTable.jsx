/**
 * Hook de ordenação de tabelas com cabeçalhos clicáveis.
 */
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/cn";

export function useSortableTable(a, s = null, t = "asc") {
  let [r, l] = useState(s),
    [o, d] = useState(t);
  return {
    sorted: useMemo(() => {
      if (!r) return a;
      let g = typeof r == "function" ? r : (m) => m[r];
      return [...a].sort((m, h) => {
        let f = g(m),
          n = g(h);
        if (f == null && n == null) return 0;
        if (f == null) return 1;
        if (n == null) return -1;
        let i = typeof f == "string" ? f.localeCompare(n) : f - n;
        return o === "asc" ? i : -i;
      });
    }, [a, r, o]),
    th: (g, m, h) => (
      <th
        scope="col"
        aria-sort={r === g ? (o === "asc" ? "ascending" : "descending") : "none"}
        className={cn(
          "whitespace-nowrap px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2",
          h,
        )}
      >
        <button
          type="button"
          className="inline-flex items-center gap-0.5 hover:text-ink"
          onClick={() => {
            r === g ? d(o === "asc" ? "desc" : "asc") : (l(g), d("asc"));
          }}
        >
          {m}
          {r === g && (o === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
        </button>
      </th>
    ),
  };
}
