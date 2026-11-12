import React from 'react';
import { Hero } from './sections/Hero';
import { Features } from './sections/Features';
import { Gallery } from './sections/Gallery';
import { Examples } from './sections/Examples';
import { Links } from './sections/Links';

/** Site shell: five anchored sections in order. Plans 05-10 and 05-11 fill the section files. */
export function App(): React.ReactElement {
  return (
    <main>
      <Hero />
      <Features />
      <Gallery />
      <Examples />
      <Links />
    </main>
  );
}
