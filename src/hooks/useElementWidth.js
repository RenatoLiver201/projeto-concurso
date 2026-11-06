/**
 * Hook que acompanha a largura de um elemento (ResizeObserver), usado pelos gráficos.
 */
import { useEffect, useRef, useState } from "react";

export function useElementWidth() {
  let a = useRef(null),
    [s, t] = useState(0);
  return (
    useEffect(() => {
      if (!a.current) return;
      let r = a.current,
        l = new ResizeObserver(() => t(r.clientWidth));
      return (l.observe(r), t(r.clientWidth), () => l.disconnect());
    }, []),
    [a, s]
  );
}
