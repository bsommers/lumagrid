// Source of bring-your-own-engine.md (the conformance step). Compiled by `npm run typecheck:site`
// and executed by __tests__/byo-engine.test.tsx.

// #region check
import { assertPluginConformance, checkPluginConformance } from 'lumagrid/testing';
import { tinyPlugin } from './byo-engine.js';

// Inspect the structured report...
export const report = checkPluginConformance(tinyPlugin);
// report.ok is true; report.checks lists { id, title, status, detail } for all eight checks.

// ...or assert, which throws an Error naming every failed check. Call it from any test runner.
export function proveTinyplot() {
  assertPluginConformance(tinyPlugin);
}
// #endregion
