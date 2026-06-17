import { renderHook, act } from '@testing-library/react';
import { usePaywall } from '../usePaywall';
import * as AuthContext from '../../contexts/AuthContext';
import * as SyncContext from '../../contexts/SyncContext';
import * as router from 'react-router-dom';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

describe('usePaywall', () => {
    const mockNavigate = vi.fn();
    
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.spyOn(router, 'useNavigate').mockReturnValue(mockNavigate);
        vi.spyOn(SyncContext, 'useSync').mockReturnValue({ syncPulse: 0 } as any);
    });

    it('retorna isPro = false si no hay usuario', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ currentUser: null } as any);
        const { result } = renderHook(() => usePaywall());
        expect(result.current.isPro).toBe(false);
        expect(result.current.status).toBe('none');
    });

    it('retorna isPro = true y status = active si el usuario es ADMIN', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ 
            currentUser: { email: 'enzorodriguez31@gmail.com' } 
        } as any);
        
        const { result } = renderHook(() => usePaywall());
        expect(result.current.isPro).toBe(true);
        expect(result.current.status).toBe('active');
        expect(result.current.daysRemaining).toBe(Infinity);
    });

    it('retorna isPro = true si hay suscripcion activa en localStorage', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ 
            currentUser: { email: 'usuario@normal.com' } 
        } as any);

        const futureDate = Date.now() + 1000 * 60 * 60 * 24 * 5; // 5 días
        localStorage.setItem('subscriptionData', JSON.stringify({
            status: 'active',
            expiry: futureDate.toString()
        }));

        const { result } = renderHook(() => usePaywall());
        expect(result.current.isPro).toBe(true);
        expect(result.current.status).toBe('active');
        expect(result.current.daysRemaining).toBe(5);
    });

    it('retorna status = expired si la suscripcion venció', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ 
            currentUser: { email: 'usuario@normal.com' } 
        } as any);

        const pastDate = Date.now() - 1000 * 60 * 60 * 24 * 5; // hace 5 días
        localStorage.setItem('subscriptionData', JSON.stringify({
            status: 'active',
            expiry: pastDate.toString()
        }));

        const { result } = renderHook(() => usePaywall());
        expect(result.current.isPro).toBe(false);
        expect(result.current.status).toBe('expired');
        expect(result.current.daysRemaining).toBe(0);
    });

    it('requirePro ejecuta la accion si es pro', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ 
            currentUser: { email: 'enzorodriguez31@gmail.com' } 
        } as any);

        const { result } = renderHook(() => usePaywall());
        const mockAction = vi.fn();
        
        act(() => {
            result.current.requirePro(mockAction);
        });

        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('requirePro bloquea la accion y muestra popup si no es pro', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ 
            currentUser: { email: 'usuario@normal.com' } 
        } as any);
        
        // Simular que lanza el evento para abrir el modal
        const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

        const { result } = renderHook(() => usePaywall());
        const mockAction = vi.fn();
        
        act(() => {
            result.current.requirePro(mockAction);
        });

        expect(mockAction).not.toHaveBeenCalled();
        expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
        // El evento despachado es 'open-paywall'
    });
});
