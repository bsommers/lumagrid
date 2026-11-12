import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export const FALLBACK_WIDTH = 560;

/** Measured content width of an element (floor, never below `min`); falls back where layout is unavailable. */
export function useWidth<T extends HTMLElement>(min = 240): [RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (w: number) => { if (w > 0) setWidth(Math.max(min, Math.floor(w))); };
    measure(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => { const e = entries[0]; if (e) measure(e.contentRect.width); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [min]);
  return [ref, width];
}
