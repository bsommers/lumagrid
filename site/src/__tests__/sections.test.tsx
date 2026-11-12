import React from 'react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import taglineRaw from '../../../brand/tagline.txt?raw';
import { Features } from '../sections/Features';
import { Links } from '../sections/Links';

const here = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(join(here, '..', '..', 'index.html'), 'utf8');
const tagline = taglineRaw.trim();

describe('Features', () => {
  it('embeds both diagrams with meaningful alt text', () => {
    const { container } = render(<Features />);
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs).toHaveLength(2);
    expect(imgs.some((i) => /pipeline\.svg/.test(i.getAttribute('src') ?? ''))).toBe(true);
    expect(imgs.some((i) => /plugin-architecture\.svg/.test(i.getAttribute('src') ?? ''))).toBe(true);
    for (const img of imgs) {
      expect((img.getAttribute('alt') ?? '').trim().length).toBeGreaterThan(20);
    }
  });

  it('keeps the features id and has no h1', () => {
    const { container } = render(<Features />);
    expect(container.querySelector('section#features')).not.toBeNull();
    expect(container.querySelector('h1')).toBeNull();
  });
});

describe('Links', () => {
  it('has the five links and the pre-1.0 footer', () => {
    const { container } = render(<Links />);
    expect(container.querySelector('section#links')).not.toBeNull();
    for (const name of ['User guide', 'API reference', 'Architecture', 'Source', 'Changelog']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Source' })).toHaveAttribute(
      'href',
      'https://github.com/bsommers/lumagrid',
    );
    expect(container.querySelector('footer')?.textContent).toMatch(/Apache-2\.0/);
    expect(container.querySelector('footer')?.textContent).toMatch(/pre-1\.0/);
    expect(container.querySelector('footer')?.textContent).toMatch(/npm install lumagrid/);
  });

  it('gives every external anchor noopener and noreferrer, and the API link a relative api/ href', () => {
    const { container } = render(<Links />);
    const anchors = [...container.querySelectorAll('a')];
    const external = anchors.filter((a) => /^https?:/.test(a.getAttribute('href') ?? ''));
    expect(external).toHaveLength(4);
    for (const a of external) {
      expect(a.getAttribute('rel')).toMatch(/noopener/);
      expect(a.getAttribute('rel')).toMatch(/noreferrer/);
      expect(a.getAttribute('target')).toBe('_blank');
    }
    expect(screen.getByRole('link', { name: 'API reference' }).getAttribute('href')).toMatch(/api\/$/);
  });
});

describe('index.html metadata', () => {
  it('has the absolute og:image and the Open Graph and Twitter tags', () => {
    expect(indexHtml).toContain(
      '<meta property="og:image" content="https://bsommers.github.io/lumagrid/og.png" />',
    );
    expect(indexHtml).toMatch(/property="og:title"/);
    expect(indexHtml).toMatch(/property="og:description"/);
    expect(indexHtml).toMatch(/property="og:type" content="website"/);
    expect(indexHtml).toMatch(/name="twitter:card" content="summary_large_image"/);
    expect(indexHtml).toMatch(/rel="canonical" href="https:\/\/bsommers\.github\.io\/lumagrid\/"/);
  });

  it('has a description containing the tagline', () => {
    const m = /<meta name="description" content="([^"]*)"/.exec(indexHtml);
    expect(m?.[1]).toContain(tagline);
  });

  it('references no font CDN', () => {
    expect(indexHtml).not.toMatch(/fonts\.googleapis|fonts\.gstatic|use\.typekit|cdnjs|unpkg|jsdelivr/);
  });
});
