import { describe, it, expect } from 'vitest';
import { TransformPipeline } from '../pipeline.js';
import { flatten } from '../flatten.js';
import { aggregate } from '../aggregate.js';

describe('TransformPipeline', () => {
  it('runs a single transform', () => {
    const pipeline = new TransformPipeline([flatten]);
    const result = pipeline.run([{ a: { b: 1 } }]);
    expect(result.rows[0]).toHaveProperty('a.b', 1);
  });

  it('chains flatten → aggregate', () => {
    const pipeline = new TransformPipeline([
      flatten,
      {
        name: 'aggregate',
        transform: (data) =>
          aggregate.transform(data, {
            groupBy: ['region'],
            aggregations: { sales: 'sum' },
          }),
      },
    ]);
    const result = pipeline.run([
      { region: 'East', sales: 100 },
      { region: 'East', sales: 50 },
      { region: 'West', sales: 200 },
    ]);
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(150);
  });

  it('exposes step names', () => {
    const pipeline = new TransformPipeline([flatten]);
    expect(pipeline.stepNames).toEqual(['flatten']);
  });

  it('throws when constructed with zero steps', () => {
    expect(() => new TransformPipeline([])).toThrow();
  });
});
