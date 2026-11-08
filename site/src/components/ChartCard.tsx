import React, { useEffect, useId, useRef, useState } from 'react';

/** Width used when the container cannot be measured (for example under jsdom). */
export const FALLBACK_WIDTH = 560;

export interface ChartCardProps {
  title: string;
  description: string;
  /** Source shown by the show-code toggle; rendered as plain text only. */
  code: string;
  /** Renders the chart for the measured content width. */
  children: (width: number) => React.ReactNode;
}

/** A gallery card: heading, description, a live chart slot and a show-code toggle. */
export function ChartCard({ title, description, code, children }: ChartCardProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  const bodyRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const titleId = `${uid}-title`;
  const codeId = `${uid}-code`;

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = (w: number) => {
      if (w > 0) setWidth(Math.floor(w));
    };
    measure(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) measure(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="lg-card" aria-labelledby={titleId}>
      <header className="lg-card-head">
        <h3 id={titleId} className="lg-card-title">{title}</h3>
        <p className="lg-card-desc">{description}</p>
      </header>
      <div ref={bodyRef} className="lg-card-body">{children(width)}</div>
      <div className="lg-card-foot">
        <button
          type="button"
          className="lg-btn lg-btn-ghost"
          aria-expanded={open}
          aria-controls={codeId}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Hide code' : 'Show code'}
        </button>
      </div>
      {open && (
        <pre id={codeId} className="lg-code" tabIndex={0}>
          <code>{code}</code>
        </pre>
      )}
    </article>
  );
}
