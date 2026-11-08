import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import taglineRaw from '../../../brand/tagline.txt?raw';
import heroSource from '../../../docs/guide/snippets/hero.tsx?raw';
import { Example } from '../../../docs/guide/snippets/hero';
import { extractRegion } from '../lib/region';
import { Hero } from '../sections/Hero';

const tagline = taglineRaw.trim();

describe('Hero', () => {
  it('has a single h1 holding the Lumagrid logo image', () => {
    const { container } = render(<Hero />);
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.querySelector('img')).toHaveAttribute('alt', 'Lumagrid');
  });

  it('shows the tagline from brand/tagline.txt', () => {
    render(<Hero />);
    expect(screen.getByText(tagline)).toBeInTheDocument();
  });

  it('shows the install command and a copy button', () => {
    render(<Hero />);
    expect(screen.getByText('npm install lumagrid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('shows the hero region of the guide snippet as the quickstart, within about 14 lines', () => {
    const { container } = render(<Hero />);
    const region = extractRegion(heroSource, 'hero');
    expect(container.querySelector('pre code')?.textContent).toBe(region);
    expect(region.split('\n').length).toBeLessThanOrEqual(16);
  });

  it('links to the gallery and links anchors', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: 'Explore the charts' })).toHaveAttribute('href', '#gallery');
    expect(screen.getByRole('link', { name: 'Read the guide' })).toHaveAttribute('href', '#links');
  });
});

describe('hero quickstart snippet', () => {
  it('renders a chart svg', () => {
    render(<Example />);
    expect(screen.getByRole('img').tagName.toLowerCase()).toBe('svg');
    expect(screen.getByText('North')).toBeInTheDocument();
  });
});
