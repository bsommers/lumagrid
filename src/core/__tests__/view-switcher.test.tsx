import React from 'react';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewSwitcher } from '../view-switcher.js';
import { ThemeProvider } from '../../theme/provider.js';
import { registerPlugin, __resetRegistryForTests } from '../../registry/index.js';
import type { ChartPlugin } from '../../registry/types.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = { rows: [{ x: 1 }], fields: [{ key: 'x', type: 'number' }] };

function fakePlugin(
  id: string,
  overrides: Partial<ChartPlugin<{ label: string }, { mode: string }, { scale?: number }>> = {},
): ChartPlugin<{ label: string }, { mode: string }, { scale?: number }> {
  return {
    id,
    dataAdapter: () => ({ label: `adapted-${id}` }),
    themeAdapter: () => ({ mode: 'light' }),
    Renderer: ({ data: d, theme, width, height, config }) => (
      <div data-testid={`renderer-${id}`}>
        {d.label}|{theme.mode}|{width}|{height}|{config?.scale ?? 'none'}
      </div>
    ),
    ...overrides,
  };
}

function renderSwitcher(props: Partial<React.ComponentProps<typeof ViewSwitcher>>) {
  return render(
    <ThemeProvider theme="light">
      <ViewSwitcher views={[]} data={data} width={400} height={300} {...props} />
    </ThemeProvider>,
  );
}

describe('ViewSwitcher', () => {
  beforeEach(() => {
    __resetRegistryForTests();
  });

  it('passes dataAdapter/themeAdapter output and dimensions through to the plugin Renderer', () => {
    registerPlugin(fakePlugin('vs-test-basic'));
    renderSwitcher({ views: [{ id: 'vs-test-basic', config: { scale: 2 } }] });

    expect(screen.getByTestId('renderer-vs-test-basic')).toHaveTextContent(
      'adapted-vs-test-basic|light|400|264|2',
    );
  });

  it('shows a fallback message when the active view has no registered plugin', () => {
    renderSwitcher({ views: [{ id: 'vs-test-unregistered' }] });

    expect(screen.getByText(/No plugin registered for "vs-test-unregistered"/)).toBeInTheDocument();
  });

  it('switches the rendered plugin when a different tab is clicked', () => {
    registerPlugin(fakePlugin('vs-test-tab-a'));
    registerPlugin(fakePlugin('vs-test-tab-b'));
    const onViewChange = vi.fn();
    renderSwitcher({
      views: [{ id: 'vs-test-tab-a' }, { id: 'vs-test-tab-b' }],
      onViewChange,
    });

    expect(screen.getByTestId('renderer-vs-test-tab-a')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'vs-test-tab-b' }));

    expect(screen.getByTestId('renderer-vs-test-tab-b')).toBeInTheDocument();
    expect(onViewChange).toHaveBeenCalledWith('vs-test-tab-b');
  });

  it('prefers view label, then plugin label, then id for the tab text', () => {
    registerPlugin(fakePlugin('vs-test-label', { label: 'Plugin Label' }));
    renderSwitcher({ views: [{ id: 'vs-test-label', label: 'View Label' }] });

    expect(screen.getByRole('tab', { name: 'View Label' })).toBeInTheDocument();
  });
});
