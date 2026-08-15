import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { WidgetContainer } from '../container.js';
import { ThemeProvider } from '../../theme/provider.js';

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  callback: ResizeObserverCallback;
  disconnected = false;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }

  trigger(rect: { width: number; height: number }): void {
    this.callback(
      [{ contentRect: rect } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

const originalResizeObserver = globalThis.ResizeObserver;

beforeEach(() => {
  FakeResizeObserver.instances = [];
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

function renderContainer(props: Partial<React.ComponentProps<typeof WidgetContainer>>) {
  const children = vi.fn(() => null);
  const utils = render(
    <ThemeProvider theme="light">
      <WidgetContainer data={{ rows: [], fields: [] }} {...props}>
        {children}
      </WidgetContainer>
    </ThemeProvider>,
  );
  return { ...utils, children };
}

describe('WidgetContainer ResizeObserver wiring', () => {
  it('does not create a ResizeObserver when both width and height are numbers', () => {
    const { children } = renderContainer({ width: 300, height: 200 });
    expect(FakeResizeObserver.instances).toHaveLength(0);
    expect(children).toHaveBeenCalledWith({ rows: [], fields: [] }, 300, 200);
  });

  it('renders 0x0 before the ResizeObserver reports a size, when a dimension is a CSS string', () => {
    const { children } = renderContainer({ width: '100%', height: 400 });
    expect(children).toHaveBeenCalledWith({ rows: [], fields: [] }, 0, 400);
  });

  it('updates to the measured size once the ResizeObserver fires', () => {
    const { children } = renderContainer({ width: '100%', height: '100%' });
    expect(children).toHaveBeenLastCalledWith({ rows: [], fields: [] }, 0, 0);

    act(() => {
      FakeResizeObserver.instances[0]?.trigger({ width: 640, height: 480 });
    });

    expect(children).toHaveBeenLastCalledWith({ rows: [], fields: [] }, 640, 480);
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = renderContainer({ width: '100%', height: 400 });
    const observer = FakeResizeObserver.instances[0];
    expect(observer?.disconnected).toBe(false);
    unmount();
    expect(observer?.disconnected).toBe(true);
  });
});
