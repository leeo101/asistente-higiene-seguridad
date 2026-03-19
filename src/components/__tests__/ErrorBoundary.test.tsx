import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <div data-testid="child">Test Content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders fallback when there is an error', () => {
    // Mock console.error to avoid noise in tests
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Component that throws an error
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/Oops! Algo salió mal/i)).toBeInTheDocument();
    expect(screen.getByText(/Recargar página/i)).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });
});
