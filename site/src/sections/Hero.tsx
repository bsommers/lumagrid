import React, { useState } from 'react';
import lockupUrl from '../../../brand/lockup.svg';
import taglineRaw from '../../../brand/tagline.txt?raw';
import heroSource from '../../../docs/guide/snippets/hero.tsx?raw';
import { extractRegion } from '../lib/region';
import './hero.css';

const INSTALL_COMMAND = 'npm install lumagrid';
const QUICKSTART = extractRegion(heroSource, 'hero');

/** Landing hero: logo lockup, tagline, install command, quickstart and two calls to action. */
export function Hero(): React.ReactElement {
  const [copied, setCopied] = useState(false);

  // The clipboard is written only from this click handler; failures are ignored quietly.
  const copyInstall = () => {
    void navigator.clipboard?.writeText(INSTALL_COMMAND).then(
      () => setCopied(true),
      () => undefined,
    );
  };

  return (
    <section id="hero" className="lg-hero" aria-label="Lumagrid">
      <h1 className="lg-hero-logo">
        <img src={lockupUrl} alt="Lumagrid" className="lg-hero-lockup" />
      </h1>
      <p className="lg-hero-tagline">{taglineRaw.trim()}</p>
      <div className="lg-hero-install">
        <code className="lg-hero-command">{INSTALL_COMMAND}</code>
        <button type="button" className="lg-hero-copy" onClick={copyInstall}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="lg-hero-code" tabIndex={0} aria-label="Quickstart code">
        <code>{QUICKSTART}</code>
      </pre>
      <div className="lg-hero-actions">
        <a className="lg-hero-btn" href="#gallery">Explore the charts</a>
        <a className="lg-hero-btn lg-hero-btn-secondary" href="#links">Read the guide</a>
      </div>
    </section>
  );
}
