import type { TransformedData } from './types.js';

/**
 * A step in a TransformPipeline. The first step receives raw unknown input;
 * subsequent steps receive TransformedData. TransformPipeline.run never
 * passes per-step options — a step that needs configuration should close
 * over it (see the `flatten → aggregate` example in the pipeline tests).
 */
export interface PipelineStep {
  readonly name: string;
  transform(data: TransformedData): TransformedData;
}

/**
 * Composes multiple transforms into a single pass.
 *
 * The first step may handle raw unknown input if you pass a DataTransform whose
 * transform method accepts unknown. Subsequent steps receive TransformedData.
 *
 * @example
 * ```ts
 * const pipeline = new TransformPipeline([flatten, groupBy('category')]);
 * const result = pipeline.run(rawData);
 * ```
 */
export class TransformPipeline {
  private readonly steps: PipelineStep[];

  constructor(steps: PipelineStep[]) {
    if (steps.length === 0) throw new Error('TransformPipeline requires at least one step');
    this.steps = steps;
  }

  run(input: unknown): TransformedData {
    const first = this.steps[0];
    if (!first) throw new Error('No steps in pipeline');

    // Cast: the first step's transform is called with raw input.
    // DataTransform.transform accepts unknown, ChainableTransform accepts TransformedData.
    // Both are structurally compatible when called via this cast.
    let result: TransformedData = (first.transform as (data: unknown) => TransformedData)(input);

    for (const step of this.steps.slice(1)) {
      result = step.transform(result);
    }

    return result;
  }

  /** Returns the names of all steps, useful for debugging. */
  get stepNames(): string[] {
    return this.steps.map((s) => s.name);
  }
}
