import { describe, it, expect } from 'vitest';
import { TransformPipeline } from '../pipeline.js';

describe('TransformPipeline errors', () => {
  it('throws when constructed with no steps', () => {
    expect(() => new TransformPipeline([])).toThrow(/at least one step/);
  });

  it('throws "No steps" if the steps array is emptied after construction', () => {
    const steps: ConstructorParameters<typeof TransformPipeline>[0] = [
      { name: 's', transform: (d: unknown) => d as never },
    ];
    const p = new TransformPipeline(steps);
    steps.length = 0;
    expect(() => p.run({})).toThrow(/No steps/);
  });
});
