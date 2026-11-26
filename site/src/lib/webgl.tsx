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

/**
 * Catches a render error from a third-party graph engine and shows a readable notice instead of
 * unmounting the whole page. Reagraph 4.32 bundles React Three Fiber 9, which needs React 19 and
 * throws under React 18.
 */
export class EngineErrorBoundary extends React.Component<
  { engine: string; requirement?: string; children: React.ReactNode },
  { error: Error | null }
> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  override render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div role="alert" style={{ padding: 16, textAlign: 'center' }}>
        {this.props.engine} could not start in this browser.
        {this.props.requirement ? ` ${this.props.requirement}` : ''}
        {' '}Details: {error.message}
      </div>
    );
  }
}
