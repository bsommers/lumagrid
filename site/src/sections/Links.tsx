import React from 'react';
import './links.css';

const REPO = 'https://github.com/bsommers/lumagrid';
const API_URL = `${import.meta.env.BASE_URL}api/`;

interface LinkItem {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly external: boolean;
}

const LINKS: readonly LinkItem[] = [
  {
    id: 'guide',
    label: 'User guide',
    description: 'Install, build a first chart, theme it and add plugins.',
    href: `${REPO}/blob/main/docs/guide/README.md`,
    external: true,
  },
  {
    id: 'api',
    label: 'API reference',
    description: 'Every export, generated from the TypeScript source.',
    href: API_URL,
    external: false,
  },
  {
    id: 'architecture',
    label: 'Architecture',
    description: 'The layers, the plugin contract and the data flow.',
    href: `${REPO}/blob/main/docs/ARCHITECTURE.md`,
    external: true,
  },
  {
    id: 'source',
    label: 'Source',
    description: 'The repository on GitHub.',
    href: REPO,
    external: true,
  },
  {
    id: 'changelog',
    label: 'Changelog',
    description: 'What changed in each release.',
    href: `${REPO}/blob/main/CHANGELOG.md`,
    external: true,
  },
];

/** Docs and API links plus the footer with license and pre-release status. */
export function Links(): React.ReactElement {
  return (
    <section id="links" className="lg-links" aria-labelledby="links-title">
      <h2 id="links-title" className="lg-links-title">
        Docs and source
      </h2>
      <ul className="lg-links-list">
        {LINKS.map((link) => (
          <li key={link.id} className="lg-link-card">
            <a
              className="lg-link-anchor"
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.label}
            </a>
            <p>{link.description}</p>
          </li>
        ))}
      </ul>
      <footer className="lg-footer">
        <p>Licensed under the Apache License 2.0 (Apache-2.0). Copyright 2026 Bill Sommers.</p>
        <p>Lumagrid is pre-1.0. Install it with npm install lumagrid.</p>
      </footer>
    </section>
  );
}
