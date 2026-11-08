import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/orbitron';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
