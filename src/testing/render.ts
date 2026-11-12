import { Component, createElement } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ChartPlugin } from '../registry/types.js';
import type { ThemeDefinition } from '../theme/types.js';
import type { TransformedData } from '../transforms/types.js';

export type RenderMode = 'dom' | 'server';

export interface RenderInput {
  plugin: ChartPlugin<unknown, unknown, unknown>;
  data: TransformedData;
  theme: ThemeDefinition;
  width: number;
  height: number;
  config?: Record<string, unknown> | undefined;
  wrapper?: ComponentType<{ children?: ReactNode }> | undefined;
  mode: RenderMode;
}

class Catcher extends Component<{ sink: { error?: unknown; caught: boolean }; children?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.sink.error = error;
    this.props.sink.caught = true;
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function buildElement(input: RenderInput) {
  const { plugin, data, theme, width, height, config } = input;
  const adaptedData = plugin.dataAdapter(data, config);
  const adaptedTheme = plugin.themeAdapter(theme, config);
  const props: Record<string, unknown> = { data: adaptedData, theme: adaptedTheme, width, height };
  if (config !== undefined) props['config'] = config;
  let element: ReactNode = createElement(plugin.Renderer as unknown as ComponentType<Record<string, unknown>>, props);
  if (input.wrapper) element = createElement(input.wrapper, null, element);
  return element;
}

/**
 * Renders the plugin once and returns the resulting markup. Throws whatever the adapters or the
 * renderer throw. In `dom` mode the tree is mounted in a detached container (so effects, such as an
 * imperative D3 mount, run) and unmounted again; in `server` mode `renderToStaticMarkup` is used.
 */
export function renderToMarkup(input: RenderInput): string {
  return normalizeIds(renderRaw(input));
}

/**
 * React's `useId` hands out ids (`:r0:`, `:r1:`, ...) from a counter that differs between roots, so
 * the same tree renders with different ids on every mount. Recharts does the same with a module-global
 * counter (`recharts12-clip`). Renumber both by first appearance.
 */
function normalizeIds(html: string): string {
  const seen = new Map<string, string>();
  return html.replace(/:r[0-9a-z]+:|\brecharts\d+(?=-)/g, (id) => {
    let canonical = seen.get(id);
    if (canonical === undefined) {
      canonical = `id-${seen.size}`;
      seen.set(id, canonical);
    }
    return canonical;
  });
}

function renderRaw(input: RenderInput): string {
  const element = buildElement(input);
  if (input.mode === 'server') return renderToStaticMarkup(element as never);

  const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean | undefined };
  const previousAct = g.IS_REACT_ACT_ENVIRONMENT;
  g.IS_REACT_ACT_ENVIRONMENT = false;
  const sink: { error?: unknown; caught: boolean } = { caught: false };
  const container = document.createElement('div');
  const root = createRoot(container);
  // In development React rethrows a render error through a window `error` event; cancel it so jsdom
  // does not print a second copy. The error still reaches the boundary and is rethrown below.
  const quiet = (event: Event) => event.preventDefault();
  window.addEventListener('error', quiet);
  try {
    flushSync(() => root.render(createElement(Catcher, { sink }, element)));
    if (sink.caught) throw sink.error;
    return container.innerHTML;
  } finally {
    flushSync(() => root.unmount());
    window.removeEventListener('error', quiet);
    g.IS_REACT_ACT_ENVIRONMENT = previousAct;
  }
}
