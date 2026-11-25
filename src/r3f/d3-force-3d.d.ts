// Minimal ambient types for the untyped optional peer `d3-force-3d` (only what src/r3f uses).
declare module 'd3-force-3d' {
  export interface SimNode {
    id?: string;
    x: number;
    y: number;
    z: number;
    [key: string]: unknown;
  }
  export interface Force {
    (alpha: number): void;
  }
  export interface LinkForce extends Force {
    id(fn: (node: SimNode) => string): this;
    distance(d: number): this;
  }
  export interface ManyBodyForce extends Force {
    strength(s: number): this;
  }
  export interface Simulation {
    stop(): this;
    tick(): this;
    alpha(): number;
    alphaMin(): number;
    alphaDecay(d: number): this;
    randomSource(fn: () => number): this;
    force(name: string, force: Force | null): this;
    nodes(): SimNode[];
  }
  export function forceSimulation(nodes: SimNode[], numDimensions?: number): Simulation;
  export function forceLink(links: Array<{ source: string; target: string }>): LinkForce;
  export function forceManyBody(): ManyBodyForce;
  export function forceCenter(x?: number, y?: number, z?: number): Force;
}
