import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// vitest.config.ts doesn't set test.globals, so @testing-library/react
// can't auto-detect a global afterEach to clean up after itself — without
// this, unmounted DOM from every earlier test in a file stays in the
// document and leaks into later tests' queries (e.g. queryAllByRole).
afterEach(() => {
  cleanup();
});
