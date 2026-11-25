import React, { useEffect, useState } from 'react';

/** True when the user asks the OS for less motion. Safe on the server and in jsdom. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (): void => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

/** True when a WebGL context can be created (false in jsdom and on locked-down browsers). */
export function hasWebGL(): boolean {
  if (typeof window === 'undefined' || typeof (window as { WebGLRenderingContext?: unknown }).WebGLRenderingContext === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null;
  } catch {
    return false;
  }
}

/** True when a 2D canvas context exists (false in jsdom). */
export function hasCanvas2D(): boolean {
  try {
    return typeof document !== 'undefined' && document.createElement('canvas').getContext('2d') !== null;
  } catch {
    return false;
  }
}

/** Renders children only where the canvas kind works; otherwise a short, readable notice. */
export function WebGLGate({ width, height, kind = 'webgl', children }: {
  width: number; height: number; kind?: 'webgl' | '2d'; children: React.ReactNode;
}): React.ReactElement {
  const [ok] = useState(kind === 'webgl' ? hasWebGL : hasCanvas2D);
  if (ok) return <>{children}</>;
  return (
    <div role="status" style={{ width, height, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 16, boxSizing: 'border-box' }}>
      This network view needs canvas graphics, which are not available in this browser.
    </div>
  );
}
