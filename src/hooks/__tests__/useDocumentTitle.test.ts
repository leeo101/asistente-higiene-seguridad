import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from '../useDocumentTitle';

describe('useDocumentTitle', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('should set default title when no title is provided', () => {
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe('Asistente HYS');
  });

  it('should set title with base when title is provided', () => {
    renderHook(() => useDocumentTitle('Dashboard'));
    expect(document.title).toBe('Dashboard | Asistente HYS');
  });

  it('should revert to base title on unmount', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Test Page'));
    expect(document.title).toBe('Test Page | Asistente HYS');
    unmount();
    expect(document.title).toBe('Asistente HYS');
  });
});
