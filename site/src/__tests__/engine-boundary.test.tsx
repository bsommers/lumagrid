import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EngineErrorBoundary } from '../lib/webgl';

function Boom(): React.ReactElement {
  throw new Error("reading 'S'");
}

afterEach(() => vi.restoreAllMocks());

describe('EngineErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(<EngineErrorBoundary engine="Reagraph"><p>fine</p></EngineErrorBoundary>);
    expect(screen.getByText('fine')).toBeInTheDocument();
  });

  it('shows a readable notice with the requirement and error when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<EngineErrorBoundary engine="Reagraph" requirement="Reagraph 4.x needs React 19."><Boom /></EngineErrorBoundary>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Reagraph could not start in this browser.');
    expect(alert).toHaveTextContent('needs React 19');
    expect(alert).toHaveTextContent("reading 'S'");
  });

  it('omits the requirement text when none is given', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<EngineErrorBoundary engine="Foo"><Boom /></EngineErrorBoundary>);
    expect(screen.getByRole('alert')).not.toHaveTextContent('needs');
  });
});
