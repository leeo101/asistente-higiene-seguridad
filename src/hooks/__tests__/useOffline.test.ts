import { renderHook, act } from '@testing-library/react';
import useOffline, { useConnectionStatus } from '../useOffline';

describe('useOffline', () => {
  let originalOnLine: boolean;

  beforeAll(() => {
    originalOnLine = navigator.onLine;
  });

  afterAll(() => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnLine,
    });
  });

  const setNavigatorOnLine = (value: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value,
    });
  };

  it('should return false if navigator.onLine is true', () => {
    setNavigatorOnLine(true);
    const { result } = renderHook(() => useOffline());
    expect(result.current).toBe(false);
  });

  it('should return true if navigator.onLine is false', () => {
    setNavigatorOnLine(false);
    const { result } = renderHook(() => useOffline());
    expect(result.current).toBe(true);
  });

  it('should update state when online/offline events are triggered', () => {
    setNavigatorOnLine(true);
    const { result } = renderHook(() => useOffline());
    
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(false);
  });
});

describe('useConnectionStatus', () => {
  const setNavigatorOnLine = (value: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value,
    });
  };

  it('should return correct initial status', () => {
    setNavigatorOnLine(true);
    const { result } = renderHook(() => useConnectionStatus());
    expect(result.current).toEqual({
      isOffline: false,
      isOnline: true,
      wasOffline: false,
    });
  });

  it('should update wasOffline flag correctly across events', () => {
    setNavigatorOnLine(true);
    const { result } = renderHook(() => useConnectionStatus());
    
    // Initially online
    expect(result.current.wasOffline).toBe(false);

    // Go offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toEqual({
      isOffline: true,
      isOnline: false,
      wasOffline: true,
    });

    // Go back online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toEqual({
      isOffline: false,
      isOnline: true,
      wasOffline: false, // Reset after reconnecting
    });
  });
});
